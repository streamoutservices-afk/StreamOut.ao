import type { CSSProperties, ReactNode } from "react";
import type { Product } from "@/data/catalog";
import { cn } from "@/lib/utils/cn";
import { ServiceIcon } from "./ServiceIcon";

/*
 * Logótipos oficiais das marcas, lidos de public/brands/<id>.(svg|png|webp).
 * A lista dos ficheiros existentes é gerada no build (next.config.ts → NEXT_PUBLIC_BRAND_LOGOS),
 * por isso não há pedidos 404 nem "piscar" quando um logótipo ainda não foi adicionado.
 */
const AVAILABLE = new Set((process.env.NEXT_PUBLIC_BRAND_LOGOS ?? "").split(",").filter(Boolean));

export function brandLogoSrc(id: string): string | null {
  for (const ext of ["svg", "png", "webp"]) {
    if (AVAILABLE.has(`${id}.${ext}`)) return `/brands/${id}.${ext}`;
  }
  return null;
}

/** Símbolo isolado da marca (public/brands/marks/<id>.png) — usado como supergráfica nos cartões */
const MARKS = new Set((process.env.NEXT_PUBLIC_BRAND_MARKS ?? "").split(",").filter(Boolean));
export function brandMarkSrc(id: string): string | null {
  for (const ext of ["svg", "png", "webp"]) {
    if (MARKS.has(`${id}.${ext}`)) return `/brands/marks/${id}.${ext}`;
  }
  return null;
}

type Tone = "white" | "auto" | "color";

const toneClass: Record<Tone, string> = {
  white: "brightness-0 invert", // monocromático branco (cartões e mosaicos coloridos)
  auto: "brightness-0 dark:invert", // preto no modo claro, branco no escuro
  color: "", // cores originais
};

export function BrandLogo({
  id,
  name,
  tone = "white",
  className,
  fallback = null,
}: {
  id: string;
  name: string;
  tone?: Tone;
  className?: string;
  fallback?: ReactNode;
}) {
  const src = brandLogoSrc(id);
  if (!src) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVGs/PNGs locais simples, sem necessidade de otimização
    <img src={src} alt={name} draggable={false} className={cn("object-contain", toneClass[tone], className)} />
  );
}

/** Mosaico quadrado com a cor da marca e o logótipo (ou ícone) — listas, checkout, painel */
export function BrandTile({
  product,
  className,
  iconClassName = "size-5",
}: {
  product: Pick<Product, "id" | "name" | "icon" | "tint">;
  className?: string;
  iconClassName?: string;
}) {
  const style = { background: `linear-gradient(135deg, ${product.tint[0]}, ${product.tint[1]})` } as CSSProperties;
  return (
    <span
      style={style}
      className={cn(
        "grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.3)]",
        className,
      )}
    >
      <BrandLogo
        id={product.id}
        name={product.name}
        className="h-[46%] w-[70%]"
        fallback={<ServiceIcon icon={product.icon} className={iconClassName} />}
      />
    </span>
  );
}
