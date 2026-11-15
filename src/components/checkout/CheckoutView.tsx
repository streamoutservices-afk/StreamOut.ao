"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Building2, Check, Hash, Loader2, Minus, Plus, ShieldCheck, ShoppingBag, Smartphone, Trash2 } from "lucide-react";
import { bundlePerk, useCart, useSession } from "@/components/providers/AppState";
import { SuccessTicket } from "@/components/feedback/SuccessTicket";
import { BrandTile } from "@/components/catalog/BrandLogo";
import { DeliveryBadge } from "@/components/catalog/ProductCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { LogoSymbol } from "@/components/brand/Logo";
import { resolveItem } from "@/lib/cart-items";
import { formatKz, ROUND_TO } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";

type Method = "mcx" | "reference" | "transfer";
type Step = "form" | "awaiting" | "success";

const METHODS: { id: Method; icon: typeof Smartphone }[] = [
  { id: "mcx", icon: Smartphone },
  { id: "reference", icon: Hash },
  { id: "transfer", icon: Building2 },
];

const inputCls =
  "h-11 w-full rounded-xl border border-black/[0.08] bg-white/70 px-3.5 text-[15px] placeholder:text-ink-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60 aria-[invalid=true]:border-red-500/70 dark:border-white/10 dark:bg-white/[0.05] dark:placeholder:text-white/35";

export function CheckoutView() {
  const locale = useLocale() as "pt" | "en";
  const t = useTranslations("Checkout");
  const { items, setQty, remove, clear } = useCart();
  const { session, ready } = useSession();
  const [step, setStep] = useState<Step>("form");
  const [method, setMethod] = useState<Method>("mcx");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nif, setNif] = useState("");
  const [human, setHuman] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [order, setOrder] = useState<{ ref: string; total: number; email: string; onDemand: boolean } | null>(null);

  useEffect(() => {
    if (session?.email) setEmail((e) => e || session.email);
  }, [session]);

  const lines = useMemo(
    () => items.map((i) => ({ ...i, info: resolveItem(i.product, i.plan, locale) })).filter((l) => l.info),
    [items, locale],
  );
  const subtotal = lines.reduce((s, l) => s + l.info!.unitKz * l.qty, 0);
  const perk = bundlePerk(session?.tier ?? null);
  const discountable = lines.filter((l) => !l.info!.isBundle).reduce((s, l) => s + l.info!.unitKz * l.qty, 0);
  const discount = Math.floor((discountable * perk) / 100 / ROUND_TO) * ROUND_TO;
  const total = subtotal - discount;
  const onDemand = lines.some((l) => l.info!.delivery === "on_demand");

  // Simulação do Multicaixa Express: o "webhook" confirma ~4 s depois
  useEffect(() => {
    if (step !== "awaiting" || method !== "mcx") return;
    const id = setTimeout(confirmPayment, 4200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, method]);

  function confirmPayment() {
    setOrder({ ref: `SO-2026-${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`, total, email, onDemand });
    clear();
    setStep("success");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, boolean> = {
      email: !/^\S+@\S+\.\S+$/.test(email),
      phone: method === "mcx" && !/^9\d{8}$/.test(phone.replace(/\s/g, "")),
      human: !human,
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setStep("awaiting");
  }

  if (step === "success" && order) {
    return (
      <main id="main" className="mx-auto flex max-w-xl flex-col items-center px-4 py-14 text-center">
        <SuccessTicket
          title={t("success.title")}
          message={t("success.body", { email: order.email })}
          stub={`${order.ref} · ${formatKz(order.total, locale)}`}
          className="py-10"
        />
        {order.onDemand && <p className="mt-6 text-[13.5px] text-ink-800/65 dark:text-white/55">{t("success.onDemand")}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <GlassButton href={session ? "/dashboard" : "/login"} variant="primary">
            {t("success.viewOrders")}
          </GlassButton>
          <GlassButton href="/subscriptions">{t("success.continue")}</GlassButton>
        </div>
      </main>
    );
  }

  if (ready && lines.length === 0) {
    return (
      <main id="main" className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="glass grid size-16 place-items-center rounded-2xl">
          <ShoppingBag aria-hidden className="size-7 opacity-60" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">{t("emptyTitle")}</h1>
        <p className="mt-2 text-ink-800/65 dark:text-white/55">{t("emptyBody")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <GlassButton href="/subscriptions" variant="primary">
            {t("browse")}
          </GlassButton>
          <GlassButton href="/bundle">Bundle StreamOut</GlassButton>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 pb-10 pt-14">
      <PageHeader title={t("title")} subtitle={t("subtitle")} align="left" className="mb-10" />

      <form onSubmit={submit} noValidate className="grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Dados + pagamento */}
        <div className="space-y-6">
          <fieldset className="glass rounded-[26px] p-6">
            <legend className="sr-only">{t("contact")}</legend>
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-800/50 dark:text-white/45">1 · {t("contact")}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium">{t("email")}</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={errors.email}
                  className={inputCls}
                  placeholder="nome@exemplo.com"
                />
                <span className="mt-1 block text-[12px] text-ink-800/50 dark:text-white/40">{t("emailHint")}</span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-medium">{t("phone")}</span>
                <div className="flex">
                  <span className="grid h-11 place-items-center rounded-l-xl border border-r-0 border-black/[0.08] bg-black/[0.03] px-3 text-[14px] text-ink-800/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/50">
                    +244
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, "").slice(0, 11))}
                    aria-invalid={errors.phone}
                    className={cn(inputCls, "rounded-l-none")}
                    placeholder="9XX XXX XXX"
                  />
                </div>
                {errors.phone && <span className="mt-1 block text-[12px] text-red-600 dark:text-red-400">{t("phoneError")}</span>}
              </label>
            </div>
          </fieldset>

          <fieldset className="glass rounded-[26px] p-6">
            <legend className="sr-only">{t("payment")}</legend>
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-800/50 dark:text-white/45">2 · {t("payment")}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {METHODS.map(({ id, icon: Icon }) => (
                <label
                  key={id}
                  className={cn(
                    "relative grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-3 gap-y-0.5 rounded-2xl border p-3.5 transition-all duration-200 sm:flex sm:flex-col sm:items-start sm:gap-2 sm:p-4",
                    method === id
                      ? "border-brand-royal/50 bg-brand-royal/[0.06] ring-1 ring-brand-royal/40 dark:border-brand-cyan/40 dark:bg-brand-cyan/[0.06]"
                      : "border-black/[0.07] hover:bg-black/[0.02] dark:border-white/10 dark:hover:bg-white/[0.03]",
                  )}
                >
                  <input type="radio" name="method" value={id} checked={method === id} onChange={() => setMethod(id)} className="sr-only" />
                  <Icon aria-hidden className="row-span-2 size-5 text-brand-royal dark:text-brand-cyan" />
                  <span className="text-[14px] font-semibold leading-tight">{t(`methods.${id}.name`)}</span>
                  <span className="text-[12px] leading-snug text-ink-800/55 dark:text-white/45">{t(`methods.${id}.hint`)}</span>
                  {method === id && <Check aria-hidden className="absolute right-3 top-3 size-4 text-brand-royal dark:text-brand-cyan" />}
                </label>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-[13px] font-medium">
                {t("nif")} <span className="font-normal text-ink-800/45 dark:text-white/40">({t("optional")})</span>
              </span>
              <input value={nif} onChange={(e) => setNif(e.target.value)} className={inputCls} placeholder="000000000" />
            </label>

            {/* Lugar do Cloudflare Turnstile em produção */}
            <label
              className={cn(
                "mt-5 flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3",
                errors.human ? "border-red-500/60" : "border-black/[0.08] dark:border-white/10",
              )}
            >
              <input type="checkbox" checked={human} onChange={(e) => setHuman(e.target.checked)} className="size-5 accent-[#0066ff]" />
              <span className="flex-1 text-[14px]">{t("human")}</span>
              <ShieldCheck aria-hidden className="size-5 text-ink-800/40 dark:text-white/40" />
            </label>
          </fieldset>
        </div>

        {/* Resumo */}
        <aside className="glass rounded-[26px] p-6 lg:sticky lg:top-24">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-800/50 dark:text-white/45">{t("summary")}</p>
          <ul className="mt-4 divide-y divide-black/[0.06] dark:divide-white/[0.07]">
            {lines.map(({ product, plan, qty, info }) => (
              <li key={`${product}:${plan}`} className="flex gap-3 py-3.5">
                {info!.product ? (
                  <BrandTile product={info!.product} />
                ) : (
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand-royal to-brand-cyan">
                    <LogoSymbol tone="white" title="" className="size-7" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold">{info!.name}</p>
                  <p className="truncate text-[12.5px] text-ink-800/55 dark:text-white/45">{info!.detail}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="inline-flex items-center rounded-full border border-black/[0.08] dark:border-white/10">
                      <button type="button" aria-label={t("decrease")} onClick={() => setQty(product, plan, qty - 1)} className="grid size-7 place-items-center">
                        <Minus aria-hidden className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-[13px] tabular-nums">{qty}</span>
                      <button type="button" aria-label={t("increase")} onClick={() => setQty(product, plan, qty + 1)} className="grid size-7 place-items-center">
                        <Plus aria-hidden className="size-3.5" />
                      </button>
                    </div>
                    <DeliveryBadge mode={info!.delivery} />
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <p className="text-[14px] font-semibold tabular-nums">{formatKz(info!.unitKz * qty, locale)}</p>
                  <button
                    type="button"
                    aria-label={`${t("remove")}: ${info!.name}`}
                    onClick={() => remove(product, plan)}
                    className="grid size-7 place-items-center rounded-full text-ink-800/40 hover:bg-black/[0.05] hover:text-red-600 dark:text-white/40 dark:hover:bg-white/[0.06]"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-3 space-y-2 border-t border-black/[0.06] pt-4 text-[14px] dark:border-white/[0.07]">
            <div className="flex justify-between">
              <dt className="text-ink-800/60 dark:text-white/55">{t("subtotal")}</dt>
              <dd className="tabular-nums">{formatKz(subtotal, locale)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                <dt>{t("bundleDiscount", { pct: perk })}</dt>
                <dd className="tabular-nums">−{formatKz(discount, locale)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-2 text-[18px] font-semibold">
              <dt>{t("total")}</dt>
              <dd className="tabular-nums">{formatKz(total, locale)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            className="mt-6 h-12 w-full rounded-full bg-linear-to-br from-brand-royal to-brand-cyan text-[15px] font-semibold text-white shadow-brand transition-transform active:scale-[0.98]"
          >
            {t("pay", { total: formatKz(total, locale) })}
          </button>
          <p className="mt-3 text-center text-[12px] text-ink-800/50 dark:text-white/40">{t("secureNote")}</p>
        </aside>
      </form>

      {/* Pagamento pendente */}
      {step === "awaiting" && (
        <div role="dialog" aria-modal="true" aria-label={t("awaiting.title")} className="fixed inset-0 z-[90] grid place-items-center bg-paper-50/50 p-4 backdrop-blur-md dark:bg-ink-950/70">
          <div className="notify-in glass w-full max-w-sm rounded-[28px] p-7 text-center">
            <span className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-linear-to-br from-brand-royal to-brand-cyan text-white">
              {method === "mcx" ? <Smartphone aria-hidden className="size-7" /> : method === "reference" ? <Hash aria-hidden className="size-7" /> : <Building2 aria-hidden className="size-7" />}
              {method === "mcx" && <span className="absolute inset-0 animate-ping rounded-2xl bg-brand-cyan/40" aria-hidden />}
            </span>
            <h2 className="mt-5 text-[21px] font-semibold tracking-tight">{t(`awaiting.${method}.title`)}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-800/65 dark:text-white/55">
              {t(`awaiting.${method}.body`, { total: formatKz(total, locale), phone: `+244 ${phone}` })}
            </p>
            {method !== "mcx" && (
              <dl className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-black/[0.035] p-3 text-left text-[13px] dark:bg-white/[0.05]">
                <dt className="text-ink-800/55 dark:text-white/45">{method === "reference" ? t("awaiting.entity") : "IBAN"}</dt>
                <dd className="text-right font-semibold tabular-nums">{method === "reference" ? "00 000" : "AO06 0000 …"}</dd>
                <dt className="text-ink-800/55 dark:text-white/45">{method === "reference" ? t("awaiting.refLabel") : t("awaiting.amount")}</dt>
                <dd className="text-right font-semibold tabular-nums">{method === "reference" ? "000 000 000" : formatKz(total, locale)}</dd>
              </dl>
            )}
            {method === "mcx" ? (
              <p className="mt-5 flex items-center justify-center gap-2 text-[13px] font-medium text-brand-royal dark:text-brand-cyan">
                <Loader2 aria-hidden className="size-4 animate-spin" />
                {t("awaiting.waiting")}
              </p>
            ) : (
              <button type="button" onClick={confirmPayment} className="mt-5 h-11 w-full rounded-full bg-ink-900 text-[14px] font-semibold text-white dark:bg-white dark:text-ink-900">
                {t("awaiting.simulate")}
              </button>
            )}
            <button type="button" onClick={() => setStep("form")} className="mt-3 text-[13px] font-medium text-ink-800/55 hover:underline dark:text-white/45">
              {t("awaiting.cancel")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
