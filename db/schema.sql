-- =====================================================================
--  StreamOut — esquema PostgreSQL (16+)
--  Utilizadores · 2FA · Catálogo · Stock de gift cards · Encomendas
--  Pagamentos Multicaixa Express · Assinaturas cifradas · Bundle · Faturas
-- ---------------------------------------------------------------------
--  Convenções de segurança
--  • *_ct  (bytea)  = AES-256-GCM, formato: [versão 1B][iv 12B][ciphertext][tag 16B]
--                     AAD = '<tabela>:<coluna>:<id da linha>' → impede trocar
--                     ciphertexts entre linhas. A cifra é feita NA APLICAÇÃO;
--                     a BD nunca vê chaves nem texto em claro.
--  • key_id         = versão da DEK (envelope encryption via KMS) → rotação
--  • *_bidx (bytea) = blind index HMAC-SHA256(pepper, valor normalizado)
--                     → pesquisa exacta sem decifrar (ex.: telefone)
--  • password_hash  = Argon2id em formato PHC ($argon2id$v=19$m=...,t=...,p=...$...)
--  • Dados de cartão: NÃO EXISTEM neste esquema. O PIN do Multicaixa Express
--    é introduzido na app do cliente e nunca passa pelos nossos servidores.
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;    -- e-mail sem distinção de maiúsculas

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
CREATE TYPE user_role               AS ENUM ('customer', 'operator', 'admin');
CREATE TYPE user_status             AS ENUM ('pending_verification', 'active', 'locked', 'disabled');
CREATE TYPE contact_channel         AS ENUM ('email', 'sms');
CREATE TYPE otp_purpose             AS ENUM ('login', 'step_up', 'email_verification', 'phone_verification', 'password_reset');
CREATE TYPE product_kind            AS ENUM ('gift_card', 'subscription', 'bundle');
CREATE TYPE fulfillment_mode        AS ENUM ('stock_only', 'on_demand_only', 'stock_then_on_demand');
CREATE TYPE fulfillment_route       AS ENUM ('stock', 'on_demand', 'bundle_parent');
CREATE TYPE code_status             AS ENUM ('available', 'reserved', 'sold', 'void');
CREATE TYPE order_status            AS ENUM ('pending_payment', 'paid', 'fulfilling', 'fulfilled', 'cancelled', 'expired', 'refunded');
CREATE TYPE item_fulfillment_status AS ENUM ('pending', 'reserved', 'awaiting_purchase', 'delivered', 'failed', 'refunded');
CREATE TYPE payment_status          AS ENUM ('initiated', 'awaiting_customer', 'confirmed', 'rejected', 'expired', 'refunded');
CREATE TYPE subscription_status     AS ENUM ('active', 'expired', 'revoked');

CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- ---------------------------------------------------------------------
-- Chaves de cifra (envelope encryption) — só metadados e DEKs embrulhadas
-- ---------------------------------------------------------------------
CREATE TABLE encryption_keys (
  id           smallint PRIMARY KEY,
  purpose      text NOT NULL CHECK (purpose IN ('pii', 'credentials', 'gift_codes')),
  kms_key_ref  text NOT NULL,                 -- URI/ARN da chave mestra no KMS (nunca a chave)
  wrapped_dek  bytea NOT NULL,                -- DEK AES-256 cifrada pelo KMS
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'decrypt_only', 'retired')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  rotated_at   timestamptz
);
-- Uma única chave activa (para cifrar) por finalidade; as antigas ficam 'decrypt_only'
CREATE UNIQUE INDEX encryption_keys_one_active ON encryption_keys (purpose) WHERE status = 'active';

-- ---------------------------------------------------------------------
-- Utilizadores, OTP e sessões
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                citext NOT NULL UNIQUE,
  email_verified_at    timestamptz,
  full_name_ct         bytea,
  phone_ct             bytea,                            -- telefone E.164 cifrado
  phone_bidx           bytea UNIQUE,                     -- blind index para login/pesquisa
  phone_last4          char(4),                          -- UI: "•••• 4417"
  phone_verified_at    timestamptz,
  pii_key_id           smallint REFERENCES encryption_keys(id),
  password_hash        text NOT NULL CHECK (password_hash LIKE '$argon2id$%'),
  password_changed_at  timestamptz NOT NULL DEFAULT now(),
  mfa_channel          contact_channel NOT NULL DEFAULT 'email',  -- 2FA obrigatório: só muda o canal
  role                 user_role NOT NULL DEFAULT 'customer',
  status               user_status NOT NULL DEFAULT 'pending_verification',
  preferred_locale     text NOT NULL DEFAULT 'pt' CHECK (preferred_locale IN ('pt', 'en')),
  nif                  text,                             -- opcional, para faturas nominativas
  failed_login_count   smallint NOT NULL DEFAULT 0,
  locked_until         timestamptz,
  last_login_at        timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_sms_needs_verified_phone CHECK (mfa_channel <> 'sms' OR phone_verified_at IS NOT NULL),
  CONSTRAINT users_pii_key_when_encrypted   CHECK ((full_name_ct IS NULL AND phone_ct IS NULL) OR pii_key_id IS NOT NULL)
);
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE otp_challenges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose       otp_purpose NOT NULL,
  channel       contact_channel NOT NULL,
  code_hash     bytea NOT NULL,          -- HMAC-SHA256(segredo, id || código) — nunca o código em claro
  attempts      smallint NOT NULL DEFAULT 0,
  max_attempts  smallint NOT NULL DEFAULT 5,
  expires_at    timestamptz NOT NULL,    -- tipicamente now() + 5 min
  consumed_at   timestamptz,
  ip            inet,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT otp_attempts_bounded CHECK (attempts BETWEEN 0 AND max_attempts)
);
-- No máximo um desafio aberto por utilizador e finalidade (pedir novo invalida o anterior)
CREATE UNIQUE INDEX otp_one_open_per_purpose ON otp_challenges (user_id, purpose) WHERE consumed_at IS NULL;

CREATE TABLE sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash       bytea NOT NULL UNIQUE,   -- SHA-256 do token opaco guardado em cookie httpOnly
  mfa_verified_at  timestamptz,             -- NULL = sessão parcial (só password) → sem acesso
  step_up_until    timestamptz,             -- janela curta após novo OTP p/ revelar credenciais
  ip               inet,
  user_agent       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  revoked_at       timestamptz
);
CREATE INDEX sessions_user_active ON sessions (user_id) WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------
CREATE TABLE providers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,            -- 'netflix', 'spotify', 'icloud', 'playstation'
  name       text NOT NULL,
  logo_url   text,
  is_active  boolean NOT NULL DEFAULT true
);

CREATE TABLE products (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id          uuid REFERENCES providers(id),     -- NULL no Bundle StreamOut (produto da casa)
  sku                  text NOT NULL UNIQUE,
  slug                 text NOT NULL UNIQUE,
  kind                 product_kind NOT NULL,
  name_pt              text NOT NULL,
  name_en              text NOT NULL,
  description_pt       text,
  description_en       text,
  price_aoa            numeric(14,2) NOT NULL CHECK (price_aoa >= 0),
  face_value           text,                               -- ex.: 'USD 25' (gift cards)
  duration_days        integer CHECK (duration_days > 0),  -- assinaturas e bundle
  fulfillment_mode     fulfillment_mode NOT NULL,
  on_demand_sla        interval NOT NULL DEFAULT interval '30 minutes',
  bundle_discount_pct  numeric(5,2) CHECK (bundle_discount_pct BETWEEN 0 AND 15),
  discount_eligible    boolean NOT NULL DEFAULT true,      -- aceita o desconto do Bundle?
  is_active            boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_bundle_pct_only_on_bundle CHECK ((kind = 'bundle') = (bundle_discount_pct IS NOT NULL)),
  CONSTRAINT products_bundle_not_discounted     CHECK (kind <> 'bundle' OR NOT discount_eligible),
  CONSTRAINT products_duration_required         CHECK (kind = 'gift_card' OR duration_days IS NOT NULL),
  CONSTRAINT products_provider_required         CHECK (kind = 'bundle' OR provider_id IS NOT NULL)
);
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE bundle_items (
  bundle_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  item_id    uuid NOT NULL REFERENCES products(id),
  quantity   smallint NOT NULL DEFAULT 1 CHECK (quantity > 0),
  PRIMARY KEY (bundle_id, item_id),
  CHECK (bundle_id <> item_id)
);

-- ---------------------------------------------------------------------
-- Encomendas
-- ---------------------------------------------------------------------
CREATE SEQUENCE order_number_seq;

CREATE TABLE orders (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number            text NOT NULL UNIQUE
                          DEFAULT 'SO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 6, '0'),
  user_id                 uuid NOT NULL REFERENCES users(id),
  status                  order_status NOT NULL DEFAULT 'pending_payment',
  currency                char(3) NOT NULL DEFAULT 'AOA' CHECK (currency = 'AOA'),
  subtotal_aoa            numeric(14,2) NOT NULL CHECK (subtotal_aoa >= 0),
  discount_aoa            numeric(14,2) NOT NULL DEFAULT 0,
  total_aoa               numeric(14,2) NOT NULL,
  applied_entitlement_id  uuid,                         -- FK adicionada mais abaixo
  locale                  text NOT NULL DEFAULT 'pt' CHECK (locale IN ('pt', 'en')),
  idempotency_key         uuid NOT NULL UNIQUE,         -- duplo clique ≠ duas encomendas
  payment_deadline        timestamptz NOT NULL,         -- após isto, liberta stock reservado
  paid_at                 timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_discount_bounds CHECK (discount_aoa BETWEEN 0 AND subtotal_aoa),
  CONSTRAINT orders_total_math      CHECK (total_aoa = subtotal_aoa - discount_aoa)
);
CREATE INDEX orders_by_user ON orders (user_id, created_at DESC);
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE order_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  parent_item_id      uuid REFERENCES order_items(id),   -- componentes de um Bundle
  product_id          uuid NOT NULL REFERENCES products(id),
  quantity            smallint NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_aoa      numeric(14,2) NOT NULL CHECK (unit_price_aoa >= 0),
  discount_pct        numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 15),
  line_total_aoa      numeric(14,2) NOT NULL CHECK (line_total_aoa >= 0),
  route               fulfillment_route NOT NULL,        -- decidido no checkout: stock ou encomenda
  fulfillment_status  item_fulfillment_status NOT NULL DEFAULT 'pending',
  sla_deadline        timestamptz,                       -- paid_at + on_demand_sla
  assigned_operator   uuid REFERENCES users(id),
  delivered_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT order_items_sla_only_on_demand CHECK (sla_deadline IS NULL OR route = 'on_demand')
);
CREATE INDEX order_items_by_order ON order_items (order_id);
-- Fila da equipa de compras, ordenada pelo prazo dos 30 min
CREATE INDEX order_items_on_demand_queue ON order_items (sla_deadline) WHERE fulfillment_status = 'awaiting_purchase';
CREATE TRIGGER order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- Stock de gift cards (códigos pré-comprados, cifrados)
-- ---------------------------------------------------------------------
CREATE TABLE gift_card_codes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        uuid NOT NULL REFERENCES products(id),
  code_ct           bytea NOT NULL,
  pin_ct            bytea,                              -- alguns cartões têm PIN/serial adicional
  key_id            smallint NOT NULL REFERENCES encryption_keys(id),
  code_fingerprint  bytea NOT NULL UNIQUE,              -- HMAC do código: bloqueia duplicados sem o expor
  status            code_status NOT NULL DEFAULT 'available',
  order_item_id     uuid REFERENCES order_items(id),
  reserved_until    timestamptz,
  sold_at           timestamptz,
  code_expires_at   timestamptz,                        -- validade do próprio cartão, se houver
  cost_aoa          numeric(14,2),                      -- custo de aquisição (cálculo de margem)
  supplier_ref      text,
  batch_ref         text,
  imported_by       uuid REFERENCES users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT codes_link_when_taken  CHECK ((status IN ('reserved', 'sold')) = (order_item_id IS NOT NULL)),
  CONSTRAINT codes_reservation_ttl  CHECK ((status = 'reserved') = (reserved_until IS NOT NULL)),
  CONSTRAINT codes_sold_timestamp   CHECK ((status = 'sold') = (sold_at IS NOT NULL))
);
CREATE INDEX gift_codes_available ON gift_card_codes (product_id, code_expires_at NULLS LAST, created_at) WHERE status = 'available';
CREATE INDEX gift_codes_reserved  ON gift_card_codes (reserved_until) WHERE status = 'reserved';
CREATE TRIGGER gift_card_codes_updated_at BEFORE UPDATE ON gift_card_codes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Reserva atómica e concorrente (SKIP LOCKED: dois checkouts nunca levam o mesmo código).
-- FEFO: sai primeiro o que expira primeiro. Devolve quantos conseguiu reservar;
-- se < pedido, a aplicação passa o resto para 'on_demand' (se o produto o permitir) ou recusa.
CREATE FUNCTION reserve_gift_codes(p_product uuid, p_item uuid, p_qty int, p_ttl interval DEFAULT interval '15 minutes')
RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  n int;
BEGIN
  WITH picked AS (
    SELECT id FROM gift_card_codes
    WHERE product_id = p_product
      AND status = 'available'
      AND (code_expires_at IS NULL OR code_expires_at > now() + interval '30 days')
    ORDER BY code_expires_at NULLS LAST, created_at
    LIMIT p_qty
    FOR UPDATE SKIP LOCKED
  )
  UPDATE gift_card_codes g
     SET status = 'reserved', order_item_id = p_item, reserved_until = now() + p_ttl
    FROM picked
   WHERE g.id = picked.id;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Chamada no MESMO transacção que confirma o pagamento (após webhook validado)
CREATE FUNCTION mark_gift_codes_sold(p_item uuid) RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  n int;
BEGIN
  UPDATE gift_card_codes
     SET status = 'sold', sold_at = now(), reserved_until = NULL
   WHERE order_item_id = p_item AND status = 'reserved';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Job periódico (cada minuto): devolve ao stock reservas de pagamentos não concluídos
CREATE FUNCTION release_expired_reservations() RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  n int;
BEGIN
  UPDATE gift_card_codes
     SET status = 'available', order_item_id = NULL, reserved_until = NULL
   WHERE status = 'reserved' AND reserved_until < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Disponibilidade para a vitrine (nunca expõe códigos)
CREATE VIEW product_availability AS
SELECT p.id AS product_id,
       p.fulfillment_mode,
       count(c.id) AS stock_available,
       CASE
         WHEN count(c.id) > 0                   THEN 'in_stock'
         WHEN p.fulfillment_mode <> 'stock_only' THEN 'on_demand'   -- "entrega em até 30 min"
         ELSE 'unavailable'
       END AS availability
  FROM products p
  LEFT JOIN gift_card_codes c ON c.product_id = p.id AND c.status = 'available'
 WHERE p.is_active
 GROUP BY p.id, p.fulfillment_mode;

-- ---------------------------------------------------------------------
-- Pagamentos — Multicaixa Express
-- ---------------------------------------------------------------------
CREATE TABLE payments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid NOT NULL REFERENCES orders(id),
  method             text NOT NULL DEFAULT 'multicaixa_express' CHECK (method IN ('multicaixa_express')),
  amount_aoa         numeric(14,2) NOT NULL CHECK (amount_aoa > 0),
  payer_phone_ct     bytea NOT NULL,          -- número onde chega o push (cifrado)
  payer_phone_last4  char(4) NOT NULL,
  key_id             smallint NOT NULL REFERENCES encryption_keys(id),
  gateway_reference  text UNIQUE,             -- ID da transacção devolvido pelo gateway
  status             payment_status NOT NULL DEFAULT 'initiated',
  failure_reason     text,
  expires_at         timestamptz NOT NULL,    -- janela para o cliente confirmar com o PIN na app
  confirmed_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_confirmed_ts CHECK ((status = 'confirmed') = (confirmed_at IS NOT NULL) OR status = 'refunded')
);
-- No máximo um pagamento em curso e um confirmado por encomenda
CREATE UNIQUE INDEX payments_one_open      ON payments (order_id) WHERE status IN ('initiated', 'awaiting_customer');
CREATE UNIQUE INDEX payments_one_confirmed ON payments (order_id) WHERE status = 'confirmed';
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Registo bruto de webhooks: idempotência + auditoria. Um pagamento só é dado como
-- confirmado se (1) a assinatura é válida E (2) a consulta directa à API do gateway confirma.
CREATE TABLE payment_webhook_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider             text NOT NULL,
  event_id             text NOT NULL,
  gateway_reference    text,
  signature_valid      boolean NOT NULL,
  confirmed_by_requery boolean,
  payload              jsonb NOT NULL,
  source_ip            inet,
  received_at          timestamptz NOT NULL DEFAULT now(),
  processed_at         timestamptz,
  processing_error     text,
  UNIQUE (provider, event_id)
);
CREATE INDEX webhook_events_unprocessed ON payment_webhook_events (received_at) WHERE processed_at IS NULL;

-- ---------------------------------------------------------------------
-- Assinaturas do cliente (dashboard) — credenciais cifradas
-- ---------------------------------------------------------------------
CREATE TABLE customer_subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id),
  order_item_id       uuid NOT NULL REFERENCES order_items(id),
  product_id          uuid NOT NULL REFERENCES products(id),
  status              subscription_status NOT NULL DEFAULT 'active',
  starts_at           timestamptz NOT NULL,
  expires_at          timestamptz NOT NULL,
  credentials_ct      bytea,       -- JSON {login, password, perfil, notas} cifrado; NULL no Bundle-pai
  key_id              smallint REFERENCES encryption_keys(id),
  credentials_set_by  uuid REFERENCES users(id),   -- operador que registou (modo encomenda)
  credentials_set_at  timestamptz,
  last_revealed_at    timestamptz,                 -- revelar exige step-up OTP + fica em audit_log
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subs_period_valid   CHECK (expires_at > starts_at),
  CONSTRAINT subs_key_with_ct    CHECK ((credentials_ct IS NULL) = (key_id IS NULL))
);
CREATE INDEX subs_by_user    ON customer_subscriptions (user_id, expires_at DESC);
CREATE INDEX subs_expiring   ON customer_subscriptions (expires_at) WHERE status = 'active';
CREATE TRIGGER customer_subscriptions_updated_at BEFORE UPDATE ON customer_subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Contador / barra de progresso do dashboard (sem credenciais)
CREATE VIEW customer_subscription_progress AS
SELECT s.id,
       s.user_id,
       s.product_id,
       s.status,
       s.starts_at,
       s.expires_at,
       greatest(s.expires_at - now(), interval '0') AS time_remaining,
       round(
         least(100, greatest(0,
           extract(epoch FROM now() - s.starts_at) * 100
           / nullif(extract(epoch FROM s.expires_at - s.starts_at), 0)
         )), 1
       ) AS elapsed_pct
  FROM customer_subscriptions s
 WHERE s.status <> 'revoked';

-- Alertas de expiração (o worker envia os que estão em atraso: scheduled_for <= now() AND sent_at IS NULL)
CREATE TABLE subscription_alerts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id  uuid NOT NULL REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
  lead_label       text NOT NULL,          -- '90d', '60d', '30d', '7d', '1d', '0d'
  scheduled_for    timestamptz NOT NULL,
  channel          contact_channel NOT NULL DEFAULT 'email',
  sent_at          timestamptz,
  attempts         smallint NOT NULL DEFAULT 0,
  last_error       text,
  UNIQUE (subscription_id, lead_label, channel)
);
CREATE INDEX subscription_alerts_due ON subscription_alerts (scheduled_for) WHERE sent_at IS NULL;

-- Agenda os alertas automaticamente. Assinaturas anuais recebem aviso a 90/60/30 dias
-- ("meses de antecedência"); mensais só a 7/1 dias — regra: o aviso tem de cair depois
-- de 1/3 da duração, para não avisar no próprio dia da compra.
CREATE FUNCTION schedule_subscription_alerts() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  o record;
BEGIN
  DELETE FROM subscription_alerts WHERE subscription_id = NEW.id AND sent_at IS NULL;

  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  FOR o IN
    SELECT * FROM (VALUES
      ('90d', interval '90 days'), ('60d', interval '60 days'), ('30d', interval '30 days'),
      ('7d',  interval '7 days'),  ('1d',  interval '1 day'),   ('0d',  interval '0')
    ) AS t(label, lead_time)
  LOOP
    IF NEW.expires_at - o.lead_time > NEW.starts_at + (NEW.expires_at - NEW.starts_at) / 3
       AND NEW.expires_at - o.lead_time > now() THEN
      INSERT INTO subscription_alerts (subscription_id, lead_label, scheduled_for)
      VALUES (NEW.id, o.label, NEW.expires_at - o.lead_time)
      ON CONFLICT (subscription_id, lead_label, channel) DO NOTHING;
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER customer_subscriptions_alerts
AFTER INSERT OR UPDATE OF expires_at, status ON customer_subscriptions
FOR EACH ROW EXECUTE FUNCTION schedule_subscription_alerts();

-- ---------------------------------------------------------------------
-- Bundle StreamOut → direito a desconto (até 15%) enquanto o Bundle estiver activo
-- ---------------------------------------------------------------------
CREATE TABLE discount_entitlements (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES users(id),
  source_subscription_id  uuid NOT NULL UNIQUE REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
  discount_pct            numeric(5,2) NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 15),
  valid_from              timestamptz NOT NULL,
  valid_until             timestamptz NOT NULL,
  revoked_at              timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until > valid_from)
);
CREATE INDEX entitlements_active ON discount_entitlements (user_id, valid_until) WHERE revoked_at IS NULL;

ALTER TABLE orders
  ADD CONSTRAINT orders_applied_entitlement_fk
  FOREIGN KEY (applied_entitlement_id) REFERENCES discount_entitlements(id);

-- Concede o desconto quando nasce a assinatura do Bundle; revoga se a assinatura for revogada
CREATE FUNCTION sync_bundle_entitlement() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  pct numeric(5,2);
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT bundle_discount_pct INTO pct FROM products WHERE id = NEW.product_id AND kind = 'bundle';
    IF pct IS NOT NULL AND pct > 0 THEN
      INSERT INTO discount_entitlements (user_id, source_subscription_id, discount_pct, valid_from, valid_until)
      VALUES (NEW.user_id, NEW.id, pct, NEW.starts_at, NEW.expires_at)
      ON CONFLICT (source_subscription_id) DO NOTHING;
    END IF;
  ELSIF NEW.status = 'revoked' AND OLD.status <> 'revoked' THEN
    UPDATE discount_entitlements SET revoked_at = now()
     WHERE source_subscription_id = NEW.id AND revoked_at IS NULL;
  ELSIF NEW.expires_at <> OLD.expires_at THEN
    UPDATE discount_entitlements SET valid_until = NEW.expires_at
     WHERE source_subscription_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER customer_subscriptions_bundle_entitlement
AFTER INSERT OR UPDATE OF status, expires_at ON customer_subscriptions
FOR EACH ROW EXECUTE FUNCTION sync_bundle_entitlement();

-- Desconto em vigor para um utilizador (o checkout calcula SEMPRE no servidor)
CREATE FUNCTION active_bundle_discount(p_user uuid) RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT coalesce(max(discount_pct), 0)
    FROM discount_entitlements
   WHERE user_id = p_user
     AND revoked_at IS NULL
     AND now() >= valid_from
     AND now() <  valid_until
$$;

-- ---------------------------------------------------------------------
-- Faturas — emitidas pelo software de faturação certificado pela AGT (via API);
-- aqui guardamos apenas a referência, o PDF devolvido e o estado do envio por e-mail.
-- ---------------------------------------------------------------------
CREATE TABLE invoices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              uuid NOT NULL UNIQUE REFERENCES orders(id),
  certified_provider    text NOT NULL,          -- software certificado integrado
  external_document_id  text NOT NULL,
  document_number       text NOT NULL UNIQUE,   -- ex.: 'FR SO2026/123', atribuído pelo software certificado
  agt_reference         text,                   -- referência/validação da AGT, quando devolvida
  customer_nif          text,
  total_aoa             numeric(14,2) NOT NULL,
  pdf_object_key        text,                   -- storage privado (R2/S3), servido por URL assinada
  pdf_sha256            bytea,
  issued_at             timestamptz NOT NULL,
  emailed_at            timestamptz,
  email_attempts        smallint NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (certified_provider, external_document_id)
);
CREATE INDEX invoices_email_pending ON invoices (created_at) WHERE emailed_at IS NULL;

-- ---------------------------------------------------------------------
-- Auditoria (append-only) — revelar credenciais, importar códigos, confirmar pagamentos…
-- ---------------------------------------------------------------------
CREATE TABLE audit_log (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at    timestamptz NOT NULL DEFAULT now(),
  actor_user_id  uuid REFERENCES users(id),
  actor_type     text NOT NULL CHECK (actor_type IN ('customer', 'operator', 'admin', 'system', 'webhook')),
  action         text NOT NULL,              -- 'credentials.revealed', 'gift_code.imported', 'payment.confirmed'
  entity_type    text NOT NULL,
  entity_id      text,
  ip             inet,
  user_agent     text,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb   -- NUNCA segredos nem dados cifrados
);
CREATE INDEX audit_log_entity ON audit_log (entity_type, entity_id, occurred_at DESC);

CREATE FUNCTION forbid_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log é append-only';
END $$;

CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION forbid_audit_mutation();

COMMIT;

-- ---------------------------------------------------------------------
-- Permissões (exemplo — ajustar aos nomes reais dos roles)
-- ---------------------------------------------------------------------
-- CREATE ROLE streamout_app LOGIN PASSWORD '...';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO streamout_app;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO streamout_app;
-- REVOKE UPDATE, DELETE ON audit_log FROM streamout_app;
-- REVOKE DELETE ON payments, payment_webhook_events, invoices FROM streamout_app;
-- -- encryption_keys só legível pelo serviço de cifra, nunca pela app web:
-- REVOKE ALL ON encryption_keys FROM streamout_app;
