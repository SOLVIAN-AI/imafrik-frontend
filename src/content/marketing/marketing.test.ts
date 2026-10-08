import { describe, expect, it } from "vitest";

import { fill, marketingCopy } from "@/content/marketing";
import { LOCALES } from "@/lib/i18n/locale";

/** Toutes les chaînes d'un objet, avec leur chemin. */
function strings(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value))
    return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([key, item]) =>
      strings(item, path ? `${path}.${key}` : key),
    );
  return [];
}

describe("textes du site public", () => {
  const fr = marketingCopy("fr");

  it.each(LOCALES)(
    "%s : les listes associées à des icônes ont la longueur attendue",
    (locale) => {
      const t = marketingCopy(locale);
      // Les icônes sont associées par position : une étape de trop ou de
      // moins décalerait toutes les suivantes.
      expect(t.howItWorks.steps).toHaveLength(3);
      expect(t.securityTeaser.guarantees).toHaveLength(4);
      expect(t.securityPage.chapters).toHaveLength(8);
      expect(t.appPreview.exams).toHaveLength(5);
      expect(t.hero.commitments).toHaveLength(fr.hero.commitments.length);
      expect(t.contactPage.volumes).toHaveLength(fr.contactPage.volumes.length);
      expect(t.contactPage.modalityOptions).toHaveLength(
        fr.contactPage.modalityOptions.length,
      );
    },
  );

  it.each(LOCALES)("%s : aucun texte vide", (locale) => {
    const empty = strings(marketingCopy(locale))
      .filter(([, text]) => text.trim() === "")
      // La version française n'a pas d'avertissement de traduction.
      .filter(
        ([path]) => !(locale === "fr" && path === "legal.translationNotice"),
      )
      .map(([path]) => path);
    expect(empty).toEqual([]);
  });

  it("les deux langues emploient les mêmes variables", () => {
    const variables = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    const en = new Map(strings(marketingCopy("en")));
    for (const [path, text] of strings(fr)) {
      if (!en.has(path)) continue;
      expect(variables(en.get(path)!), path).toEqual(variables(text));
    }
  });

  it("remplace les variables et laisse visibles celles qui manquent", () => {
    expect(fill("Merci {name}.", { name: "Ama" })).toBe("Merci Ama.");
    expect(fill("{count} addenda", { count: 2 })).toBe("2 addenda");
    expect(fill("Code : {code}", {})).toBe("Code : {code}");
  });
});
