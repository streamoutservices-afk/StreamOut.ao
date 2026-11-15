import type { Locale } from "@/i18n/routing";
import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, BadgeCheck, Clock, Headphones, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { GlassButton } from "@/components/ui/GlassButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { LiquidShowcase } from "@/components/catalog/LiquidShowcase";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { BundlePricing } from "@/components/bundle/BundlePricing";
import { HowItWorksSteps } from "@/components/sections/HowItWorksSteps";
import { GIFT_CARDS, SUBSCRIPTIONS } from "@/data/catalog";

const TRUST = [
  { key: "kz", icon: Wallet },
  { key: "fast", icon: Clock },
  { key: "secure", icon: BadgeCheck },
  { key: "support", icon: Headphones },
] as const;

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("Home");
  const popular = SUBSCRIPTIONS.filter((p) => p.popular);

  return (
    <main id="main">
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:gap-14 sm:pb-20 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div className="text-center lg:text-left">
          <Logo title="StreamOut" className="mx-auto h-11 sm:h-14 lg:mx-0" />
          <h1 className="mt-6 text-balance text-[34px] font-semibold leading-[1.08] tracking-tight sm:mt-7 sm:text-[52px] sm:leading-[1.05]">{t("title")}</h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-[16px] leading-relaxed sm:mt-5 sm:text-[17px] text-ink-800/70 lg:mx-0 dark:text-white/60">
            {t("subtitle")}
          </p>
          <div className="mx-auto mt-7 grid max-w-sm gap-2.5 sm:mt-8 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center sm:gap-3 lg:justify-start">
            <GlassButton href="/subscriptions" variant="primary" className="w-full sm:w-auto">
              {t("ctaPrimary")}
              <ArrowRight aria-hidden className="size-4" />
            </GlassButton>
            <GlassButton href="/bundle" className="w-full sm:w-auto">
              {t("ctaSecondary")}
            </GlassButton>
          </div>
          <ul className="mx-auto mt-7 grid max-w-sm grid-cols-2 gap-2 sm:mt-9 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center lg:justify-start">
            {TRUST.map(({ key, icon: Icon }) => (
              <li
                key={key}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-black/[0.06] bg-white/55 px-2.5 py-1.5 text-[11.5px] font-medium sm:px-3 sm:text-[12.5px] text-ink-800/80 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70"
              >
                <Icon aria-hidden className="size-3.5 text-brand-royal dark:text-brand-cyan" />
                {t(`trust.${key}`)}
              </li>
            ))}
          </ul>
        </div>
        <LiquidShowcase className="max-w-[300px] sm:max-w-[380px]" />
      </section>

      {/* Mais procurados */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-7 flex flex-col items-center justify-between gap-3 text-center sm:mb-10 sm:flex-row sm:gap-4 sm:text-left">
          <PageHeader as="h2" align="left" title={t("popularTitle")} subtitle={t("popularSubtitle")} className="!mx-0" />
          <Link
            href="/subscriptions"
            className="inline-flex shrink-0 items-center gap-1 text-[14px] font-semibold text-brand-royal hover:underline dark:text-brand-cyan"
          >
            {t("seeAll")} <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        <CatalogBrowser products={popular} withFilters={false} />
      </section>

      {/* Bundle */}
      <section id="bundle" className="px-4 py-14 sm:py-20">
        <BundlePricing />
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <PageHeader as="h2" title={t("stepsTitle")} subtitle={t("stepsSubtitle")} className="mb-10" />
        <HowItWorksSteps />
      </section>

      {/* Gift cards */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-7 flex flex-col items-center justify-between gap-3 text-center sm:mb-10 sm:flex-row sm:gap-4 sm:text-left">
          <PageHeader as="h2" align="left" title={t("giftTitle")} subtitle={t("giftSubtitle")} className="!mx-0" />
          <Link
            href="/gift-cards"
            className="inline-flex shrink-0 items-center gap-1 text-[14px] font-semibold text-brand-royal hover:underline dark:text-brand-cyan"
          >
            {t("seeAll")} <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        <CatalogBrowser products={GIFT_CARDS.slice(0, 4)} withFilters={false} />
      </section>
    </main>
  );
}
