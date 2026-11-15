"use client";

import { useTranslations } from "next-intl";
import { CreditCard, LifeBuoy, LogOut, Receipt, Settings, UserRound, Zap, type LucideIcon } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession, type Session } from "@/components/providers/AppState";
import { cn } from "@/lib/utils/cn";

export type MenuKey = "profile" | "subscriptions" | "orders" | "settings";

const ITEMS: { key: MenuKey; href: string; icon: LucideIcon }[] = [
  { key: "profile", href: "/dashboard#perfil", icon: UserRound },
  { key: "subscriptions", href: "/dashboard", icon: CreditCard },
  { key: "orders", href: "/dashboard#encomendas", icon: Receipt },
  { key: "settings", href: "/dashboard#definicoes", icon: Settings },
];

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-linear-to-br from-brand-royal to-brand-cyan font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]",
        className,
      )}
    >
      {initials || "S"}
    </span>
  );
}

export function TierBadge({ tier }: { tier: Session["tier"] }) {
  const t = useTranslations("Account");
  if (!tier) return null;
  return (
    <span className="lg-panel inline-flex items-center gap-1 !rounded-full px-2.5 py-1 text-[13px] font-semibold">
      <Zap aria-hidden className="size-3.5 fill-current" />
      {t(`tier.${tier}`)}
    </span>
  );
}

/** Menu de conta em Liquid Glass (ref. imagem 2) */
export function UserMenu({
  active,
  variant = "dropdown",
  onNavigate,
}: {
  active?: MenuKey;
  variant?: "dropdown" | "sidebar";
  onNavigate?: () => void;
}) {
  const t = useTranslations("Account");
  const { session, signOut } = useSession();
  const router = useRouter();
  if (!session) return null;
  const big = variant === "sidebar";

  return (
    <div className={cn("text-ink-900 dark:text-white", big ? "w-full" : "w-[288px]")}>
      <div className={cn("lg-panel flex items-center gap-3", big ? "p-3 pr-3.5" : "p-2.5 pr-3")}>
        <Avatar name={session.name} className={big ? "size-14 text-[18px]" : "size-11 text-[15px]"} />
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-semibold tracking-tight", big ? "text-[18px]" : "text-[15.5px]")}>{session.name}</p>
          <p className="truncate text-[12px] text-ink-800/55 dark:text-white/45">{session.email}</p>
        </div>
        <TierBadge tier={session.tier} />
      </div>

      {/* Telemóvel (painel): atalhos em linha em vez da lista completa */}
      {big && (
        <nav aria-label={t("menuLabel")} className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden">
          {ITEMS.map(({ key, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              aria-current={active === key ? "page" : undefined}
              className={cn(
                "lg-panel inline-flex shrink-0 items-center gap-2 !rounded-full px-3.5 py-2 text-[13.5px] font-semibold",
                active === key && "lg-item-active",
              )}
            >
              <Icon aria-hidden className="size-4" />
              {t(`items.${key}`)}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              signOut();
              router.push("/");
            }}
            className="lg-panel inline-flex shrink-0 items-center gap-2 !rounded-full px-3.5 py-2 text-[13.5px] font-semibold"
          >
            <LogOut aria-hidden className="size-4" />
            {t("signOut")}
          </button>
        </nav>
      )}

      <nav aria-label={t("menuLabel")} className={cn("lg-panel mt-3", big ? "hidden p-2.5 lg:block" : "p-2")}>
        <ul>
          {ITEMS.map(({ key, href, icon: Icon }) => (
            <li key={key}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active === key ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3.5 rounded-[18px] font-semibold tracking-tight transition-colors",
                  big ? "px-4 py-3.5 text-[16px]" : "px-3.5 py-3 text-[15px]",
                  active === key ? "lg-item-active" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05]",
                )}
              >
                <Icon aria-hidden className="size-5" />
                {t(`items.${key}`)}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mx-3 my-2 h-px bg-black/[0.08] dark:bg-white/[0.09]" />
        <Link
          href="/how-it-works#faq"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3.5 rounded-[18px] font-semibold tracking-tight hover:bg-black/[0.04] dark:hover:bg-white/[0.05]",
            big ? "px-4 py-3.5 text-[16px]" : "px-3.5 py-3 text-[15px]",
          )}
        >
          <LifeBuoy aria-hidden className="size-5" />
          {t("help")}
        </Link>
        <button
          type="button"
          onClick={() => {
            signOut();
            onNavigate?.();
            router.push("/");
          }}
          className={cn(
            "flex w-full items-center gap-3.5 rounded-[18px] text-left font-semibold tracking-tight hover:bg-black/[0.04] dark:hover:bg-white/[0.05]",
            big ? "px-4 py-3.5 text-[16px]" : "px-3.5 py-3 text-[15px]",
          )}
        >
          <LogOut aria-hidden className="size-5" />
          {t("signOut")}
        </button>
      </nav>
    </div>
  );
}
