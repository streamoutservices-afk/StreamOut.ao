import type { Locale } from "@/i18n/routing";
import { use } from "react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { HowItWorksSteps } from "@/components/sections/HowItWorksSteps";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "HowItWorks" });
  return { title: t("title"), description: t("subtitle") };
}

const SECURITY = [
  { key: "pin", icon: Smartphone },
  { key: "otp", icon: ShieldCheck },
  { key: "encryption", icon: Lock },
  { key: "invoice", icon: BadgeCheck },
] as const;

const FAQ = ["delivery", "payment", "region", "refund", "invoice", "account"] as const;

export default function HowItWorksPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale as Locale);
  const t = useTranslations("HowItWorks");
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 pb-10 pt-16">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} className="mb-12" />
      <HowItWorksSteps />

      <section className="mt-24">
        <PageHeader as="h2" title={t("securityTitle")} subtitle={t("securitySubtitle")} className="mb-10" />
        <ul className="grid gap-4 sm:grid-cols-2">
          {SECURITY.map(({ key, icon: Icon }) => (
            <li key={key} className="glass flex gap-4 rounded-[22px] p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-royal/10 text-brand-royal dark:bg-brand-cyan/10 dark:text-brand-cyan">
                <Icon aria-hidden className="size-5" />
              </span>
              <div>
                <h3 className="text-[16px] font-semibold tracking-tight">{t(`security.${key}.title`)}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-800/65 dark:text-white/55">{t(`security.${key}.body`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="faq" className="mx-auto mt-24 max-w-3xl scroll-mt-28">
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
