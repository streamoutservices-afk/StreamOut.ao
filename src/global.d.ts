import type messages from "../messages/pt.json";
import type { routing } from "./i18n/routing";

// Mensagens tipadas: o TypeScript avisa se uma chave t("...") não existir em pt.json
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
