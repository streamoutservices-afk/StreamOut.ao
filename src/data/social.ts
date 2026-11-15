// Redes sociais da StreamOut. url: null = ainda sem link (aparece como "em breve").
export type SocialId = "instagram" | "tiktok" | "facebook" | "x" | "youtube" | "linkedin" | "whatsapp";

export const SOCIAL: { id: SocialId; name: string; url: string | null }[] = [
  { id: "instagram", name: "Instagram", url: "https://www.instagram.com/streamout.services" },
  { id: "tiktok", name: "TikTok", url: null },
  { id: "facebook", name: "Facebook", url: null },
  { id: "x", name: "X", url: null },
  { id: "youtube", name: "YouTube", url: null },
  { id: "linkedin", name: "LinkedIn", url: null },
  { id: "whatsapp", name: "WhatsApp", url: null },
];
