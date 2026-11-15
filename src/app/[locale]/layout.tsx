import type { Locale } from "@/i18n/routing";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppStateProvider } from "@/components/providers/AppState";
import { LiquidFilterDefs } from "@/components/catalog/LiquidFilterDefs";
import { PopupManager } from "@/components/popups/PopupManager";
import { ChatWidget } from "@/components/popups/ChatWidget";
import { routing } from "@/i18n/routing";
import "../globals.css";

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Header" });
  return {
    title: { default: `StreamOut — ${t("tagline")}`, template: "%s · StreamOut" },
    alternates: { languages: { pt: "/pt", en: "/en" } },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale as Locale);

  return (
    <html lang={locale === "pt" ? "pt-AO" : "en"} suppressHydrationWarning>
      <body className="min-h-dvh bg-paper-50 font-sans text-ink-900 antialiased dark:bg-ink-950 dark:text-white">
        {/* Luz ambiente da marca — dá ao vidro algo para desfocar */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-48 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand-royal/20 blur-3xl dark:bg-brand-royal/25" />
          <div className="absolute -right-40 top-40 h-[420px] w-[520px] rounded-full bg-brand-cyan/20 blur-3xl dark:bg-brand-cyan/15" />
        </div>

        <ThemeProvider>
          <NextIntlClientProvider>
            <AppStateProvider>
              <LiquidFilterDefs />
              <Header />
              {children}
              <Footer />
              <PopupManager />
              <ChatWidget />
            </AppStateProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
