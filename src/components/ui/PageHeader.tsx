import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full bg-brand-royal/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-royal dark:bg-brand-cyan/10 dark:text-brand-cyan",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  as: Tag = "h1",
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  as?: "h1" | "h2";
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto text-center" : "", "max-w-2xl", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Tag className="mt-4 text-balance text-[30px] font-semibold leading-[1.1] tracking-tight sm:text-5xl">{title}</Tag>
      {subtitle && <p className="mt-3 text-pretty text-[15px] leading-relaxed sm:mt-4 sm:text-[16px] text-ink-800/65 dark:text-white/55">{subtitle}</p>}
    </div>
  );
}
