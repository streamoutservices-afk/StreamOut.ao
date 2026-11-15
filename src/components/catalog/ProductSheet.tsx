"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { Check, Globe2, ShoppingBag, X, Zap } from "lucide-react";
import { planParts, type Product } from "@/data/catalog";
import { formatKz, usdToKz } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/components/providers/AppState";
import { LiquidCard } from "./LiquidCard";
import { DeliveryBadge } from "./DeliveryBadge";

/** Ficha de produto: sobe do fundo no telemóvel, abre ao centro no computador */
export function ProductSheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const locale = useLocale() as "pt" | "en";
  const t = useTranslations("Catalog");
  const { add } = useCart();
  const router = useRouter();
  const [planId, setPlanId] = useState(product.plans[0].id);
  const [added, setAdded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const plan = product.plans.find((p) => p.id === planId) ?? product.plans[0];
  const price = formatKz(usdToKz(plan.usd), locale);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (!added) return;
    const id = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(id);
  }, [added]);

  const isGift = product.kind === "giftcard";

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-6">
      <div aria-hidden onClick={onClose} className="fade-in absolute inset-0 bg-ink-950/45 backdrop-blur-sm dark:bg-black/60" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className={cn(
          "sheet-in relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] border p-5 pb-[max(20px,env(safe-area-inset-bottom))]",
          "sm:max-w-[480px] sm:rounded-[30px] sm:p-6",
          "border-white/70 bg-white/92 text-ink-900 shadow-[0_-20px_60px_-20px_rgb(0_30_80/0.4)] backdrop-blur-2xl",
          "dark:border-white/10 dark:bg-[#15171c]/95 dark:text-white",
        )}
      >
        <div aria-hidden className="mx-auto -mt-1 mb-4 h-1.5 w-10 rounded-full bg-black/15 sm:hidden dark:bg-white/20" />
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-black/[0.05] text-ink-800/70 hover:bg-black/[0.09] sm:right-5 sm:top-5 dark:bg-white/[0.08] dark:text-white/70"
        >
          <X aria-hidden className="size-[18px]" />
        </button>

        <div className="mx-auto max-w-[360px] pt-2 sm:pt-6">
          <LiquidCard
            live
            product={product}
            badge={isGift ? t("giftCard") : (planParts(plan, locale).duration ?? undefined)}
            eyebrow={planParts(plan, locale).tier}
            value={price}
          />
        </div>

        <div className="mt-6">
          <h2 className="text-[22px] font-semibold tracking-tight">{product.name}</h2>
          <p className="mt-1 text-[14px] leading-snug text-ink-800/65 dark:text-white/55">{product.tagline[locale]}</p>
          <DeliveryBadge mode={product.delivery} className="mt-3" />
        </div>

        <fieldset className="mt-6">
          <legend className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-800/50 dark:text-white/45">
            {isGift ? t("chooseValue") : t("choosePlan")}
          </legend>
          <div className={cn("grid gap-2", isGift && "grid-cols-2")}>
            {product.plans.map((p) => {
              const active = p.id === planId;
              return (
                <label
                  key={p.id}
                  className={cn(
                    "relative flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
                    isGift && "flex-col items-start gap-1 px-3.5",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-royal/60",
                    active
                      ? "border-brand-royal/50 bg-brand-royal/[0.07] dark:border-brand-cyan/40 dark:bg-brand-cyan/[0.07]"
                      : "border-black/[0.08] hover:bg-black/[0.025] dark:border-white/10 dark:hover:bg-white/[0.04]",
                  )}
                >
                  <input type="radio" name={`plan-${product.id}`} value={p.id} checked={active} onChange={() => setPlanId(p.id)} className="sr-only" />
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border",
                        active ? "border-transparent bg-brand-royal text-white dark:bg-brand-cyan dark:text-ink-950" : "border-black/20 dark:border-white/25",
                      )}
                    >
                      {active && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className={cn("text-[14px] font-medium", isGift ? "whitespace-nowrap" : "truncate")}>{p.label[locale]}</span>
                  </span>
                  <span className={cn("shrink-0 text-[14px] font-semibold tabular-nums", isGift && "pl-[30px] text-[15px]")}>
                    {formatKz(usdToKz(p.usd), locale)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <ul className="mt-5 space-y-2 text-[12.5px] text-ink-800/60 dark:text-white/50">
          <li className="flex gap-2">
            <Zap aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            {product.delivery === "instant" ? t("noteInstant") : t("noteOnDemand")}
          </li>
          <li className="flex gap-2">
            <Globe2 aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            {t("noteRegion")}
          </li>
        </ul>

        <div className="sticky bottom-0 -mx-5 mt-6 grid grid-cols-2 gap-2 bg-gradient-to-t from-white via-white/95 px-5 pt-3 sm:-mx-6 sm:px-6 dark:from-[#15171c] dark:via-[#15171c]/95">
          <button
            type="button"
            onClick={() => {
              add(product.id, plan.id);
              setAdded(true);
            }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-black/[0.1] text-[14.5px] font-semibold transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            {added ? <Check aria-hidden className="size-4" /> : <ShoppingBag aria-hidden className="size-4" />}
            <span aria-live="polite">{added ? t("added") : t("addShort")}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              add(product.id, plan.id);
              onClose();
              router.push("/checkout");
            }}
            className="h-12 rounded-full bg-linear-to-br from-brand-royal to-brand-cyan text-[14.5px] font-semibold text-white shadow-brand active:scale-[0.98]"
          >
            {t("buyNow", { price })}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
