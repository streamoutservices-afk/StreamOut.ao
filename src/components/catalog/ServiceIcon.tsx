import {
  Bot,
  Briefcase,
  Clapperboard,
  Cloud,
  Gamepad2,
  Gift,
  Lock,
  Music,
  Package,
  Palette,
  PlayCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "@/data/catalog";

/*
 * Ícones genéricos por categoria. Os logótipos oficiais de cada marca não são desenhados aqui:
 * para os usar, colocar os ficheiros autorizados (kit de imprensa/parceiro) em public/brands/<id>.svg
 * e trocar este componente por um <img>.
 */
const ICONS: Record<IconKey, LucideIcon> = {
  music: Music,
  play: PlayCircle,
  film: Clapperboard,
  cloud: Cloud,
  sparkles: Sparkles,
  bot: Bot,
  palette: Palette,
  briefcase: Briefcase,
  shield: ShieldCheck,
  lock: Lock,
  package: Package,
  gamepad: Gamepad2,
  store: ShoppingBag,
  apple: Gift,
};

export function ServiceIcon({ icon, className }: { icon: IconKey; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon aria-hidden className={className} />;
}
