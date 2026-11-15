import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt", "en"],
  defaultLocale: "pt",
  localePrefix: "always", // /pt/... e /en/... — URLs explícitos, bons para SEO e partilha
});

export type Locale = (typeof routing.locales)[number];
