"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Percent } from "lucide-react";
import { BUNDLES, findPlan, findProduct } from "@/data/catalog";
import { bundlePrice, type Period } from "@/lib/bundle-pricing";
import { BUNDLE_PREFIX } from "@/lib/cart-items";
import { BUNDLE_PERIOD_DISCOUNT, formatKz } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/components/providers/AppState";
import { ServiceIcon } from "@/components/catalog/ServiceIcon";
import { BrandLogo } from "@/components/catalog/BrandLogo";

const PERIODS: Period[] = [3, 6, 12];

/** Tabela de preços do Bundle StreamOut (ref. imagem 1) */
export function BundlePricing({ headingLevel = 2 }: { headingLevel?: 1 | 2 }) {
  const locale = useLocale() as "pt" | "en";
  const t = useTranslations("Bundle");
  const { add } = useCart();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>(6);
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="text-center">
        <span className="inline-flex rounded-full bg-brand-royal/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-royal dark:bg-brand-cyan/10 dark:text-brand-cyan">
          {t("eyebrow")}
        </span>
        <Heading className="mx-auto mt-4 max-w-2xl text-balance text-[30px] font-semibold leading-[1.1] tracking-tight sm:text-5xl">
          {t("title")}
        </Heading>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-[16px] text-ink-800/65 dark:text-white/55">{t("subtitle")}</p>

        {/* Seletor de período */}
        <div
          role="radiogroup"
          aria-label={t("periodLabel")}
          className="mx-auto mt-8 grid w-full max-w-md grid-cols-3 rounded-[22px] border border-black/[0.06] bg-black/[0.04] p-1 sm:inline-grid sm:w-auto sm:max-w-none sm:rounded-full dark:border-white/10 dark:bg-white/[0.05]"
        >
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={period === p}
              onClick={() => setPeriod(p)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-[18px] px-2 py-2 text-[13.5px] font-medium transition-all duration-300 ease-apple sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-5",
                period === p
                  ? "bg-white text-ink-900 shadow-glass dark:bg-white/15 dark:text-white dark:shadow-glass-dark"
                  : "text-ink-800/60 hover:text-ink-900 dark:text-white/55 dark:hover:text-white",
              )}
            >
              {p === 12 ? t("annual") : t("months", { count: p })}
              <span className="rounded-full bg-emerald-500/12 px-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                −{Math.round(BUNDLE_PERIOD_DISCOUNT[p] * 100)}%
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] font-medium text-brand-royal dark:text-brand-cyan">{t("noCard")}</p>
      </div>

      <div className="mt-12 grid items-center gap-5 lg:grid-cols-3">
        {BUNDLES.map((bundle) => {
          const price = bundlePrice(bundle, period);
          const featured = !!bundle.popular;
          return (
            <article
              key={bundle.id}
              className={cn(
                "relative flex flex-col rounded-[28px] p-6 transition-transform duration-500 ease-apple sm:rounded-[30px] sm:p-7",
                featured
                  ? "z-10 bg-linear-to-b from-brand-royal via-[#3d8bff] to-[#9cc8ff] text-white shadow-[0_40px_80px_-30px_rgb(0_102_255/0.6)] lg:scale-[1.04] lg:py-9"
                  : "glass",
              )}
            >
              <div className="flex items-center justify-between">
                <h3
                  className={cn(
                    "text-[13px] font-semibold uppercase tracking-[0.14em]",
                    featured ? "text-[#ffe08a]" : "text-ink-800/70 dark:text-white/70",
                  )}
                >
                  {bundle.name[locale]}
                </h3>
                {featured && (
                  <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[11.5px] font-medium backdrop-blur-md">
                    {t("popular")}
                  </span>
                )}
              </div>

              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-[34px] font-semibold leading-none tracking-tight tabular-nums sm:text-[40px]">
                  {formatKz(price.perMonth, locale)}
                </span>
                <span className={cn("text-[12px] font-semibold uppercase", featured ? "text-white/80" : "text-ink-800/60 dark:text-white/50")}>
                  /{t("perMonth")}
                </span>
              </p>
              <p className={cn("mt-2 text-[13px]", featured ? "text-white/80" : "text-ink-800/60 dark:text-white/50")}>
                {t("total", { total: formatKz(price.total, locale), months: period })}
                <br />
                <span className={cn("font-medium", featured ? "text-white" : "text-emerald-700 dark:text-emerald-300")}>
                  {t("savings", { amount: formatKz(price.savings, locale) })}
                </span>
              </p>

              <p className={cn("mt-6 text-[13px]", featured ? "text-white/85" : "text-ink-800/60 dark:text-white/50")}>{bundle.pitch[locale]}</p>
              <p className={cn("mt-5 text-[12.5px] font-medium", featured ? "text-white/80" : "text-ink-800/55 dark:text-white/45")}>
                {t("included")}
              </p>
              <ul className="mt-3 space-y-2.5">
                {bundle.items.map((item) => {
                  const product = findProduct(item.product)!;
                  const plan = findPlan(item.product, item.plan)!;
                  return (
                    <li key={item.product} className="flex items-center gap-2.5 text-[14px] font-medium">
                      <Check aria-hidden className={cn("size-4 shrink-0", featured ? "text-white" : "text-brand-royal dark:text-brand-cyan")} />
                      <BrandLogo
                        id={product.id}
                        name=""
                        tone={featured ? "white" : "auto"}
                        className="h-3.5 w-5 shrink-0 opacity-70"
                        fallback={<ServiceIcon icon={product.icon} className="size-3.5 shrink-0 opacity-60" />}
                      />
                      <span>
                        {product.name}
                        <span className={cn("font-normal", featured ? "text-white/75" : "text-ink-800/55 dark:text-white/45")}>
                          {" "}
                          · {plan.label[locale].split(" · ")[0]}
                        </span>
                      </span>
                    </li>
                  );
                })}
                <li className="flex items-center gap-2.5 pt-1 text-[14px] font-semibold">
                  <Percent aria-hidden className={cn("size-4 shrink-0", featured ? "text-[#ffe08a]" : "text-emerald-600 dark:text-emerald-300")} />
                  {t("perk", { pct: bundle.perk })}
                </li>
              </ul>

              <button
                type="button"
                onClick={() => {
                  add(`${BUNDLE_PREFIX}${bundle.id}`, String(period));
                  router.push("/checkout");
                }}
                className={cn(
                  "mt-8 h-11 w-full rounded-full text-[14px] font-semibold transition-all duration-300 ease-apple active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-royal/60",
                  featured
                    ? "bg-white text-ink-900 hover:bg-white/90"
                    : "bg-ink-900 text-white hover:bg-ink-700 dark:bg-white dark:text-ink-900 dark:hover:bg-white/90",
                )}
              >
                {t("cta")}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
