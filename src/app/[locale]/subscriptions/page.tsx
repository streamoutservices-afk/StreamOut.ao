import type { Locale } from "@/i18n/routing";
import { use } from "react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { SUBSCRIPTIONS } from "@/data/catalog";
import { FX_USD_AOA } from "@/lib/pricing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Subscriptions" });
  return { title: t("title"), description: t("subtitle") };
}

export default function SubscriptionsPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("Subscriptions");
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 pb-10 pt-16">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} className="mb-12" />
      <CatalogBrowser products={SUBSCRIPTIONS} />
      <p className="mt-10 text-center text-[12.5px] text-ink-800/50 dark:text-white/40">{t("note", { rate: FX_USD_AOA })}</p>
    </main>
  );
}
