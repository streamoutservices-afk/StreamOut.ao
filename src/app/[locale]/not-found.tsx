import { useTranslations } from "next-intl";
import { Compass } from "lucide-react";
import { LiquidCard } from "@/components/catalog/LiquidCard";
import { GlassButton } from "@/components/ui/GlassButton";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <main id="main" className="mx-auto grid max-w-5xl items-center gap-12 px-4 py-20 md:grid-cols-2">
      <div className="mx-auto w-full max-w-sm -rotate-3">
        <LiquidCard live product={{ id: "streamout", name: "StreamOut", icon: "sparkles", tint: ["#00c6ff", "#061a3d"] }} badge={t("eyebrow")} eyebrow={t("detail")} value="404" />
      </div>
      <div className="text-center md:text-left">
        <Compass aria-hidden className="mx-auto size-8 text-brand-royal md:mx-0 dark:text-brand-cyan" />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-[16px] text-ink-800/65 dark:text-white/55">{t("body")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
          <GlassButton href="/" variant="primary">{t("home")}</GlassButton>
          <GlassButton href="/subscriptions">{t("catalog")}</GlassButton>
        </div>
      </div>
    </main>
  );
}
