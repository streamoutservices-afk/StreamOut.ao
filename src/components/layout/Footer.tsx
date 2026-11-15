import { useTranslations } from "next-intl";
import { Facebook, Instagram, Linkedin, MessageCircle, Music2, Youtube, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/Logo";
import { SOCIAL, type SocialId } from "@/data/social";
import { cn } from "@/lib/utils/cn";

const SOCIAL_ICON: Partial<Record<SocialId, LucideIcon>> = {
  instagram: Instagram,
  tiktok: Music2,
  facebook: Facebook,
  youtube: Youtube,
  linkedin: Linkedin,
  whatsapp: MessageCircle,
};

export function Footer() {
  const t = useTranslations("Footer");

  const columns = [
    {
      title: t("shop"),
      links: [
        { href: "/subscriptions", label: t("links.subscriptions") },
        { href: "/gift-cards", label: t("links.giftCards") },
        { href: "/bundle", label: t("links.bundle") },
      ],
    },
    {
      title: t("help"),
      links: [
        { href: "/how-it-works", label: t("links.howItWorks") },
        { href: "/how-it-works#faq", label: t("links.faq") },
        { href: "/dashboard", label: t("links.account") },
      ],
    },
  ];

  return (
    <footer className="relative mt-24 border-t border-black/[0.06] dark:border-white/[0.07]">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo className="h-7" />
          <p className="mt-3 text-[14px] font-medium text-ink-800/70 dark:text-white/60">{t("tagline")}</p>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-ink-800/55 dark:text-white/45">{t("about")}</p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-800/50 dark:text-white/40">{col.title}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[14px] text-ink-800/75 transition-colors hover:text-brand-royal dark:text-white/70 dark:hover:text-brand-cyan">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-800/50 dark:text-white/40">{t("follow")}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {SOCIAL.map((s) => {
              const Icon = SOCIAL_ICON[s.id];
              const content = Icon ? <Icon aria-hidden className="size-[18px]" /> : <span aria-hidden className="text-[15px] font-bold">𝕏</span>;
              const base =
                "grid size-10 place-items-center rounded-full border transition-all duration-300 ease-apple border-black/[0.07] bg-white/60 dark:border-white/10 dark:bg-white/[0.05]";
              return (
                <li key={s.id}>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${s.name} — ${t("openNewTab")}`}
                      className={cn(base, "hover:-translate-y-0.5 hover:border-brand-royal/30 hover:text-brand-royal dark:hover:text-brand-cyan")}
                    >
                      {content}
                    </a>
                  ) : (
                    <span title={`${s.name} — ${t("soon")}`} aria-label={`${s.name} — ${t("soon")}`} role="img" className={cn(base, "opacity-40")}>
                      {content}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-[12.5px] text-ink-800/55 dark:text-white/45">{t("payments")}</p>
        </div>
      </div>
      <div className="border-t border-black/[0.05] dark:border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[12px] text-ink-800/50 sm:flex-row sm:items-center sm:justify-between dark:text-white/40">
          <p>© {new Date().getFullYear()} StreamOut. {t("rights")}</p>
          <p>{t("disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
