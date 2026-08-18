import type { MetadataRoute } from "next";

import { isApiConfigured } from "@/lib/api/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Plan du site.
 *
 * Il ne liste que les pages publiques — six adresses. Tout le reste est
 * derrière authentification et n'a pas à figurer dans un fichier destiné
 * aux moteurs.
 *
 * Vide tant que le service n'est pas configuré, pour la même raison que
 * `robots.ts` : un aperçu ne doit pas s'annoncer.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const live = isSupabaseConfigured() && isApiConfigured();

  if (!base || !live) return [];

  const pages = [
    { path: "/", priority: 1 },
    { path: "/securite", priority: 0.8 },
    { path: "/contact", priority: 0.8 },
    { path: "/mentions-legales", priority: 0.2 },
    { path: "/confidentialite", priority: 0.3 },
    { path: "/cgu", priority: 0.2 },
  ];

  return pages.map((page) => ({
    url: `${base}${page.path}`,
    priority: page.priority,
    changeFrequency: "monthly" as const,
  }));
}
