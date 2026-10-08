import type { MetadataRoute } from "next";

import { isApiConfigured } from "@/lib/api/config";
import { LOCALES } from "@/lib/i18n/locale";
import { INDEXABLE_PAGES, localizePath } from "@/lib/i18n/routes";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Plan du site.
 *
 * Il ne liste que les pages publiques, dans chaque langue, chacune avec
 * ses équivalents (`hreflang`). Tout le reste est derrière authentification
 * et n'a pas à figurer dans un fichier destiné aux moteurs.
 *
 * Vide tant que le service n'est pas configuré, pour la même raison que
 * `robots.ts` : un aperçu ne doit pas s'annoncer.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const live = isSupabaseConfigured() && isApiConfigured();

  if (!base || !live) return [];

  return INDEXABLE_PAGES.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: `${base}${localizePath(page.path, locale)}`,
      priority: page.priority,
      changeFrequency: "monthly" as const,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((other) => [
            other,
            `${base}${localizePath(page.path, other)}`,
          ]),
        ),
      },
    })),
  );
}
