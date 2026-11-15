"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Bell, Eye, EyeOff, FileText, Percent, RefreshCw, ShieldCheck } from "lucide-react";
import { BUNDLES, findPlan, findProduct } from "@/data/catalog";
import { bundlePerk, useCart, useSession } from "@/components/providers/AppState";
import { BrandTile } from "@/components/catalog/BrandLogo";
import { GlassButton } from "@/components/ui/GlassButton";
import { useRouter } from "@/i18n/navigation";
import { formatKz, usdToKz } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";
import { TierBadge, UserMenu } from "./UserMenu";

const DAY = 86_400_000;

type Sub = { product: string; plan: string; start: number; end: number; code: string };

/** Dados de demonstração — em produção vêm da API (customer_subscription_progress) */
function useDemoSubscriptions(tier: string | null): Sub[] {
  return useMemo(() => {
    const now = Date.now();
    const bundle = BUNDLES.find((b) => b.id === (tier ?? "plus")) ?? BUNDLES[1];
    const offsets = [24, 6, 40, 15, 52, 9];
    const subs = bundle.items.map((item, i) => {
      const plan = findPlan(item.product, item.plan);
      const months = plan?.months ?? 1;
      const end = now + offsets[i % offsets.length] * DAY;
      return {
        ...item,
        start: end - months * 30 * DAY,
        end,
        code: `SO${(i + 3) * 7}K-${item.product.slice(0, 3).toUpperCase()}${i}-X9Q${i}-M2P${(i + 1) * 3}`,
      };
    });
    return [...subs, { product: "nordvpn", plan: "basic-12", start: now - 300 * DAY, end: now + 65 * DAY, code: "NVPN-7Q2M-K8X1-4LZ9" }];
  }, [tier]);
}

function Panel({ id, title, children, className }: { id?: string; title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={cn("lg-panel scroll-mt-28 p-5 sm:p-6", className)}>
      {title && <h2 className="mb-4 text-[18px] font-semibold tracking-tight">{title}</h2>}
      {children}
    </section>
  );
}

export function DashboardView() {
  const locale = useLocale() as "pt" | "en";
  const t = useTranslations("Account");
  const { session, ready } = useSession();
  const { add } = useCart();
  const router = useRouter();
  const subs = useDemoSubscriptions(session?.tier ?? null);
  const [revealed, setRevealed] = useState<string | null>(null);
  const dateFmt = new Intl.DateTimeFormat(locale === "pt" ? "pt-AO" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  if (!ready) return <main id="main" className="min-h-[60vh]" />;

  if (!session) {
    return (
      <main id="main" className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <ShieldCheck aria-hidden className="size-10 text-brand-royal dark:text-brand-cyan" />
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{t("guestTitle")}</h1>
        <p className="mt-2 text-ink-800/65 dark:text-white/55">{t("guestBody")}</p>
        <GlassButton href="/login" variant="primary" className="mt-8">
          {t("guestCta")}
        </GlassButton>
      </main>
    );
  }

  const bundle = BUNDLES.find((b) => b.id === session.tier);
  const soon = subs.filter((s) => s.end - Date.now() < 10 * DAY);
  const firstName = session.name.split(" ")[0];

  return (
    <main id="main" className="relative isolate -mt-[76px] min-h-screen overflow-hidden pt-[110px]">
      {/* Fundo de seda (ref. imagem 2) */}
      <div className="silk-bg -z-10" aria-hidden>
        <span className="left-[-10%] top-[8%] h-[38%] w-[80%] -rotate-12 bg-white/70 dark:bg-white/[0.16]" />
        <span className="right-[-15%] top-[38%] h-[30%] w-[70%] rotate-12 bg-brand-royal/25 dark:bg-brand-royal/30" style={{ animationDelay: "-6s" }} />
        <span className="bottom-[-5%] left-[10%] h-[30%] w-[60%] -rotate-6 bg-brand-cyan/25 dark:bg-white/[0.1]" style={{ animationDelay: "-12s" }} />
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-5 px-4 pb-16 sm:gap-6 lg:grid-cols-[300px_1fr] [&>*]:min-w-0">
        <div className="lg:sticky lg:top-24">
          <UserMenu variant="sidebar" active="subscriptions" />
        </div>

        <div className="min-w-0 space-y-5 sm:space-y-6">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[13px] text-ink-800/55 dark:text-white/50">{t("hello")}</p>
                <h1 className="text-[30px] font-semibold tracking-tight">{firstName} 👋</h1>
              </div>
              <TierBadge tier={session.tier} />
            </div>
            {bundle && (
              <div className="mt-5 flex flex-col gap-1 rounded-2xl sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 bg-linear-to-br from-brand-royal to-[#5aa2ff] p-4 text-white">
                <p className="text-[15px] font-semibold">Bundle StreamOut {bundle.name[locale]}</p>
                <p className="inline-flex items-center gap-1.5 text-[13.5px] text-white/85">
                  <Percent aria-hidden className="size-4" />
                  {t("perkActive", { pct: bundlePerk(session.tier) })}
                </p>
              </div>
            )}
          </Panel>

          {soon.length > 0 && (
            <div role="status" className="lg-panel flex items-start gap-3 !rounded-[22px] p-4">
              <Bell aria-hidden className="mt-0.5 size-5 shrink-0 text-amber-500" />
              <p className="flex-1 text-[14px]">
                {t("expiringSoon", { names: soon.map((s) => findProduct(s.product)?.name).join(", ") })}
              </p>
            </div>
          )}

          <Panel id="assinaturas" title={t("activeTitle")}>
            <ul className="space-y-3">
              {subs.map((s) => {
                const product = findProduct(s.product)!;
                const plan = findPlan(s.product, s.plan)!;
                const total = s.end - s.start;
                const elapsed = Math.min(100, Math.max(0, ((Date.now() - s.start) / total) * 100));
                const daysLeft = Math.max(0, Math.ceil((s.end - Date.now()) / DAY));
                const urgent = daysLeft <= 7;
                const key = `${s.product}:${s.plan}`;
                return (
                  <li key={key} className="rounded-2xl bg-white/40 p-4 dark:bg-white/[0.04]">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <BrandTile product={product} className="size-12 rounded-2xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15.5px] font-semibold">{product.name}</p>
                        <p className="text-[12.5px] text-ink-800/55 dark:text-white/45">
                          {plan.label[locale]} · {t("expires", { date: dateFmt.format(s.end) })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-[20px] font-semibold tabular-nums", urgent && "text-amber-600 dark:text-amber-400")}>
                          {daysLeft}
                        </p>
                        <p className="text-[11.5px] text-ink-800/50 dark:text-white/40">{t("daysLeft", { count: daysLeft })}</p>
                      </div>
                    </div>

                    <div
                      className="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]"
                      role="progressbar"
                      aria-label={t("progress", { name: product.name })}
                      aria-valuenow={Math.round(elapsed)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={cn("h-full rounded-full", urgent ? "bg-linear-to-r from-amber-400 to-orange-500" : "bg-linear-to-r from-brand-royal to-brand-cyan")}
                        style={{ width: `${elapsed}%` } as CSSProperties}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <code className="rounded-lg bg-black/[0.05] px-2.5 py-1 text-[12.5px] tracking-wider dark:bg-white/[0.07]">
                        {revealed === key ? s.code : "••••-••••-••••-••••"}
                      </code>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setRevealed(revealed === key ? null : key)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                        >
                          {revealed === key ? <EyeOff aria-hidden className="size-3.5" /> : <Eye aria-hidden className="size-3.5" />}
                          {revealed === key ? t("hideCode") : t("showCode")}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            add(s.product, s.plan);
                            router.push("/checkout");
                          }}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink-900 px-3 text-[12.5px] font-semibold text-white dark:bg-white dark:text-ink-900"
                        >
                          <RefreshCw aria-hidden className="size-3.5" />
                          {t("renew", { price: formatKz(usdToKz(plan.usd), locale) })}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 flex items-center gap-1.5 text-[12px] text-ink-800/50 dark:text-white/40">
              <ShieldCheck aria-hidden className="size-3.5" />
              {t("stepUpNote")}
            </p>
          </Panel>

          <Panel id="encomendas" title={t("ordersTitle")}>
            <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
              {[
                { ref: "SO-2026-004812", days: 3, total: 51_050, status: "delivered" as const },
                { ref: "SO-2026-003377", days: 34, total: 18_250, status: "delivered" as const },
                { ref: "SO-2026-001905", days: 71, total: 11_850, status: "refunded" as const },
              ].map((o) => (
                <li key={o.ref} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-semibold tabular-nums">{o.ref}</p>
                    <p className="text-[12.5px] text-ink-800/55 dark:text-white/45">{dateFmt.format(Date.now() - o.days * DAY)}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11.5px] font-medium",
                      o.status === "delivered" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-black/[0.05] text-ink-800/60 dark:bg-white/[0.07] dark:text-white/55",
                    )}
                  >
                    {t(`status.${o.status}`)}
                  </span>
                  <p className="w-28 text-right text-[14px] font-semibold tabular-nums">{formatKz(o.total, locale)}</p>
                  <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium hover:bg-black/[0.05] dark:hover:bg-white/[0.07]">
                    <FileText aria-hidden className="size-3.5" /> {t("invoice")}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel id="perfil" title={t("items.profile")}>
              <dl className="space-y-3 text-[14px]">
                <div>
                  <dt className="text-[12px] text-ink-800/50 dark:text-white/40">{t("fields.name")}</dt>
                  <dd className="font-medium">{session.name}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-ink-800/50 dark:text-white/40">{t("fields.email")}</dt>
                  <dd className="font-medium">{session.email}</dd>
                </div>
              </dl>
            </Panel>
            <Panel id="definicoes" title={t("items.settings")}>
              <ul className="space-y-3 text-[14px]">
                <li className="flex items-center justify-between gap-3">
                  <span>{t("fields.twoFactor")}</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[12px] font-medium text-emerald-700 dark:text-emerald-300">{t("fields.on")}</span>
                </li>
                <li className="flex items-center justify-between gap-3">
                  <span>{t("fields.alerts")}</span>
                  <span className="text-[12.5px] text-ink-800/55 dark:text-white/45">{t("fields.alertsValue")}</span>
                </li>
                <li className="flex items-start gap-2 text-[12.5px] text-ink-800/55 dark:text-white/45">
                  <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  {t("demoNote")}
                </li>
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}
