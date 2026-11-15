"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { LogoSymbol } from "@/components/brand/Logo";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  message: ReactNode;
  /** referência curta no rodapé do bilhete (ex.: nº da encomenda) */
  stub?: ReactNode;
  className?: string;
};

/**
 * Bilhete holográfico de confirmação (ref. vídeo 1), nas cores StreamOut.
 * Inclina-se em 3D e o reflexo segue o ponteiro/dedo; entra com uma animação e depois flutua.
 */
export function SuccessTicket({ title, message, stub, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width; // 0..1
    const y = (e.clientY - r.top) / r.height;
    el.dataset.tilting = "true";
    el.style.setProperty("--ry", `${(x - 0.5) * 26}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 22}deg`);
    el.style.setProperty("--px", `${x * 100}%`);
    el.style.setProperty("--py", `${y * 100}%`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.dataset.tilting = "false";
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--px", "50%");
    el.style.setProperty("--py", "50%");
  }

  return (
    <div className={cn("holo-stage relative grid place-items-center", className)}>
      <div className="holo-float relative">
        <div aria-hidden className="holo-glow" />
        <div
          ref={ref}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className="holo-ticket flex h-[372px] w-[286px] touch-none flex-col items-center text-ink-950"
        >
          <div className="relative z-10 mt-[58px] grid size-[96px] place-items-center rounded-full bg-white/35 shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_10px_30px_-10px_rgb(0_60_160/0.45)] backdrop-blur-sm">
            <LogoSymbol tone="color" title="" className="size-[70px]" />
          </div>
          <div className="holo-perf" aria-hidden />
          <div className="relative z-10 mt-auto mb-7 px-7 text-center">
            <p className="text-[25px] font-semibold tracking-tight">{title}</p>
            <div className="mt-1.5 text-[13px] leading-snug text-ink-900/75">{message}</div>
            {stub && <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-900/55">{stub}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
