"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "@/components/providers/AppState";
import { LogoSymbol } from "@/components/brand/Logo";
import { cn } from "@/lib/utils/cn";

const inputCls =
  "h-12 w-full rounded-xl border border-black/[0.08] bg-white/70 px-4 text-[15px] placeholder:text-ink-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60 aria-[invalid=true]:border-red-500/70 dark:border-white/10 dark:bg-white/[0.05] dark:placeholder:text-white/35";

/**
 * Entrar / criar conta com 2FA obrigatório (OTP por e-mail ou SMS).
 * Interface de demonstração: em produção, o servidor envia e valida o código (ver ARQUITETURA.md).
 */
export function LoginView() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const { signIn } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  function submitCredentials(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError(t("errors.email"));
    if (password.length < 8) return setError(t("errors.password"));
    if (mode === "signup" && name.trim().length < 2) return setError(t("errors.name"));
    setError(null);
    setStep("otp");
    setResendIn(30);
    setTimeout(() => boxes.current[0]?.focus(), 50);
  }

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(-1);
    setCode((c) => c.map((x, idx) => (idx === i ? d : x)));
    if (d && i < 5) boxes.current[i + 1]?.focus();
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[i] && i > 0) boxes.current[i - 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (digits.length < 2) return;
    e.preventDefault();
    setCode(digits.padEnd(6, " ").split("").map((c) => c.trim()));
    boxes.current[Math.min(digits.length, 5)]?.focus();
  }

  function verify(e: FormEvent) {
    e.preventDefault();
    if (code.join("").length !== 6) return setError(t("errors.code"));
    const display = mode === "signup" && name.trim() ? name.trim() : email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    signIn({ name: display, email, tier: "plus" });
    router.push("/dashboard");
  }

  const masked = channel === "email" ? email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${"•".repeat(Math.min(b.length, 6))}${c}`) : "+244 9•• ••• •••";

  return (
    <main id="main" className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16">
      <div className="glass w-full rounded-[30px] p-7 sm:p-8">
        <LogoSymbol title="" className="size-12" />

        {step === "credentials" ? (
          <form onSubmit={submitCredentials} noValidate>
            <h1 className="mt-5 text-[28px] font-semibold tracking-tight">{mode === "signin" ? t("signInTitle") : t("signUpTitle")}</h1>
            <p className="mt-1.5 text-[14.5px] text-ink-800/60 dark:text-white/50">{t("subtitle")}</p>
            <div className="mt-7 space-y-3">
              {mode === "signup" && (
                <label className="block">
                  <span className="sr-only">{t("name")}</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder={t("name")} className={inputCls} />
                </label>
              )}
              <label className="block">
                <span className="sr-only">{t("email")}</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder={t("email")} className={inputCls} />
              </label>
              <label className="block">
                <span className="sr-only">{t("password")}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder={t("password")}
                  className={inputCls}
                />
              </label>
            </div>
            {error && (
              <p role="alert" className="mt-3 text-[13px] text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <button type="submit" className="mt-6 h-12 w-full rounded-full bg-linear-to-br from-brand-royal to-brand-cyan text-[15px] font-semibold text-white shadow-brand active:scale-[0.98]">
              {t("continue")}
            </button>
            <p className="mt-5 text-center text-[13.5px] text-ink-800/60 dark:text-white/50">
              {mode === "signin" ? t("noAccount") : t("haveAccount")}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode((m) => (m === "signin" ? "signup" : "signin"));
                  setError(null);
                }}
                className="font-semibold text-brand-royal hover:underline dark:text-brand-cyan"
              >
                {mode === "signin" ? t("createAccount") : t("signInLink")}
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={verify} noValidate>
            <button
              type="button"
              onClick={() => setStep("credentials")}
              className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium text-ink-800/55 hover:text-ink-900 dark:text-white/50 dark:hover:text-white"
            >
              <ArrowLeft aria-hidden className="size-4" /> {t("back")}
            </button>
            <h1 className="mt-3 text-[28px] font-semibold tracking-tight">{t("otpTitle")}</h1>
            <p className="mt-1.5 text-[14.5px] text-ink-800/60 dark:text-white/50">{t("otpBody", { target: masked })}</p>

            <div role="radiogroup" aria-label={t("channel")} className="mt-5 inline-grid grid-cols-2 rounded-full bg-black/[0.045] p-1 dark:bg-white/[0.06]">
              {(["email", "sms"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={channel === c}
                  onClick={() => {
                    setChannel(c);
                    setResendIn(30);
                  }}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium",
                    channel === c ? "bg-white shadow-glass dark:bg-white/15" : "text-ink-800/60 dark:text-white/55",
                  )}
                >
                  {c === "email" ? <Mail aria-hidden className="size-3.5" /> : <MessageSquare aria-hidden className="size-3.5" />}
                  {c === "email" ? "E-mail" : "SMS"}
                </button>
              ))}
            </div>

            <fieldset className="mt-6">
              <legend className="sr-only">{t("otpTitle")}</legend>
              <div className="flex justify-between gap-2">
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      boxes.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => onKey(i, e)}
                    onPaste={onPaste}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    aria-label={t("digit", { n: i + 1 })}
                    className="h-14 w-full rounded-xl border border-black/[0.08] bg-white/70 text-center text-[22px] font-semibold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60 dark:border-white/10 dark:bg-white/[0.05]"
                  />
                ))}
              </div>
            </fieldset>
            <p className="mt-3 text-[12px] text-ink-800/50 dark:text-white/40">{t("demoHint")}</p>
            {error && (
              <p role="alert" className="mt-2 text-[13px] text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <button type="submit" className="mt-6 h-12 w-full rounded-full bg-linear-to-br from-brand-royal to-brand-cyan text-[15px] font-semibold text-white shadow-brand active:scale-[0.98]">
              {t("verify")}
            </button>
            <button
              type="button"
              disabled={resendIn > 0}
              onClick={() => setResendIn(30)}
              className="mt-4 w-full text-center text-[13px] font-medium text-brand-royal disabled:text-ink-800/45 dark:text-brand-cyan dark:disabled:text-white/35"
            >
              {resendIn > 0 ? t("resendIn", { s: resendIn }) : t("resend")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
