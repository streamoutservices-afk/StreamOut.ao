import type { Locale } from "@/i18n/routing";
import { use } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckoutView } from "@/components/checkout/CheckoutView";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Checkout" });
  return { title: t("title"), robots: { index: false } };
}

export default function CheckoutPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  return <CheckoutView />;
}
