"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { Avatar, UserMenu } from "@/components/account/UserMenu";
import { useCart, useSession } from "@/components/providers/AppState";
import { GlassButton } from "@/components/ui/GlassButton";
import { cn } from "@/lib/utils/cn";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/gift-cards", key: "giftCards" },
  { href: "/subscriptions", key: "subscriptions" },
  { href: "/bundle", key: "bundle", highlight: true },
  { href: "/how-it-works", key: "howItWorks" },
] as const;

export function Header() {
  const t = useTranslations("Header");
  const pathname = usePathname();
  const { count: cartCount, pulse } = useCart();
  const { session } = useSession();
  const isAuthenticated = !!session;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Menu de conta: fecha ao clicar fora ou com Esc
  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!accountRef.current?.contains(target) && !dropdownRef.current?.contains(target)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAccountOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  // Vidro mais denso depois de começar a rolar (como a barra do Safari/apple.com)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Menu móvel: Esc fecha e o fundo deixa de rolar
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const accountHref = isAuthenticated ? "/dashboard" : "/login";
  const accountLabel = isAuthenticated ? t("actions.account") : t("actions.signIn");

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <a
        href="#main"
        className="sr-only rounded-full bg-brand-royal px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
      >
        {t("skipToContent")}
      </a>

      <div
        className={cn(
          "relative mx-auto flex h-14 max-w-6xl items-center gap-2 rounded-2xl border px-2.5 sm:gap-3 sm:px-3",
          "backdrop-blur-md backdrop-saturate-150",
          "transition-[background-color,box-shadow,border-color] duration-500 ease-apple",
          scrolled
            ? "bg-white/70 border-white/60 shadow-glass dark:bg-ink-800/65 dark:border-white/10 dark:shadow-glass-dark"
            : "bg-white/40 border-white/40 dark:bg-ink-800/30 dark:border-white/[0.06]",
          "reduced-transparency:bg-paper-50 dark:reduced-transparency:bg-ink-800",
        )}
      >
        {/* Marca */}
        <Link
          href="/"
          aria-label={t("homeLabel")}
          className="flex shrink-0 items-center rounded-xl px-1.5 py-1.5 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60"
        >
          {/* Logótipo oficial: azul no modo claro, branco no escuro. title="" porque o link já tem aria-label */}
          <Logo title="" className="h-[22px] sm:h-6" />
        </Link>

        {/* Navegação desktop */}
        <nav aria-label={t("navLabel")} className="mx-auto hidden md:block">
          <ul className="flex items-center gap-0.5">
            {NAV.map((item) => {
              const active = isActive(item.href);
              const highlight = "highlight" in item && item.highlight;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13.5px] transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60",
                      active
                        ? "bg-black/[0.05] text-ink-900 dark:bg-white/10 dark:text-white"
                        : "text-ink-800/70 hover:bg-black/[0.035] hover:text-ink-900 dark:text-white/65 dark:hover:bg-white/[0.06] dark:hover:text-white",
                    )}
                  >
                    {highlight ? (
                      <>
                        <span className="bg-linear-to-r from-brand-royal to-brand-cyan bg-clip-text font-medium text-transparent">
                          {t(`nav.${item.key}`)}
                        </span>
                        <span
                          title={t("bundleBadgeLabel")}
                          className="rounded-full bg-brand-royal/10 px-1.5 py-px text-[10px] font-semibold text-brand-royal dark:bg-brand-cyan/15 dark:text-brand-cyan"
                        >
                          <span aria-hidden>{t("bundleBadge")}</span>
                          <span className="sr-only">{t("bundleBadgeLabel")}</span>
                        </span>
                      </>
                    ) : (
                      t(`nav.${item.key}`)
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Acções */}
        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <LanguageSwitcher className="hidden sm:grid" />
          <ThemeToggle />

          <div key={pulse} className="relative" style={pulse ? { animation: "cart-bump 0.45s var(--ease-apple)" } : undefined}>
            <GlassButton href="/checkout" size="icon" aria-label={t("actions.cart", { count: cartCount })}>
              <ShoppingBag aria-hidden className="size-[18px]" />
            </GlassButton>
            {cartCount > 0 && (
              <span
                aria-hidden
                className="pointer-events-none absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-linear-to-br from-brand-royal to-brand-cyan px-1 text-[10px] font-semibold text-white ring-2 ring-paper-50 dark:ring-ink-900"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </div>

          {session ? (
            <div ref={accountRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label={t("actions.account")}
                className="grid size-9 place-items-center rounded-full ring-2 ring-white/70 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-brand-royal/60 dark:ring-white/15"
              >
                <Avatar name={session.name} className="size-9 text-[13px]" />
              </button>
              {/* Portal: fora da barra de vidro, para o Liquid Glass desfocar a página por trás */}
              {accountOpen &&
                createPortal(
                  <div
                    ref={dropdownRef}
                    className="notify-in fixed right-[max(1rem,calc((100vw-72rem)/2+0.75rem))] top-[84px] z-[60]"
                  >
                    <UserMenu onNavigate={() => setAccountOpen(false)} />
                  </div>,
                  document.body,
                )}
            </div>
          ) : (
            <GlassButton href={accountHref} variant="primary" size="sm" className="hidden sm:inline-flex">
              <UserRound aria-hidden className="size-4" />
              {accountLabel}
            </GlassButton>
          )}

          <GlassButton
            size="icon"
            className="md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? t("actions.closeMenu") : t("actions.openMenu")}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X aria-hidden className="size-[18px]" /> : <Menu aria-hidden className="size-[18px]" />}
          </GlassButton>
        </div>
      </div>

      {/* Painel móvel — fica FORA da barra: um backdrop-filter dentro de outro não desfoca a página */}
      <div
        id="mobile-nav"
        inert={!menuOpen}
        className={cn(
          "absolute inset-x-3 top-[calc(100%+0.5rem)] origin-top rounded-2xl border p-3 sm:inset-x-4 md:hidden",
          "bg-white/85 border-white/60 shadow-glass backdrop-blur-xl backdrop-saturate-150",
          "dark:bg-ink-800/85 dark:border-white/10 dark:shadow-glass-dark",
          "reduced-transparency:bg-paper-50 dark:reduced-transparency:bg-ink-800",
          "transition-[opacity,transform] duration-300 ease-apple motion-reduce:transition-none",
          menuOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0",
        )}
      >
        <nav aria-label={t("navLabel")}>
          <ul className="flex flex-col">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-[16px] font-medium transition-colors hover:bg-black/[0.04] aria-[current=page]:text-brand-royal dark:hover:bg-white/[0.06] dark:aria-[current=page]:text-brand-cyan"
                >
                  {t(`nav.${item.key}`)}
                  {"highlight" in item && item.highlight && (
                    <span className="rounded-full bg-brand-royal/10 px-2 py-0.5 text-[11px] font-semibold text-brand-royal dark:bg-brand-cyan/15 dark:text-brand-cyan">
                      {t("bundleBadgeLabel")}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-2 flex items-center gap-2 border-t border-black/[0.06] pt-3 dark:border-white/10">
          <LanguageSwitcher className="sm:hidden" />
          <GlassButton href={accountHref} onClick={closeMenu} variant="primary" size="md" className="flex-1">
            <UserRound aria-hidden className="size-4" />
            {accountLabel}
          </GlassButton>
        </div>
      </div>
    </header>
  );
}
