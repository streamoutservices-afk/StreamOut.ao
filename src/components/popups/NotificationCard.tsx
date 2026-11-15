"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type NotifyAction = { label: string; onClick: () => void };

type Props = {
  title: string;
  /** texto secundário ao lado do título, mais esbatido (ex.: "termina em 2 h") */
  accent?: string;
  body?: ReactNode;
  icon?: ReactNode;
  secondary?: NotifyAction;
  primary?: NotifyAction;
  onClose?: () => void;
  closeLabel?: string;
  leaving?: boolean;
  className?: string;
  children?: ReactNode;
};

/** Cartão de notificação (ref. vídeo 2): escuro no modo escuro, branco no claro */
export function NotificationCard({
  title,
  accent,
  body,
  icon,
  secondary,
  primary,
  onClose,
  closeLabel = "Fechar",
  leaving,
  className,
  children,
}: Props) {
  return (
    <div
      role="dialog"
      aria-label={title}
      className={cn(
        "w-[min(392px,calc(100vw-24px))] rounded-[22px] border p-4",
        "border-black/[0.06] bg-white/90 text-ink-900 shadow-[0_30px_70px_-24px_rgb(0_30_80/0.45)] backdrop-blur-2xl",
        "dark:border-white/10 dark:bg-[#1b1c20]/92 dark:text-white dark:shadow-[0_30px_70px_-20px_rgb(0_0_0/0.75)]",
        leaving ? "notify-out" : "notify-in",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold leading-snug tracking-tight">
            {title} {accent && <span className="font-medium text-ink-800/40 dark:text-white/35">{accent}</span>}
          </p>
          {body && <div className="mt-1 text-[12.5px] leading-snug text-ink-800/55 dark:text-white/45">{body}</div>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-ink-800/40 transition-colors hover:bg-black/[0.05] hover:text-ink-900 dark:text-white/35 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <X aria-hidden className="size-[18px]" />
          </button>
        )}
      </div>

      {children}

      {(primary || secondary) && (
        <div className="mt-4 flex items-center justify-between gap-2">
          {secondary ? (
            <button
              type="button"
              onClick={secondary.onClick}
              className="h-9 rounded-[10px] bg-black/[0.045] px-3.5 text-[13.5px] font-medium transition-colors hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.11]"
            >
              {secondary.label}
            </button>
          ) : (
            <span />
          )}
          {primary && (
            <button
              type="button"
              onClick={primary.onClick}
              className="h-9 rounded-[10px] bg-ink-900 px-4 text-[13.5px] font-semibold text-white shadow-sm transition-transform active:scale-[0.97] dark:bg-white dark:text-ink-900"
            >
              {primary.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
