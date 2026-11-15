import { type Bundle, findPlan } from "@/data/catalog";
import { BUNDLE_PERIOD_DISCOUNT, ROUND_TO, usdToKz } from "./pricing";

export type Period = 3 | 6 | 12;

export function bundleMonthlyUsd(bundle: Bundle) {
  return bundle.items.reduce((sum, item) => sum + (findPlan(item.product, item.plan)?.usd ?? 0), 0);
}

/** Preço do bundle para um período: soma oficial × meses − desconto do período */
export function bundlePrice(bundle: Bundle, period: Period) {
  const separateMonthly = usdToKz(bundleMonthlyUsd(bundle));
  const separateTotal = separateMonthly * period;
  const total = Math.ceil((separateTotal * (1 - BUNDLE_PERIOD_DISCOUNT[period])) / ROUND_TO) * ROUND_TO;
  return {
    total,
    perMonth: Math.round(total / period / ROUND_TO) * ROUND_TO,
    separateTotal,
    savings: separateTotal - total,
    discountPct: Math.round(BUNDLE_PERIOD_DISCOUNT[period] * 100),
  };
}
