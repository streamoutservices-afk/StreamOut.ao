# StreamOut — Arquitetura

> *Oferecendo o melhor do entretenimento*
> Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL 16 · Cloudflare

## 1. Estrutura de diretórios

```
streamout/
├── src/
│   ├── app/
│   │   ├── [locale]/                          # /pt/... e /en/...
│   │   │   ├── layout.tsx                     # html lang, ThemeProvider, NextIntl, Header
│   │   │   ├── page.tsx                       # Home
│   │   │   ├── (shop)/
│   │   │   │   ├── gift-cards/page.tsx
│   │   │   │   ├── subscriptions/page.tsx
│   │   │   │   ├── bundle/page.tsx            # Bundle StreamOut (−15%)
│   │   │   │   ├── p/[slug]/page.tsx          # Produto: stock / "entrega em 30 min" / esgotado
│   │   │   │   └── cart/page.tsx
│   │   │   ├── (checkout)/checkout/
│   │   │   │   ├── page.tsx                   # Resumo + nº Multicaixa Express + Turnstile
│   │   │   │   └── [orderId]/
│   │   │   │       ├── pending/page.tsx       # "Confirme no telemóvel" + polling do estado
│   │   │   │       └── success/page.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx             # e-mail + password (Turnstile)
│   │   │   │   ├── verify/page.tsx            # OTP obrigatório (e-mail ou SMS)
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── reset-password/page.tsx
│   │   │   ├── (account)/dashboard/
│   │   │   │   ├── page.tsx                   # Assinaturas activas + barras de expiração
│   │   │   │   ├── subscriptions/[id]/page.tsx# Revelar credenciais (step-up OTP)
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── invoices/page.tsx
│   │   │   │   └── security/page.tsx          # canal 2FA, sessões activas
│   │   │   └── (staff)/admin/
│   │   │       ├── queue/page.tsx             # Fila de encomendas c/ contador dos 30 min
│   │   │       ├── stock/page.tsx             # Importar códigos (CSV → cifrados)
│   │   │       ├── products/page.tsx
│   │   │       └── orders/page.tsx
│   │   ├── api/
│   │   │   ├── webhooks/multicaixa/route.ts   # assinatura HMAC + re-consulta + idempotência
│   │   │   ├── orders/[id]/status/route.ts    # polling da página "pending"
│   │   │   ├── invoices/[id]/route.ts         # URL assinada para o PDF (só o dono)
│   │   │   └── cron/[job]/route.ts            # gatilhos protegidos por segredo
│   │   └── globals.css                        # tokens da marca + utilitário .glass
│   │
│   ├── components/
│   │   ├── brand/Logo.tsx
│   │   ├── layout/        Header · LanguageSwitcher · ThemeToggle · Footer
│   │   ├── providers/     ThemeProvider
│   │   ├── ui/            GlassButton · GlassCard · Badge · Input · Dialog · Skeleton
│   │   ├── shop/          ProductCard · AvailabilityBadge · PriceTag · BundleHero
│   │   ├── checkout/      McxPhoneForm · PaymentPending · TurnstileWidget
│   │   ├── dashboard/     SubscriptionCard · ExpiryProgress · Countdown · CredentialReveal
│   │   └── admin/         OnDemandQueue · SlaTimer · CodeImportForm
│   │
│   ├── server/                                # só servidor (import "server-only")
│   │   ├── db/            client.ts · queries/*.ts
│   │   ├── crypto/
│   │   │   ├── envelope.ts                    # AES-256-GCM + DEK embrulhada pelo KMS
│   │   │   ├── password.ts                    # Argon2id (@node-rs/argon2)
│   │   │   └── blind-index.ts                 # HMAC-SHA256 para pesquisa
│   │   ├── auth/          session.ts · otp.ts · require-mfa.ts · step-up.ts
│   │   ├── security/      turnstile.ts · rate-limit.ts · csp.ts
│   │   ├── payments/multicaixa/
│   │   │   ├── client.ts                      # iniciar pagamento / consultar estado
│   │   │   ├── webhook.ts                     # verificar assinatura, normalizar evento
│   │   │   └── mock.ts                        # simulador local (aprovação/rejeição/timeout)
│   │   ├── orders/        checkout.ts · fulfill.ts · on-demand.ts
│   │   ├── pricing/       bundle-discount.ts  # desconto calculado só no servidor
│   │   ├── invoicing/     certified-provider.ts · send-invoice.ts
│   │   └── notify/        email.ts · sms.ts · templates/{pt,en}/
│   │
│   ├── i18n/              routing.ts · navigation.ts · request.ts
│   ├── lib/utils/         cn.ts · format-aoa.ts · dates.ts
│   └── proxy.ts           # next-intl + guarda de sessão + CSP com nonce
│
├── workers/                                   # pg-boss (fila em Postgres, sem infra extra)
│   ├── release-reservations.ts                # cada minuto
│   ├── payment-timeouts.ts
│   ├── on-demand-sla.ts                       # alerta a equipa aos 20 min, escala aos 30
│   ├── expiry-alerts.ts                       # envia subscription_alerts em atraso
│   └── invoice-dispatch.ts                    # emite fatura + envia PDF por e-mail
├── messages/              pt.json · en.json
├── db/                    schema.sql · migrations/
└── infra/cloudflare/      waf-rules.md · rate-limits.md
```

Regra simples: tudo o que toca em segredos, cifra ou base de dados fica em `src/server/`
com `import "server-only"`, para nunca acabar num bundle de cliente por engano.

## 2. Fluxo de pagamento Multicaixa Express

```
Checkout ──► orders(pending_payment) + reserva de códigos (15 min, SKIP LOCKED)
        ──► payments(initiated) ──► API do gateway ──► push no telemóvel do cliente
        ──► payments(awaiting_customer)      [cliente confirma com PIN na app dele]
Gateway ──► POST /api/webhooks/multicaixa
            1. grava em payment_webhook_events (UNIQUE provider+event_id → idempotente)
            2. verifica assinatura HMAC (comparação em tempo constante)
            3. RE-CONSULTA o estado na API do gateway (não confiar só no corpo)
            4. confere valor + referência com o pagamento guardado
            5. numa única transacção: payment confirmed → order paid →
               mark_gift_codes_sold() / itens on_demand → awaiting_purchase (+ sla_deadline)
            6. enfileira emissão da fatura e e-mail
```

Notas:
- O PIN nunca passa pelos nossos servidores; não há dados de cartão no sistema.
- Se o webhook chegar depois de a reserva expirar, o item passa para `on_demand` em vez de falhar.
- A rota do webhook fica fora do Turnstile, mas protegida por IP allowlist do gateway na Cloudflare.

## 3. Stock e modo encomenda

| Situação | `availability` | Comportamento |
|---|---|---|
| Há códigos | `in_stock` | Entrega imediata após pagamento |
| Sem códigos, modo `stock_then_on_demand` ou `on_demand_only` | `on_demand` | Badge "Entrega em até 30 min"; vai para a fila da equipa |
| Sem códigos, modo `stock_only` | `unavailable` | Botão de compra desactivado |

O operador regista o código/credenciais no painel → é cifrado na hora → o cliente é notificado
e vê-o no dashboard. Tudo fica em `audit_log`.

## 4. Segurança (Zero-Trust)

**Cloudflare**
- WAF com regras geridas + regras próprias para `/api/*`.
- Rate limiting: login 5/min por IP, pedido de OTP 3/10 min por conta, checkout 10/min, webhooks só da allowlist.
- Turnstile em: registo, login, pedido de OTP, reset de password, checkout. O token é **sempre validado no servidor** (`siteverify`).

**Credenciais e dados**
- Passwords: Argon2id (ex.: m=64 MiB, t=3, p=1), com re-hash automático quando os parâmetros sobem.
- AES-256-GCM com envelope encryption: a DEK é guardada embrulhada pelo KMS; rotação via `key_id`.
- AAD liga cada ciphertext à sua linha (troca de valores entre linhas falha a decifrar).
- Revelar credenciais exige novo OTP (`step_up_until`, ~5 min) e fica registado.

**Autenticação**
- 2FA obrigatório: a sessão só fica válida com `mfa_verified_at` preenchido.
- OTP de 6 dígitos, 5 min, máx. 5 tentativas, guardado como HMAC (nunca em claro).
- Cookies `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax`; rotação do token após o OTP.
- Para operadores e admins, recomendo TOTP ou passkeys em vez de SMS (o SMS é vulnerável a SIM-swap).

## 5. Bundle StreamOut

Comprar o Bundle cria uma `customer_subscription` que, por trigger, gera um `discount_entitlement`
(até 15%) válido enquanto o Bundle estiver activo. No checkout, `active_bundle_discount(user)`
aplica o desconto aos produtos com `discount_eligible = true`. O valor nunca vem do cliente.

## 6. Pontos a confirmar antes de ir para produção

1. **Faturação AGT** — a fatura não deve ser gerada "à mão" em PDF. Desde 1 jan. 2026 a faturação
   electrónica é obrigatória para grandes contribuintes, estendendo-se às restantes empresas em fases,
   sempre via software certificado pela AGT. O desenho aqui assume integração por API com um desses
   softwares: ele emite, devolve o PDF e nós enviamos por e-mail.
2. **Termos dos serviços** — gift cards e códigos oficiais são revenda normal. Entregar credenciais
   de contas (login/password) de Netflix, Spotify, etc. costuma violar os termos desses serviços e pode
   levar ao bloqueio das contas. Vale confirmar o modelo com cada fornecedor ou com um parceiro de
   distribuição autorizado.
3. **Gateway Multicaixa Express** — confirmar com o agregador escolhido o formato da assinatura do
   webhook, o endpoint de consulta de estado e o tempo-limite do push, para ajustar `payments.expires_at`.

## 7. Front-end (v2) — onde mexer

| O quê | Ficheiro |
|---|---|
| Câmbio, margem e arredondamento dos preços em Kz | `src/lib/pricing.ts` (`FX_USD_AOA`, `MARKUP`, `ROUND_TO`) |
| Catálogo (serviços, planos, preços oficiais em USD, cores) | `src/data/catalog.ts` |
| Bundles (composição, desconto por período, desconto nas compras avulsas) | `src/data/catalog.ts` → `BUNDLES` · `src/lib/pricing.ts` → `BUNDLE_PERIOD_DISCOUNT` |
| Redes sociais (preencher os links em falta) | `src/data/social.ts` |
| Todos os textos PT/EN (inclui respostas do assistente) | `messages/pt.json`, `messages/en.json` |
| Cartão líquido do catálogo (ref. vídeo 4) | `src/components/catalog/LiquidCard.tsx` + `.liquid-card` em `globals.css` |
| Bilhete holográfico de sucesso (ref. vídeo 1) | `src/components/feedback/SuccessTicket.tsx` |
| Pop-ups de promoção/newsletter e assistente (ref. vídeo 2) | `src/components/popups/*` |
| Menu de perfil Liquid Glass (ref. imagem 2) | `src/components/account/UserMenu.tsx` |
| Tabela de preços do Bundle (ref. imagem 1) | `src/components/bundle/BundlePricing.tsx` |

Partes ainda em modo demonstração (sem backend): carrinho e sessão em `localStorage`, login/OTP,
pagamento (o "webhook" é simulado), newsletter e respostas do assistente por palavras-chave.


## 8. Logótipos das marcas (public/brands)


Coloca aqui os logótipos oficiais (kit de imprensa da marca ou do teu fornecedor/distribuidor autorizado).
O site deteta-os sozinho no próximo deploy — não é preciso mexer em código.

Regras:
- Nome do ficheiro **exactamente** como na tabela, em minúsculas.
- Formato `.svg` (ideal), `.png` ou `.webp`, **com fundo transparente**.
- Nos cartões, o logótipo é mostrado a branco (monocromático); nas listas fica preto no modo claro e branco no escuro.
- Prefere a versão horizontal (símbolo + nome) quando existir.

| Marca | Ficheiro |
|---|---|
| Spotify | `spotify.png` ✅ |
| Netflix | `netflix.png` ✅ |
| Disney+ | `disney-plus.png` ✅ |
| YouTube | `youtube.png` ✅ |
| ChatGPT / OpenAI | `chatgpt.png` ✅ |
| Claude / Anthropic | `claude.png` ✅ |
| iCloud | `icloud.png` ✅ |
| Apple Music | `apple-music.png` ✅ |
| Amazon Prime | `amazon-prime.png` ✅ |
| Crunchyroll | `crunchyroll.png` ✅ |
| Adobe Creative Cloud | `adobe-cc.svg` |
| Microsoft 365 | `microsoft-365.png` ✅ |
| McAfee | `mcafee.png` ✅ |
| Kaspersky | `kaspersky.png` ✅ |
| NordVPN | `nordvpn.png` ✅ |
| Apple (Gift Card) | `apple-gift.png` ✅ |
| Google Play | `google-play.svg` |
| PlayStation | `playstation.svg` |
| Xbox | `xbox.svg` |
| Steam | `steam.svg` |
| Amazon | `amazon-gift.svg` |

Sem ficheiro, o cartão mostra o nome da marca em texto.

Os símbolos usados como supergráfica nos cartões ficam em `public/brands/marks/<id>.png` (o mesmo nome do logótipo).
