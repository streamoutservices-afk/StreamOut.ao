"use client";

import { useTranslations } from "next-intl";
import { Clock, Zap } from "lucide-react";
import type { Product } from "@/data/catalog";
import { cn } from "@/lib/utils/cn";

export function DeliveryBadge({ mode, className }: { mode: Product["delivery"]; className?: string }) {
  const t = useTranslations("Catalog");
  const instant = mode === "instant";
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        instant
          ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
          : "bg-brand-royal/10 text-brand-royal dark:bg-brand-cyan/10 dark:text-brand-cyan",
        className,
      )}
    >
      {instant ? <Zap aria-hidden className="size-3" /> : <Clock aria-hidden className="size-3" />}
      {instant ? t("deliveryInstant") : t("deliveryOnDemand")}
    </span>
  );
}
