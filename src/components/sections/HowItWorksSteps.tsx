import { useTranslations } from "next-intl";
import { MousePointerClick, Send, Wallet } from "lucide-react";

const STEPS = [
  { key: "choose", icon: MousePointerClick },
  { key: "pay", icon: Wallet },
  { key: "receive", icon: Send },
] as const;

export function HowItWorksSteps() {
  const t = useTranslations("Home.steps");
  return (
    <ol className="grid gap-5 md:grid-cols-3">
      {STEPS.map(({ key, icon: Icon }, i) => (
        <li key={key} className="glass relative rounded-[26px] p-6">
          <span className="absolute right-6 top-5 text-[44px] font-semibold leading-none text-ink-900/[0.06] dark:text-white/[0.07]">
            {i + 1}
          </span>
          <span className="grid size-11 place-items-center rounded-2xl bg-linear-to-br from-brand-royal to-brand-cyan text-white shadow-brand">
            <Icon aria-hidden className="size-5" />
          </span>
          <h3 className="mt-5 text-[18px] font-semibold tracking-tight">{t(`${key}.title`)}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-800/65 dark:text-white/55">{t(`${key}.body`)}</p>
        </li>
      ))}
    </ol>
  );
}
