import { BUNDLES, findPlan, findProduct, type Product } from "@/data/catalog";
import { bundlePrice, type Period } from "./bundle-pricing";
import { usdToKz } from "./pricing";

export const BUNDLE_PREFIX = "bundle:";

export type ResolvedItem = {
  name: string;
  detail: string;
  unitKz: number;
  product?: Product;
  isBundle: boolean;
  delivery: "instant" | "on_demand";
};

/** Resolve um item do carrinho (produto+plano ou bundle+período) para nome, detalhe e preço */
export function resolveItem(productId: string, planId: string, locale: "pt" | "en"): ResolvedItem | null {
  if (productId.startsWith(BUNDLE_PREFIX)) {
    const bundle = BUNDLES.find((b) => `${BUNDLE_PREFIX}${b.id}` === productId);
    const period = Number(planId) as Period;
    if (!bundle || ![3, 6, 12].includes(period)) return null;
    return {
      name: `Bundle StreamOut ${bundle.name[locale]}`,
      detail: locale === "pt" ? `${period} meses` : `${period} months`,
      unitKz: bundlePrice(bundle, period).total,
      isBundle: true,
      delivery: "on_demand",
    };
  }
  const product = findProduct(productId);
  const plan = findPlan(productId, planId);
  if (!product || !plan) return null;
  return {
    name: product.name,
    detail: plan.label[locale],
    unitKz: usdToKz(plan.usd),
    product,
    isBundle: false,
    delivery: product.delivery,
  };
}
