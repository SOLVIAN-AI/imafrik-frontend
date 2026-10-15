import { serializeJsonLd } from "@/lib/seo/structured-data";

/**
 * Données structurées JSON-LD d'une page.
 *
 * Bloc de données, jamais exécuté par le navigateur : la politique de
 * sécurité du contenu, qui ne vise que les scripts exécutables, ne s'y
 * applique pas.
 */
export function StructuredData({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
