/**
 * Catálogo StreamOut — preços oficiais em USD (mercado dos EUA), verificados em Nov. 2026.
 * O preço em Kz é calculado em src/lib/pricing.ts (taxa BNA + margem configurável).
 *
 * Referências (preço oficial de cada empresa, 2026):
 *  Spotify Premium: Individual $12.99, Duo $18.99, Family $21.99 (fev. 2026)
 *  YouTube Premium: Individual $15.99, anual $159.99, Family $26.99, Lite $8.99 (abr. 2026)
 *  Netflix: Standard c/ anúncios $8.99, Standard $19.99, Premium $26.99 (mar. 2026)
 *  Apple Music: Individual $11.99, Family $19.99 · iCloud+: 50 GB $0.99, 200 GB $2.99, 2 TB $9.99
 *  Amazon Prime: $14.99/mês, $139/ano · ChatGPT Plus: $20/mês
 *  Claude Pro: $20/mês, $200/ano · Crunchyroll: Fan $9.99, Mega Fan $13.99 (anual $99.99 / $139.99)
 *  Adobe Creative Cloud: Standard $599.88/ano, Pro $779.99/ano, Pro mensal $104.99
 *  Microsoft 365: Personal $9.99/mês ou $99.99/ano, Family $129.99/ano
 *  McAfee Total Protection $39.99/ano (1.º ano) · Kaspersky Standard $29.99, Plus $39.99, Premium $49.99
 *  NordVPN Basic: $12.99/mês, $59.88 no plano de 1 ano
 *  Gift cards de lojas: valor facial.
 */

export type L10n = { pt: string; en: string };

export type Category = "music" | "video" | "ai" | "productivity" | "security" | "storage" | "gaming" | "shopping";

export type IconKey =
  | "music"
  | "play"
  | "film"
  | "cloud"
  | "sparkles"
  | "bot"
  | "palette"
  | "briefcase"
  | "shield"
  | "lock"
  | "package"
  | "gamepad"
  | "store"
  | "apple";

export type Plan = { id: string; label: L10n; usd: number; months?: number };

export type Product = {
  id: string;
  kind: "subscription" | "giftcard";
  name: string;
  category: Category;
  tagline: L10n;
  /** Tons para o cartão líquido: [cor viva, cor profunda] */
  tint: [string, string];
  icon: IconKey;
  /** instant = código em stock · on_demand = a equipa compra em até 30 min */
  delivery: "instant" | "on_demand";
  plans: Plan[];
  popular?: boolean;
};

const mo = (n: number): L10n =>
  n === 1 ? { pt: "1 mês", en: "1 month" } : { pt: `${n} meses`, en: `${n} months` };
const lbl = (pt: string, en: string, months?: number): L10n =>
  months ? { pt: `${pt} · ${mo(months).pt}`, en: `${en} · ${mo(months).en}` } : { pt, en };
const usdValue = (v: number): Plan => ({ id: `usd-${v}`, label: { pt: `${v} USD`, en: `USD ${v}` }, usd: v });

export const SUBSCRIPTIONS: Product[] = [
  {
    id: "spotify",
    kind: "subscription",
    name: "Spotify Premium",
    category: "music",
    tagline: { pt: "Música sem anúncios, offline e em alta qualidade.", en: "Ad-free music, offline and in high quality." },
    tint: ["#1ed760", "#0a3b1f"],
    icon: "music",
    delivery: "instant",
    popular: true,
    plans: [
      { id: "ind-1", label: lbl("Individual", "Individual", 1), usd: 12.99, months: 1 },
      { id: "ind-3", label: lbl("Individual", "Individual", 3), usd: 38.97, months: 3 },
      { id: "ind-12", label: lbl("Individual", "Individual", 12), usd: 155.88, months: 12 },
      { id: "duo-1", label: lbl("Duo", "Duo", 1), usd: 18.99, months: 1 },
      { id: "fam-1", label: lbl("Família", "Family", 1), usd: 21.99, months: 1 },
    ],
  },
  {
    id: "netflix",
    kind: "subscription",
    name: "Netflix",
    category: "video",
    tagline: { pt: "Séries, filmes e jogos em qualquer ecrã.", en: "Series, films and games on any screen." },
    tint: ["#e50914", "#2a0306"],
    icon: "film",
    delivery: "instant",
    popular: true,
    plans: [
      { id: "ads", label: lbl("Standard c/ anúncios", "Standard with ads", 1), usd: 8.99, months: 1 },
      { id: "std", label: lbl("Standard", "Standard", 1), usd: 19.99, months: 1 },
      { id: "premium", label: lbl("Premium 4K", "Premium 4K", 1), usd: 26.99, months: 1 },
    ],
  },
  {
    id: "disney-plus",
    kind: "subscription",
    name: "Disney+",
    category: "video",
    tagline: { pt: "Disney, Pixar, Marvel, Star Wars e National Geographic.", en: "Disney, Pixar, Marvel, Star Wars and National Geographic." },
    tint: ["#2a5bff", "#040c3a"],
    icon: "film",
    delivery: "on_demand",
    plans: [
      { id: "ads", label: lbl("Com anúncios", "With ads", 1), usd: 12.49, months: 1 },
      { id: "premium", label: lbl("Premium", "Premium", 1), usd: 21.49, months: 1 },
    ],
  },
  {
    id: "youtube",
    kind: "subscription",
    name: "YouTube Premium",
    category: "video",
    tagline: { pt: "YouTube sem anúncios, em segundo plano e YouTube Music.", en: "Ad-free YouTube, background play and YouTube Music." },
    tint: ["#ff1f3d", "#3a0610"],
    icon: "play",
    delivery: "on_demand",
    popular: true,
    plans: [
      { id: "ind-1", label: lbl("Individual", "Individual", 1), usd: 15.99, months: 1 },
      { id: "ind-12", label: lbl("Individual", "Individual", 12), usd: 159.99, months: 12 },
      { id: "fam-1", label: lbl("Família", "Family", 1), usd: 26.99, months: 1 },
      { id: "lite-1", label: lbl("Lite", "Lite", 1), usd: 8.99, months: 1 },
    ],
  },
  {
    id: "chatgpt",
    kind: "subscription",
    name: "ChatGPT Plus",
    category: "ai",
    tagline: { pt: "Os modelos mais avançados da OpenAI, com limites alargados.", en: "OpenAI's most advanced models with higher limits." },
    tint: ["#19c37d", "#062e26"],
    icon: "sparkles",
    delivery: "on_demand",
    popular: true,
    plans: [
      { id: "plus-1", label: lbl("Plus", "Plus", 1), usd: 20, months: 1 },
      { id: "plus-3", label: lbl("Plus", "Plus", 3), usd: 60, months: 3 },
    ],
  },
  {
    id: "claude",
    kind: "subscription",
    name: "Claude Pro",
    category: "ai",
    tagline: { pt: "Mais uso do Claude, projectos e Claude Code.", en: "More Claude usage, projects and Claude Code." },
    tint: ["#e0855f", "#3a1a10"],
    icon: "bot",
    delivery: "on_demand",
    popular: true,
    plans: [
      { id: "pro-1", label: lbl("Pro", "Pro", 1), usd: 20, months: 1 },
      { id: "pro-12", label: lbl("Pro", "Pro", 12), usd: 200, months: 12 },
    ],
  },
  {
    id: "icloud",
    kind: "subscription",
    name: "iCloud+",
    category: "storage",
    tagline: { pt: "Espaço para fotos, cópias de segurança e Retransmissão privada.", en: "Space for photos, backups and Private Relay." },
    tint: ["#4aa3ff", "#0a2a55"],
    icon: "cloud",
    delivery: "instant",
    popular: true,
    plans: [
      { id: "50-12", label: lbl("50 GB", "50 GB", 12), usd: 11.88, months: 12 },
      { id: "200-1", label: lbl("200 GB", "200 GB", 1), usd: 2.99, months: 1 },
      { id: "200-12", label: lbl("200 GB", "200 GB", 12), usd: 35.88, months: 12 },
      { id: "2tb-1", label: lbl("2 TB", "2 TB", 1), usd: 9.99, months: 1 },
      { id: "2tb-12", label: lbl("2 TB", "2 TB", 12), usd: 119.88, months: 12 },
    ],
  },
  {
    id: "apple-music",
    kind: "subscription",
    name: "Apple Music",
    category: "music",
    tagline: { pt: "Mais de 100 milhões de músicas, áudio espacial e letras.", en: "100M+ songs, spatial audio and lyrics." },
    tint: ["#ff4d6d", "#4a0b1d"],
    icon: "music",
    delivery: "instant",
    popular: true,
    plans: [
      { id: "ind-1", label: lbl("Individual", "Individual", 1), usd: 11.99, months: 1 },
      { id: "ind-12", label: lbl("Individual", "Individual", 12), usd: 143.88, months: 12 },
      { id: "fam-1", label: lbl("Família", "Family", 1), usd: 19.99, months: 1 },
    ],
  },
  {
    id: "amazon-prime",
    kind: "subscription",
    name: "Amazon Prime",
    category: "video",
    tagline: { pt: "Prime Video, Prime Music e vantagens Amazon.", en: "Prime Video, Prime Music and Amazon perks." },
    tint: ["#1ab3e8", "#06283b"],
    icon: "package",
    delivery: "instant",
    popular: true,
    plans: [
      { id: "1", label: lbl("Prime", "Prime", 1), usd: 14.99, months: 1 },
      { id: "12", label: lbl("Prime", "Prime", 12), usd: 139, months: 12 },
    ],
  },
  {
    id: "crunchyroll",
    kind: "subscription",
    name: "Crunchyroll",
    category: "video",
    tagline: { pt: "O maior catálogo de anime, sem anúncios.", en: "The biggest anime catalog, ad-free." },
    tint: ["#ff7a1a", "#3d1804"],
    icon: "play",
    delivery: "on_demand",
    plans: [
      { id: "fan-1", label: lbl("Fan", "Fan", 1), usd: 9.99, months: 1 },
      { id: "mega-1", label: lbl("Mega Fan", "Mega Fan", 1), usd: 13.99, months: 1 },
      { id: "fan-12", label: lbl("Fan", "Fan", 12), usd: 99.99, months: 12 },
      { id: "mega-12", label: lbl("Mega Fan", "Mega Fan", 12), usd: 139.99, months: 12 },
    ],
  },
  {
    id: "adobe-cc",
    kind: "subscription",
    name: "Adobe Creative Cloud",
    category: "productivity",
    tagline: { pt: "Photoshop, Illustrator, Premiere e mais de 20 apps.", en: "Photoshop, Illustrator, Premiere and 20+ apps." },
    tint: ["#ff3b30", "#3a0705"],
    icon: "palette",
    delivery: "on_demand",
    plans: [
      { id: "pro-1", label: lbl("Pro", "Pro", 1), usd: 104.99, months: 1 },
      { id: "std-12", label: lbl("Standard", "Standard", 12), usd: 599.88, months: 12 },
      { id: "pro-12", label: lbl("Pro", "Pro", 12), usd: 779.99, months: 12 },
    ],
  },
  {
    id: "microsoft-365",
    kind: "subscription",
    name: "Microsoft 365",
    category: "productivity",
    tagline: { pt: "Word, Excel, PowerPoint, Outlook e 1 TB no OneDrive.", en: "Word, Excel, PowerPoint, Outlook and 1 TB OneDrive." },
    tint: ["#2b88d8", "#06264a"],
    icon: "briefcase",
    delivery: "instant",
    plans: [
      { id: "personal-1", label: lbl("Personal", "Personal", 1), usd: 9.99, months: 1 },
      { id: "personal-12", label: lbl("Personal", "Personal", 12), usd: 99.99, months: 12 },
      { id: "family-12", label: lbl("Family", "Family", 12), usd: 129.99, months: 12 },
    ],
  },
  {
    id: "mcafee",
    kind: "subscription",
    name: "McAfee Total Protection",
    category: "security",
    tagline: { pt: "Antivírus, VPN segura e gestor de palavras-passe.", en: "Antivirus, secure VPN and password manager." },
    tint: ["#d42a2a", "#3a0808"],
    icon: "shield",
    delivery: "instant",
    plans: [{ id: "1d-12", label: lbl("1 dispositivo", "1 device", 12), usd: 39.99, months: 12 }],
  },
  {
    id: "kaspersky",
    kind: "subscription",
    name: "Kaspersky",
    category: "security",
    tagline: { pt: "Protecção em tempo real para PC, Mac e telemóvel.", en: "Real-time protection for PC, Mac and phone." },
    tint: ["#16b39a", "#04362f"],
    icon: "shield",
    delivery: "instant",
    plans: [
      { id: "std-12", label: lbl("Standard", "Standard", 12), usd: 29.99, months: 12 },
      { id: "plus-12", label: lbl("Plus", "Plus", 12), usd: 39.99, months: 12 },
      { id: "premium-12", label: lbl("Premium", "Premium", 12), usd: 49.99, months: 12 },
    ],
  },
  {
    id: "nordvpn",
    kind: "subscription",
    name: "NordVPN",
    category: "security",
    tagline: { pt: "VPN rápida e privada em até 10 dispositivos.", en: "Fast, private VPN on up to 10 devices." },
    tint: ["#5b8cff", "#0c1d4a"],
    icon: "lock",
    delivery: "instant",
    plans: [
      { id: "basic-1", label: lbl("Basic", "Basic", 1), usd: 12.99, months: 1 },
      { id: "basic-12", label: lbl("Basic", "Basic", 12), usd: 59.88, months: 12 },
    ],
  },
];

export const GIFT_CARDS: Product[] = [
  {
    id: "apple-gift",
    kind: "giftcard",
    name: "Apple Gift Card",
    category: "shopping",
    tagline: { pt: "App Store, iCloud, Apple Music e mais.", en: "App Store, iCloud, Apple Music and more." },
    tint: ["#c8ccd4", "#1c1d22"],
    icon: "apple",
    delivery: "instant",
    plans: [10, 25, 50, 100].map(usdValue),
  },
  {
    id: "google-play",
    kind: "giftcard",
    name: "Google Play",
    category: "shopping",
    tagline: { pt: "Apps, jogos, livros e subscrições Android.", en: "Android apps, games, books and subscriptions." },
    tint: ["#34c26a", "#08321a"],
    icon: "store",
    delivery: "instant",
    plans: [10, 25, 50, 100].map(usdValue),
  },
  {
    id: "playstation",
    kind: "giftcard",
    name: "PlayStation Store",
    category: "gaming",
    tagline: { pt: "Jogos, extras e PlayStation Plus.", en: "Games, add-ons and PlayStation Plus." },
    tint: ["#1f7ae0", "#061f40"],
    icon: "gamepad",
    delivery: "instant",
    plans: [10, 25, 50, 100].map(usdValue),
  },
  {
    id: "xbox",
    kind: "giftcard",
    name: "Xbox",
    category: "gaming",
    tagline: { pt: "Jogos, Game Pass e conteúdos Xbox.", en: "Games, Game Pass and Xbox content." },
    tint: ["#20a020", "#062c06"],
    icon: "gamepad",
    delivery: "instant",
    plans: [10, 25, 50, 100].map(usdValue),
  },
  {
    id: "steam",
    kind: "giftcard",
    name: "Steam",
    category: "gaming",
    tagline: { pt: "Saldo para milhares de jogos de PC.", en: "Wallet credit for thousands of PC games." },
    tint: ["#66c0f4", "#0f1a26"],
    icon: "gamepad",
    delivery: "instant",
    plans: [20, 50, 100].map(usdValue),
  },
  {
    id: "amazon-gift",
    kind: "giftcard",
    name: "Amazon.com",
    category: "shopping",
    tagline: { pt: "Saldo para compras na Amazon.com.", en: "Credit for shopping on Amazon.com." },
    tint: ["#ffa41c", "#3a2302"],
    icon: "package",
    delivery: "instant",
    plans: [10, 25, 50, 100].map(usdValue),
  },
];

export const ALL_PRODUCTS = [...SUBSCRIPTIONS, ...GIFT_CARDS];

export function findProduct(id: string) {
  return ALL_PRODUCTS.find((p) => p.id === id);
}

export function findPlan(productId: string, planId: string) {
  return findProduct(productId)?.plans.find((p) => p.id === planId);
}

/** "Individual · 1 mês" → { tier: "Individual", duration: "1 mês" }; gift cards não têm duração */
export function planParts(plan: Plan, locale: "pt" | "en") {
  const [tier, duration] = plan.label[locale].split(" · ");
  return { tier, duration: duration ?? null };
}

/** Resumo das durações de um produto: "1 mês", "12 meses", "1–12 meses" */
export function durationSummary(product: Product, locale: "pt" | "en") {
  const months = product.plans.map((p) => p.months).filter((m): m is number => !!m);
  if (months.length === 0) return null;
  const min = Math.min(...months);
  const max = Math.max(...months);
  if (min === max) return mo(min)[locale];
  return locale === "pt" ? `${min}–${max} meses` : `${min}–${max} months`;
}

export const CATEGORY_LABEL: Record<Category | "all", L10n> = {
  all: { pt: "Tudo", en: "All" },
  music: { pt: "Música", en: "Music" },
  video: { pt: "Vídeo", en: "Video" },
  ai: { pt: "Inteligência artificial", en: "AI" },
  productivity: { pt: "Produtividade", en: "Productivity" },
  security: { pt: "Segurança & VPN", en: "Security & VPN" },
  storage: { pt: "Armazenamento", en: "Storage" },
  gaming: { pt: "Jogos", en: "Gaming" },
  shopping: { pt: "Lojas", en: "Stores" },
};

/* ------------------------------------------------------------------ */
/* Bundle StreamOut — mix de assinaturas, em períodos de 3, 6 e 12 meses */
/* ------------------------------------------------------------------ */

export type Bundle = {
  id: "essencial" | "plus" | "ultra";
  name: L10n;
  pitch: L10n;
  items: { product: string; plan: string }[];
  /** desconto nas compras avulsas enquanto o bundle estiver activo */
  perk: number;
  popular?: boolean;
};

export const BUNDLES: Bundle[] = [
  {
    id: "essencial",
    name: { pt: "Essencial", en: "Essential" },
    pitch: { pt: "Música, séries e as tuas fotos seguras.", en: "Music, shows and your photos backed up." },
    items: [
      { product: "spotify", plan: "ind-1" },
      { product: "netflix", plan: "ads" },
      { product: "icloud", plan: "200-1" },
    ],
    perk: 5,
  },
  {
    id: "plus",
    name: { pt: "Plus", en: "Plus" },
    pitch: { pt: "Entretenimento completo com IA incluída.", en: "Full entertainment with AI included." },
    items: [
      { product: "spotify", plan: "ind-1" },
      { product: "netflix", plan: "std" },
      { product: "chatgpt", plan: "plus-1" },
      { product: "icloud", plan: "200-1" },
    ],
    perk: 10,
    popular: true,
  },
  {
    id: "ultra",
    name: { pt: "Ultra", en: "Ultra" },
    pitch: { pt: "Tudo em máxima qualidade, para quem cria e trabalha.", en: "Everything at max quality, for creators and pros." },
    items: [
      { product: "netflix", plan: "premium" },
      { product: "youtube", plan: "ind-1" },
      { product: "spotify", plan: "ind-1" },
      { product: "claude", plan: "pro-1" },
      { product: "icloud", plan: "2tb-1" },
      { product: "microsoft-365", plan: "personal-1" },
    ],
    perk: 15,
  },
];
