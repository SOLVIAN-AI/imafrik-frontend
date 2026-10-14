/**
 * Origine publique du site, sans barre finale : `https://imafrik.tech`.
 *
 * Base de toutes les adresses absolues destinées à l'extérieur : images
 * de partage, adresses canoniques, données structurées. Le domaine
 * public sert de repli : l'adresse du site n'est pas définie en
 * développement, et une adresse d'aperçu `*.vercel.app` ne doit jamais
 * finir dans le cache d'un moteur ou d'une messagerie.
 */
export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://imafrik.tech").replace(
    /\/+$/,
    "",
  );
}
