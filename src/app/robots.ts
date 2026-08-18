import type { MetadataRoute } from "next";

import { isApiConfigured } from "@/lib/api/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Consignes d'indexation.
 *
 * **Rien n'est indexable tant que le service n'est pas réellement
 * configuré.** Un déploiement d'aperçu tourne sur le jeu de
 * démonstration : laisser un moteur le parcourir ferait apparaître dans
 * les résultats de recherche des pages légales encore à l'état de
 * projet, des engagements de délai non confirmés, et une file de travail
 * peuplée de patients inventés — le tout sous le nom de l'éditeur.
 *
 * Une fois configuré, seules la vitrine et les pages légales sont
 * ouvertes : tout le reste manipule des données de santé, et
 * l'exploration n'y a rien à faire même derrière authentification.
 */
export default function robots(): MetadataRoute.Robots {
  const live = isSupabaseConfigured() && isApiConfigured();

  if (!live) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/securite",
        "/contact",
        "/mentions-legales",
        "/confidentialite",
        "/cgu",
      ],
      disallow: "/",
    },
    sitemap: process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`
      : undefined,
  };
}
