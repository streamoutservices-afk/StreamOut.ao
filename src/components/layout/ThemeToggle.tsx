"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";

// true no cliente, false no servidor — evita mismatch de hidratação sem useEffect
const noopSubscribe = () => () => {};
const useIsClient = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

export function ThemeToggle() {
  const t = useTranslations("Header.theme");
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();
  const isDark = isClient && resolvedTheme === "dark";

  return (
    <GlassButton
      size="icon"
      aria-label={t("label")}
      aria-pressed={isClient ? isDark : undefined}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Os ícones trocam via variante dark: (CSS), por isso não há "piscar" antes da hidratação */}
      <Sun
        aria-hidden
        className="size-[18px] rotate-0 scale-100 opacity-100 transition-all duration-500 ease-apple dark:-rotate-90 dark:scale-50 dark:opacity-0"
      />
      <Moon
        aria-hidden
        className="absolute size-[18px] rotate-90 scale-50 opacity-0 transition-all duration-500 ease-apple dark:rotate-0 dark:scale-100 dark:opacity-100"
      />
    </GlassButton>
  );
}
