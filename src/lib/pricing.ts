/**
 * Preços em kwanzas a partir do preço oficial em USD de cada empresa.
 *
 * FX_USD_AOA — taxa de referência do BNA. O kwanza está praticamente fixo nos ~912 Kz/USD
 *              desde o fim de 2024 (BFA, Relatório de Conjuntura 3T 2026). Actualizar aqui.
 * MARKUP     — margem da StreamOut sobre o preço oficial (0 = mesmo preço da empresa).
 *              Ex.: 0.08 = +8% para cobrir comissões de pagamento e custo real das divisas.
 * ROUND_TO   — arredonda para cima ao múltiplo de 50 Kz mais próximo (preços "limpos").
 */
export const FX_USD_AOA = 912;
export const MARKUP = 0;
export const ROUND_TO = 50;

export function usdToKz(usd: number): number {
  const raw = usd * FX_USD_AOA * (1 + MARKUP);
  return Math.ceil(raw / ROUND_TO) * ROUND_TO;
}

export function formatKz(kz: number, locale: string): string {
  const n = new Intl.NumberFormat(locale === "pt" ? "pt-AO" : "en-US", { maximumFractionDigits: 0 }).format(kz);
  return `${n} Kz`;
}

/** Desconto por período do Bundle StreamOut */
export const BUNDLE_PERIOD_DISCOUNT: Record<3 | 6 | 12, number> = { 3: 0.05, 6: 0.1, 12: 0.15 };
