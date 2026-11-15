import type { CSSProperties } from "react";
import { LogoSymbol } from "@/components/brand/Logo";
import type { Product } from "@/data/catalog";
import { cn } from "@/lib/utils/cn";
import { BrandLogo, brandMarkSrc } from "./BrandLogo";
import { ServiceIcon } from "./ServiceIcon";

type Props = {
  product: Pick<Product, "id" | "name" | "tint" | "icon">;
  /** etiqueta no canto superior: duração da assinatura ("1 mês", "12 meses") ou "Gift card" */
  badge?: string;
  /** linha pequena por cima do valor: plano ("Individual") ou "A partir de" */
  eyebrow?: string;
  /** valor em destaque, ex.: "11 850 Kz" */
  value?: string;
  /** anima o líquido e o reflexo continuamente (sem hover) */
  live?: boolean;
  className?: string;
};

/**
 * Cartão de assinatura StreamOut.
 * Camadas (de trás para a frente): metal líquido na cor da marca → supergráfica com o símbolo da marca,
 * a sair pelo canto → grão fino → reflexo de luz → conteúdo (logótipo, duração, faixa de vidro com o preço).
 * Tudo escala com a largura do cartão (unidades cqw), por isso funciona igual no telemóvel e no desktop.
 */
export function LiquidCard({ product, badge, eyebrow, value, live = false, className }: Props) {
  const mark = brandMarkSrc(product.id);
  const style = {
    "--tint": product.tint[0],
    "--deep": product.tint[1],
    ...(mark ? { "--mark": `url(${mark})` } : {}),
    containerType: "inline-size",
  } as CSSProperties;

  return (
    <div className={cn("liquid-card", className)} data-live={live} style={style}>
      <div className="liquid-layer" aria-hidden />
      <div className="liquid-iris" aria-hidden />

      {/* Supergráfica: símbolo da marca em grande, cortado pelo canto */}
      {mark ? (
        <span className="card-mark" aria-hidden />
      ) : (
        <span className="card-mark-icon" aria-hidden>
          <ServiceIcon icon={product.icon} className="size-full" />
        </span>
      )}
      <span className="card-grain" aria-hidden />
      <span className="card-sheen" aria-hidden />

      <div className="relative flex h-full flex-col p-[5.5cqw] text-left">
        {/* Marca · duração */}
        <div className="flex items-start justify-between gap-[3cqw]">
          <BrandLogo
            id={product.id}
            name={product.name}
            className="h-[13cqw] w-[40cqw] object-left @max-3xs:h-[11cqw] @max-3xs:w-[33cqw] drop-shadow-[0_2px_8px_rgb(0_0_0/0.3)]"
            fallback={
              <span className="line-clamp-2 max-w-[56cqw] text-[max(13px,6.6cqw)] font-bold leading-[1.05] tracking-tight [text-shadow:0_1px_10px_rgb(0_0_0/0.3)]">
                {product.name}
              </span>
            }
          />
          {badge && (
            <span className="shrink-0 rounded-full border border-white/35 bg-white/15 px-[2.6cqw] py-[0.9cqw] text-[max(8.5px,3cqw)] font-semibold uppercase tracking-[0.1em] whitespace-nowrap @max-3xs:px-[2cqw] @max-3xs:tracking-[0.04em] shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] backdrop-blur-md">
              {badge}
            </span>
          )}
        </div>

        {/* Faixa de vidro: plano + preço · emissor */}
        <div className="card-band -mx-[5.5cqw] -mb-[5.5cqw] mt-auto flex items-end justify-between gap-[3cqw] px-[5.5cqw] pt-[3cqw] pb-[4.4cqw]">
          <div className="min-w-0">
            {eyebrow && (
              <p className="truncate text-[max(8px,2.9cqw)] font-semibold uppercase tracking-[0.14em] text-white/75">{eyebrow}</p>
            )}
            {value && (
              <p className="mt-[0.8cqw] text-[max(15px,7.6cqw)] font-semibold leading-none tracking-tight tabular-nums [text-shadow:0_1px_8px_rgb(0_0_0/0.25)]">
                {value}
              </p>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-[1.4cqw] opacity-90">
            <LogoSymbol tone="white" title="" className="size-[max(15px,6cqw)]" />
            <span className="text-[max(8px,2.8cqw)] font-semibold tracking-tight @max-3xs:hidden">StreamOut</span>
          </span>
        </div>
      </div>
    </div>
  );
}
