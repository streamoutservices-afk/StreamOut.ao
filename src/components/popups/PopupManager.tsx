"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Mail, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useCart } from "@/components/providers/AppState";
import { SuccessTicket } from "@/components/feedback/SuccessTicket";
import { BUNDLE_PREFIX } from "@/lib/cart-items";
import { readJSON, writeJSON } from "@/lib/storage";
import { NotificationCard } from "./NotificationCard";

type Popup = "promo" | "newsletter" | null;

const SEEN_KEY = "so.popups.v1";
const QUIET_ROUTES = ["/checkout", "/login", "/dashboard"];
const PROMO_DELAY = 9000;
const NEWSLETTER_DELAY = 28000;

/** Pop-ups de promoção e newsletter (ref. vídeo 2). Cada um aparece no máximo uma vez por visitante. */
export function PopupManager() {
  const t = useTranslations("Popups");
  const pathname = usePathname();
  const router = useRouter();
  const { add } = useCart();
  const [popup, setPopup] = useState<Popup>(null);
  const [leaving, setLeaving] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [thanks, setThanks] = useState(false);

  const quiet = QUIET_ROUTES.some((r) => pathname.startsWith(r));

  const markSeen = (p: Exclude<Popup, null>) => writeJSON(SEEN_KEY, { ...readJSON(SEEN_KEY, {}), [p]: Date.now() });

  const close = useCallback(() => {
    setLeaving(true);
    setTimeout(() => {
      setPopup(null);
      setLeaving(false);
    }, 320);
  }, []);

  useEffect(() => {
    if (quiet) return;
    const seen = readJSON<Record<string, number>>(SEEN_KEY, {});
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (!seen.promo) {
      timers.push(setTimeout(() => setPopup((p) => p ?? "promo"), PROMO_DELAY));
    }
    if (!seen.newsletter) {
      timers.push(setTimeout(() => setPopup((p) => p ?? "newsletter"), NEWSLETTER_DELAY));
      const onScroll = () => {
        const progress = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
        if (progress > 0.6) {
          setPopup((p) => p ?? (readJSON<Record<string, number>>(SEEN_KEY, {}).newsletter ? p : "newsletter"));
          window.removeEventListener("scroll", onScroll);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        timers.forEach(clearTimeout);
        window.removeEventListener("scroll", onScroll);
      };
    }
    return () => timers.forEach(clearTimeout);
  }, [quiet]);

  useEffect(() => {
    if (popup) markSeen(popup);
  }, [popup]);

  function subscribe(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(true);
      return;
    }
    // TODO: POST /api/newsletter (com Turnstile) — aqui é só a interface
    close();
    setThanks(true);
    setTimeout(() => setThanks(false), 5200);
  }

  return (
    <>
      {popup && !quiet && (
        <div className="fixed inset-x-3 bottom-24 z-[70] flex justify-center sm:inset-x-auto sm:bottom-6 sm:left-6 sm:justify-start">
          {popup === "promo" ? (
            <NotificationCard
              leaving={leaving}
              title={t("promoTitle")}
              accent={t("promoAccent")}
              icon={
                <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-brand-royal to-brand-cyan text-white">
                  <Sparkles aria-hidden className="size-[18px]" />
                </span>
              }
              body={t("promoBody")}
              onClose={close}
              closeLabel={t("close")}
              secondary={{
                label: t("promoSecondary"),
                onClick: () => {
                  close();
                  router.push("/bundle");
                },
              }}
              primary={{
                label: t("promoPrimary"),
                onClick: () => {
                  add(`${BUNDLE_PREFIX}plus`, "12");
                  close();
                  router.push("/checkout");
                },
              }}
            />
          ) : (
            <NotificationCard
              leaving={leaving}
              title={t("newsTitle")}
              accent={t("newsAccent")}
              icon={
                <span className="grid size-9 place-items-center rounded-xl bg-black/[0.05] dark:bg-white/[0.08]">
                  <Mail aria-hidden className="size-[18px]" />
                </span>
              }
              body={t("newsBody")}
              onClose={close}
              closeLabel={t("close")}
            >
              <form onSubmit={subscribe} noValidate className="mt-4 flex items-center gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">{t("newsEmail")}</span>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(false);
                    }}
                    aria-invalid={error}
                    placeholder={t("newsEmail")}
                    className="h-9 w-full rounded-[10px] border border-black/[0.07] bg-black/[0.03] px-3 text-[13.5px] placeholder:text-ink-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60 aria-[invalid=true]:border-red-500/60 dark:border-white/10 dark:bg-white/[0.06] dark:placeholder:text-white/35"
                  />
                </label>
                <button
                  type="submit"
                  className="h-9 shrink-0 rounded-[10px] bg-ink-900 px-4 text-[13.5px] font-semibold text-white transition-transform active:scale-[0.97] dark:bg-white dark:text-ink-900"
                >
                  {t("newsCta")}
                </button>
              </form>
              {error && (
                <p role="alert" className="mt-2 text-[12px] text-red-600 dark:text-red-400">
                  {t("newsError")}
                </p>
              )}
            </NotificationCard>
          )}
        </div>
      )}

      {thanks && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("thanksTitle")}
          onClick={() => setThanks(false)}
          className="fixed inset-0 z-[80] grid place-items-center bg-paper-50/40 backdrop-blur-md dark:bg-ink-950/60"
        >
          <SuccessTicket title={t("thanksTitle")} message={t("thanksBody")} stub="StreamOut · Newsletter" />
        </div>
      )}
    </>
  );
}
