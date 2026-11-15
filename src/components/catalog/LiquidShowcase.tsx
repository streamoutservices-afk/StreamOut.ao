"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { findProduct, planParts } from "@/data/catalog";
import { formatKz, usdToKz } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";
import { LiquidCard } from "./LiquidCard";

const SHOWCASE = ["spotify", "netflix", "chatgpt", "youtube", "icloud", "claude", "apple-music", "amazon-prime"];

// posição relativa ao cartão da frente → transformação (leque 3D, como uma carteira)
const SLOTS = [
  "translate-x-0 translate-y-0 rotate-0 scale-100 opacity-100 z-30",
  "translate-x-[9%] -translate-y-[13%] rotate-[5deg] scale-[0.9] opacity-80 z-20",
  "-translate-x-[9%] -translate-y-[24%] -rotate-[5deg] scale-[0.8] opacity-55 z-10",
];

/** Carrossel de cartões líquidos do catálogo (ref. vídeo 4) */
export function LiquidShowcase({ className }: { className?: string }) {
  const locale = useLocale() as "pt" | "en";
  const t = useTranslations("Catalog");
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setInterval(() => setActive((a) => (a + 1) % SHOWCASE.length), reduce ? 6000 : 3200);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className={cn("relative mx-auto aspect-[1.586/1.25] w-full max-w-[380px]", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div aria-hidden className="absolute inset-x-[10%] bottom-0 h-1/3 rounded-full bg-brand-royal/30 blur-3xl dark:bg-brand-royal/40" />
      {SHOWCASE.map((id, i) => {
        const product = findProduct(id)!;
        const plan = product.plans[0];
        const rel = (i - active + SHOWCASE.length) % SHOWCASE.length;
        const slot = SLOTS[rel] ?? "translate-y-[6%] scale-[0.75] opacity-0 z-0 pointer-events-none";
        return (
          <button
            key={id}
            type="button"
            tabIndex={rel === 0 ? 0 : -1}
            aria-hidden={rel !== 0}
            aria-label={`${product.name} — ${t("next")}`}
            onClick={() => setActive((a) => (a + 1) % SHOWCASE.length)}
            className={cn(
              "absolute inset-x-0 bottom-0 origin-bottom rounded-[18px] transition-all duration-[900ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60",
              slot,
            )}
          >
            <LiquidCard
              product={product}
              live={rel === 0}
              badge={planParts(plan, locale).duration ?? undefined}
              eyebrow={planParts(plan, locale).tier}
              value={formatKz(usdToKz(plan.usd), locale)}
            />
          </button>
        );
      })}
    </div>
  );
}
