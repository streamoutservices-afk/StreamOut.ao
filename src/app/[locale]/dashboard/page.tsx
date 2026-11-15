import type { Locale } from "@/i18n/routing";
import { use } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DashboardView } from "@/components/account/DashboardView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Account" });
  return { title: t("title"), robots: { index: false } };
}

export default function DashboardPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  return <DashboardView />;
}
