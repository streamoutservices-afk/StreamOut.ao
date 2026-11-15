import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Cabeçalhos de segurança base (a CSP completa fica no proxy, com nonce, por causa do Turnstile)
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

// Logótipos das marcas: basta largar <id>.svg / .png / .webp em public/brands.
// A lista é lida no build, por isso o site sabe quais existem sem pedidos que dão 404.
function listBrandLogos(sub = "") {
  try {
    return fs
      .readdirSync(path.join(process.cwd(), "public", "brands", sub))
      .filter((f) => /\.(svg|png|webp)$/i.test(f))
      .map((f) => f.toLowerCase())
      .join(",");
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BRAND_LOGOS: listBrandLogos(), NEXT_PUBLIC_BRAND_MARKS: listBrandLogos("marks") },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
