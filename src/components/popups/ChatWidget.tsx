"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp, MessageCircle, X } from "lucide-react";
import { LogoSymbol } from "@/components/brand/Logo";
import { cn } from "@/lib/utils/cn";

type Msg = { from: "bot" | "user"; text: string };

type Topic = "payment" | "delivery" | "bundle" | "prices" | "refund" | "security" | "human" | "hello";

// Palavras-chave PT/EN → tema. Substituir por um modelo de IA/serviço de suporte quando houver backend.
const KEYWORDS: [Topic, RegExp][] = [
  ["hello", /\b(ol[aá]|bom dia|boa tarde|boa noite|hello|hi|hey)\b/i],
  ["payment", /(pag|multicaixa|kwanza|refer[eê]ncia|transfer|pay|payment|card|cart[aã]o)/i],
  ["delivery", /(entrega|quando|demora|tempo|receb|c[oó]digo|deliver|how long|when|receive|code)/i],
  ["bundle", /(bundle|pacote|plano|desconto|discount|plan)/i],
  ["prices", /(pre[cç]o|quanto|custa|valor|caro|price|cost|how much)/i],
  ["refund", /(reembols|devolu|cancel|refund|money back)/i],
  ["security", /(segur|confi|fraude|safe|secure|trust|scam)/i],
  ["human", /(humano|pessoa|agente|atendente|whatsapp|falar com|human|agent|person|support)/i],
];

function detect(text: string): Topic | null {
  return KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? null;
}

/** Assistente do site (UI no estilo dos pop-ups, ref. vídeo 2) */
export function ChatWidget() {
  const t = useTranslations("Chat");
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && msgs.length === 0) setMsgs([{ from: "bot", text: t("welcome") }]);
    if (open) setTimeout(() => inputRef.current?.focus(), 250);
  }, [open, msgs.length, t]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function ask(text: string, topic?: Topic) {
    const clean = text.trim();
    if (!clean) return;
    setMsgs((m) => [...m, { from: "user", text: clean }]);
    setInput("");
    setTyping(true);
    const found = topic ?? detect(clean);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "bot", text: found ? t(`answers.${found}`) : t("fallback") }]);
    }, 750);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  const quick = ["delivery", "payment", "bundle", "human"] as const;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label={t("title")}
          className={cn(
            "notify-in fixed bottom-20 right-3 z-[75] flex h-[min(560px,calc(100dvh-110px))] sm:bottom-24 w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden rounded-[24px] border sm:right-6",
            "border-black/[0.06] bg-white/92 text-ink-900 shadow-[0_30px_70px_-24px_rgb(0_30_80/0.45)] backdrop-blur-2xl",
            "dark:border-white/10 dark:bg-[#1b1c20]/94 dark:text-white dark:shadow-[0_30px_70px_-20px_rgb(0_0_0/0.75)]",
          )}
        >
          <header className="flex items-center gap-3 border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.07]">
            <span className="grid size-10 place-items-center rounded-full bg-brand-royal/10 dark:bg-white/[0.07]">
              <LogoSymbol title="" className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold tracking-tight">{t("title")}</p>
              <p className="flex items-center gap-1.5 text-[12px] text-ink-800/50 dark:text-white/45">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                {t("status")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("close")}
              className="grid size-8 place-items-center rounded-full text-ink-800/40 hover:bg-black/[0.05] dark:text-white/40 dark:hover:bg-white/[0.08]"
            >
              <X aria-hidden className="size-[18px]" />
            </button>
          </header>

          <div ref={listRef} aria-live="polite" className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <p
                key={i}
                className={cn(
                  "max-w-[85%] whitespace-pre-line rounded-[18px] px-3.5 py-2.5 text-[14px] leading-snug",
                  m.from === "bot"
                    ? "rounded-bl-md bg-black/[0.045] dark:bg-white/[0.07]"
                    : "ml-auto rounded-br-md bg-linear-to-br from-brand-royal to-[#2f8cff] text-white",
                )}
              >
                {m.text}
              </p>
            ))}
            {typing && (
              <p aria-label={t("typing")} className="flex w-fit gap-1 rounded-[18px] rounded-bl-md bg-black/[0.045] px-3.5 py-3 dark:bg-white/[0.07]">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="size-1.5 rounded-full bg-current opacity-50"
                    style={{ animation: `typing 1.1s ${d * 0.15}s infinite` }}
                  />
                ))}
              </p>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto px-4 pb-2">
            {quick.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(t(`quick.${q}`), q)}
                className="shrink-0 rounded-full border border-black/[0.08] px-3 py-1.5 text-[12.5px] font-medium hover:bg-black/[0.04] dark:border-white/10 dark:hover:bg-white/[0.06]"
              >
                {t(`quick.${q}`)}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-black/[0.06] p-3 dark:border-white/[0.07]">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{t("placeholder")}</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("placeholder")}
                className="h-10 w-full rounded-full bg-black/[0.04] px-4 text-[14px] placeholder:text-ink-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60 dark:bg-white/[0.06] dark:placeholder:text-white/35"
              />
            </label>
            <button
              type="submit"
              aria-label={t("send")}
              disabled={!input.trim()}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-royal to-brand-cyan text-white transition-opacity disabled:opacity-40"
            >
              <ArrowUp aria-hidden className="size-[18px]" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("close") : t("open")}
        className={cn(
          "fixed bottom-4 right-3 z-[75] grid size-12 place-items-center rounded-full border sm:bottom-5 sm:right-6 sm:size-14",
          "border-white/60 bg-white/70 shadow-[0_16px_40px_-12px_rgb(0_60_160/0.45)] backdrop-blur-xl transition-transform duration-300 ease-apple hover:scale-105 active:scale-95",
          "dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[0_16px_40px_-12px_rgb(0_0_0/0.7)]",
        )}
      >
        {open ? (
          <X aria-hidden className="size-6" />
        ) : (
          <>
            <LogoSymbol title="" className="size-7 sm:size-8" />
            <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-linear-to-br from-brand-royal to-brand-cyan text-white ring-2 ring-paper-50 dark:ring-ink-950">
              <MessageCircle aria-hidden className="size-3" />
            </span>
          </>
        )}
      </button>
    </>
  );
}
