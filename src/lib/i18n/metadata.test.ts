import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { LOCALES } from "@/lib/i18n/locale";
import { publicPageMetadata } from "@/lib/i18n/metadata";
import { shareImage } from "@/lib/i18n/share-image";

/** Adresse de la première image Open Graph déclarée. */
function ogImageUrl(metadata: ReturnType<typeof publicPageMetadata>): string {
  const images = metadata.openGraph?.images;
  const first = Array.isArray(images) ? images[0] : images;
  return typeof first === "object" && first !== null && "url" in first
    ? String(first.url)
    : String(first);
}

describe("image de partage", () => {
  it.each(LOCALES)("existe dans public/ pour la langue %s", (locale) => {
    const url = ogImageUrl({ openGraph: shareImage(locale).openGraph });
    expect(existsSync(join(process.cwd(), "public", url))).toBe(true);
  });

  it("suit la langue de la page", () => {
    expect(shareImage("fr").openGraph).not.toEqual(shareImage("en").openGraph);
  });

  // Next remplace le bloc Open Graph d'un parent au lieu de le fusionner :
  // une page publique qui oublierait l'image n'en aurait aucune.
  it.each(LOCALES)(
    "accompagne chaque page publique (%s), en grand format",
    (locale) => {
      const metadata = publicPageMetadata(locale, "/contact", {
        title: "Contact",
        description: "Nous écrire",
      });
      expect(ogImageUrl(metadata)).toBe(
        ogImageUrl({ openGraph: shareImage(locale).openGraph }),
      );
      expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    },
  );
});
