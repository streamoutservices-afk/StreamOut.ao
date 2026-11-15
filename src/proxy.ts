// Next.js 16: "proxy.ts" (em Next ≤15 este ficheiro chama-se middleware.ts)
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Ignora API (webhooks incluídos), ficheiros estáticos e internos do Next
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
