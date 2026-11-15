import type { Locale } from "@/i18n/routing";
import { use } from "react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BundlePricing } from "@/components/bundle/BundlePricing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Bundle" });
  return { title: "Bundle StreamOut", description: t("subtitle") };
}

const FAQ = ["what", "how", "discount", "change"] as const;

export default function BundlePage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("Bundle");
  return (
    <main id="main" className="px-4 pb-10 pt-16">
      <BundlePricing headingLevel={1} />
      <section className="mx-auto mt-24 max-w-3xl">
        <h2 className="text-center text-3xl font-semibold tracking-tight">{t("faqTitle")}</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((k) => (
            <details key={k} className="glass group rounded-2xl px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15.5px] font-semibold">
                {t(`faq.${k}.q`)}
                <span aria-hidden className="text-xl leading-none transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-800/70 dark:text-white/60">{t(`faq.${k}.a`)}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
