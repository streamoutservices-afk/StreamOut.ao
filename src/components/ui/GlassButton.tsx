import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

type Variant = "glass" | "primary" | "ghost";
type Size = "sm" | "md" | "icon";

const base = [
  "group relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
  "font-medium tracking-tight whitespace-nowrap select-none",
  "transition-[transform,background-color,box-shadow,border-color,color] duration-300 ease-apple",
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-paper-50 dark:focus-visible:ring-offset-ink-950",
].join(" ");

const variants: Record<Variant, string> = {
  // Vidro neutro — o botão "por defeito" estilo Apple
  glass: [
    "border backdrop-blur-md backdrop-saturate-150",
    "bg-white/55 border-white/60 text-ink-900 shadow-glass hover:bg-white/80",
    "dark:bg-white/[0.06] dark:border-white/10 dark:text-white dark:shadow-glass-dark dark:hover:bg-white/[0.12]",
    "reduced-transparency:bg-paper-100 dark:reduced-transparency:bg-ink-700",
  ].join(" "),
  // Gradiente da marca, translúcido, com brilho a crescer no hover
  primary: [
    "border border-white/25 text-white backdrop-blur-md",
    "bg-linear-to-br from-brand-royal/90 to-brand-cyan/90 shadow-brand",
    "hover:-translate-y-px hover:from-brand-royal hover:to-brand-cyan hover:shadow-brand-hover",
  ].join(" "),
  ghost: [
    "text-ink-800/75 hover:bg-black/[0.04] hover:text-ink-900",
    "dark:text-white/70 dark:hover:bg-white/[0.07] dark:hover:text-white",
  ].join(" "),
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13.5px] gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  icon: "size-9",
};

export function glassButtonClasses(opts: { variant?: Variant; size?: Size; className?: string } = {}) {
  const { variant = "glass", size = "md", className } = opts;
  return cn(base, variants[variant], sizes[size], className);
}

/** Reflexo de luz: um feixe diagonal atravessa o botão no hover + linha de brilho no topo */
function LightReflection({ variant }: { variant: Variant }) {
  if (variant === "ghost") return null;
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 -left-1/2 -z-10 w-1/2 -skew-x-12",
          "bg-linear-to-r from-transparent via-white/45 to-transparent opacity-0",
          "transition-[transform,opacity] duration-700 ease-apple",
          "group-hover:translate-x-[300%] group-hover:opacity-100",
          "dark:via-white/15 motion-reduce:hidden",
        )}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-linear-to-r from-transparent via-white/90 to-transparent dark:via-white/30"
      />
    </>
  );
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

type LinkProps = CommonProps & Omit<ComponentProps<typeof Link>, "className" | "children">;

export type GlassButtonProps = ButtonProps | LinkProps;

/** Botão translúcido. Com `href` renderiza um Link com o idioma activo; sem `href`, um <button>. */
export function GlassButton(props: GlassButtonProps) {
  const { variant = "glass", size = "md", className, children } = props;
  const classes = glassButtonClasses({ variant, size, className });
  const content = (
    <>
      <LightReflection variant={variant} />
      <span className="relative inline-flex items-center justify-center gap-[inherit]">{children}</span>
    </>
  );

  if (props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, children: _ch, ...linkProps } = props;
    return (
      <Link {...linkProps} className={classes}>
        {content}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, href: _h, type = "button", ...buttonProps } = props;
  return (
    <button type={type} {...buttonProps} className={classes}>
      {content}
    </button>
  );
}
