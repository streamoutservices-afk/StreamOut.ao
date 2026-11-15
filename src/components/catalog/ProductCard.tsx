"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { durationSummary, planParts, type Product } from "@/data/catalog";
import { formatKz, usdToKz } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";
import { LiquidCard } from "./LiquidCard";
import { ProductSheet } from "./ProductSheet";
import { DeliveryBadge } from "./DeliveryBadge";

export { DeliveryBadge };

/** Cartão do catálogo: o gift card em destaque; tocar abre a ficha com os planos */
export function ProductCard({ product }: { product: Product }) {
  const locale = useLocale() as "pt" | "en";
  const t = useTranslations("Catalog");
  const [open, setOpen] = useState(false);

  const cheapest = product.plans.reduce((a, b) => (b.usd < a.usd ? b : a));
  const from = formatKz(usdToKz(cheapest.usd), locale);
  const many = product.plans.length > 1;

  return (
    <>
      <article className="glass group flex flex-col rounded-[20px] p-2 transition-transform duration-500 ease-apple hover:-translate-y-1 sm:rounded-[26px] sm:p-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`${product.name} — ${t("choose")}`}
          className="block w-full rounded-[14px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60 sm:rounded-[18px]"
        >
          <LiquidCard
            product={product}
            badge={product.kind === "giftcard" ? t("giftCard") : (durationSummary(product, locale) ?? undefined)}
            eyebrow={many ? t("from") : planParts(cheapest, locale).tier}
            value={from}
            className="rounded-[14px] sm:rounded-[18px]"
          />
        </button>

        <div className="flex flex-1 flex-col px-1 pb-0.5 pt-2.5 sm:px-1.5 sm:pt-3.5">
          <h3 className="text-[13.5px] font-semibold leading-tight tracking-tight sm:text-[16px]">{product.name}</h3>
          <DeliveryBadge mode={product.delivery} className="mt-1.5 px-1.5 text-[10px] sm:px-2 sm:text-[11px]" />
          <p className="mt-2 hidden text-[13.5px] leading-snug text-ink-800/65 sm:line-clamp-2 dark:text-white/55">{product.tagline[locale]}</p>

          <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-full pl-3.5 pr-2 text-[12.5px] font-semibold sm:h-10 sm:pl-4 sm:text-[13.5px]",
              "bg-ink-900 text-white transition-colors hover:bg-ink-700 dark:bg-white dark:text-ink-900 dark:hover:bg-white/90",
            )}
          >
            {t("choose")}
            <span className="grid size-6 place-items-center rounded-full bg-white/15 sm:size-7 dark:bg-ink-900/10">
              <ChevronRight aria-hidden className="size-4" />
            </span>
          </button>
          </div>
        </div>
      </article>

      {open && <ProductSheet product={product} onClose={() => setOpen(false)} />}
    </>
  );
}
