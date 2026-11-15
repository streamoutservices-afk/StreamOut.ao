"use client";

import { useTransition, type KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils/cn";

/** Controlo segmentado PT | EN com "pílula" de vidro deslizante */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Header.language");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const locales = routing.locales;
  const activeIndex = locales.indexOf(locale);

  function select(next: Locale) {
    if (next === locale) return;
    startTransition(() => router.replace(pathname, { locale: next, scroll: false }));
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = locales[(activeIndex + dir + locales.length) % locales.length];
    select(next);
    // move o foco para o novo botão activo (padrão radiogroup)
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-locale="${next}"]`)?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      aria-busy={isPending}
      onKeyDown={onKeyDown}
      className={cn(
        "relative grid h-9 grid-cols-2 items-center rounded-full border p-0.5",
        "bg-black/[0.04] border-black/[0.06] dark:bg-white/[0.05] dark:border-white/10",
        isPending && "opacity-70",
        className,
      )}
    >
      {/* Pílula activa */}
      <span
        aria-hidden
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
        className={cn(
          "pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full border",
          "bg-white/90 border-white shadow-glass backdrop-blur-md",
          "dark:bg-white/15 dark:border-white/15 dark:shadow-glass-dark",
          "transition-transform duration-300 ease-apple motion-reduce:transition-none",
        )}
      />
      {locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(code)}
            tabIndex={active ? 0 : -1}
            data-locale={code}
            lang={code}
            onClick={() => select(code)}
            className={cn(
              "relative z-10 h-8 min-w-10 rounded-full px-2.5 text-[12px] font-semibold uppercase tracking-wide",
              "transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60",
              active
                ? "text-ink-900 dark:text-white"
                : "text-ink-800/55 hover:text-ink-900 dark:text-white/50 dark:hover:text-white",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
