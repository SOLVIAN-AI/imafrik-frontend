import type { Locale } from "@/lib/i18n/locale";
import { localizePath } from "@/lib/i18n/routes";
import { siteOrigin } from "@/lib/seo/site";

/** Nom de la langue, tel que schema.org l'attend dans `availableLanguage`. */
const LANGUAGE_NAMES = ["French", "English"] as const;

/**
 * Données structurées de l'accueil (schema.org, JSON-LD).
 *
 * Elles disent aux moteurs ce que le texte de la page laisse deviner :
 * le site s'appelle IMAFRIK, voici son logo, voici l'organisation qui
 * l'édite et comment la joindre. C'est sur elles que Google s'appuie
 * pour afficher le nom et le logo du site dans ses résultats ; les liens
 * de site (« Connexion », « Contact »…) restent, eux, à sa discrétion.
 *
 * Deux entités reliées par leur identifiant (`@id`) : le site, publié
 * par l'organisation. Rien n'y est affirmé qui ne figure aussi sur le
 * site lui-même.
 *
 * @param locale      Langue de la page d'accueil.
 * @param description Description de l'accueil, dans cette langue.
 */
export function homeStructuredData(locale: Locale, description: string) {
  const origin = siteOrigin();
  const organization = `${origin}/#organisation`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${origin}/#site`,
        name: "IMAFRIK",
        url: `${origin}/`,
        inLanguage: locale,
        publisher: { "@id": organization },
      },
      {
        "@type": "Organization",
        "@id": organization,
        name: "IMAFRIK",
        url: `${origin}/`,
        description,
        logo: {
          "@type": "ImageObject",
          url: `${origin}/brand/icon-512.png`,
          width: 512,
          height: 512,
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          url: `${origin}${localizePath("/contact", locale)}`,
          availableLanguage: [...LANGUAGE_NAMES],
        },
      },
    ],
  };
}

/**
 * Sérialise des données structurées pour une balise `<script>`.
 *
 * `JSON.stringify` laisse passer `<` : une chaîne contenant
 * `</script>` fermerait la balise et ouvrirait la porte à une injection.
 * Le caractère est donc échappé, comme le recommande Next.js.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
