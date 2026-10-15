import type { Metadata } from "next";

import type { Locale } from "@/lib/i18n/locale";

/**
 * Image de partage d'une langue : ce qu'affichent WhatsApp, LinkedIn,
 * Slack ou iMessage quand on colle un lien vers le site.
 *
 * Les fichiers vivent à adresse fixe dans `public/brand/`, générés par
 * `tools/brand/image-partage.mjs` à partir du logotype officiel.
 * L'adresse est relative : `metadataBase`, posé dans la disposition
 * racine, la rend absolue sur le domaine public.
 */
const SHARE_IMAGE: Record<Locale, { url: string; alt: string }> = {
  fr: {
    url: "/brand/partage-fr.png",
    alt: "IMAFRIK, téléradiologie pour l’Afrique",
  },
  en: {
    url: "/brand/partage-en.png",
    alt: "IMAFRIK, teleradiology for Africa",
  },
};

/**
 * Déclarations Open Graph et X (Twitter) de l'image de partage.
 *
 * Toute page qui définit son propre bloc `openGraph` doit y reprendre
 * `images` : Next remplace le bloc d'un parent au lieu de le fusionner,
 * et une page sans image laisse chaque messagerie choisir seule ce
 * qu'elle montre, puis le garder en cache.
 *
 * @param locale Langue de la page.
 */
export function shareImage(locale: Locale): {
  openGraph: NonNullable<Metadata["openGraph"]>;
  twitter: NonNullable<Metadata["twitter"]>;
} {
  const { url, alt } = SHARE_IMAGE[locale];
  return {
    openGraph: {
      images: [{ url, alt, width: 1200, height: 630, type: "image/png" }],
    },
    twitter: { card: "summary_large_image", images: [{ url, alt }] },
  };
}
