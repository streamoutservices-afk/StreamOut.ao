import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Usar SEMPRE estes Link/router em vez dos do next/ — preservam o idioma activo
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
