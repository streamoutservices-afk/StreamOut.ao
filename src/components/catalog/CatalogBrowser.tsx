"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { CATEGORY_LABEL, type Category, type Product } from "@/data/catalog";
import { cn } from "@/lib/utils/cn";
import { ProductCard } from "./ProductCard";

export function CatalogBrowser({ products, withFilters = true }: { products: Product[]; withFilters?: boolean }) {
  const locale = useLocale() as "pt" | "en";
  const t = useTranslations("Catalog");
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)] as (Category | "all")[];
  }, [products]);

  const visible = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (query.trim() === "" || p.name.toLowerCase().includes(query.trim().toLowerCase())),
  );

  return (
    <div>
      {withFilters && (
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 md:flex-row md:items-center md:justify-between">
          <div role="tablist" aria-label={t("filterLabel")} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
            {categories.map((c) => (
              <button
                key={c}
                role="tab"
                type="button"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200",
                  category === c
                    ? "border-transparent bg-ink-900 text-white dark:bg-white dark:text-ink-900"
                    : "border-black/[0.07] bg-white/50 text-ink-800/75 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08]",
                )}
              >
                {CATEGORY_LABEL[c][locale]}
              </button>
            ))}
          </div>
          <label className="relative block md:w-64">
            <span className="sr-only">{t("search")}</span>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 opacity-45" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="h-10 w-full rounded-full border border-black/[0.07] bg-white/60 pl-10 pr-4 text-[14px] backdrop-blur-md placeholder:text-ink-800/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-royal/60 dark:border-white/10 dark:bg-white/[0.05] dark:placeholder:text-white/40"
            />
          </label>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-16 text-center text-ink-800/60 dark:text-white/50">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
