import { describe, expect, it } from "vitest";

import {
  editorSection,
  reviewSignature,
  stillPresent,
} from "@/components/editor/ai-review";
import { reviewReport } from "@/components/editor/review";
import {
  EMPTY_REPORT_SECTIONS,
  isReportBlank,
  missingRequiredSections,
  type ReportSections,
  sectionsForLayout,
  sectionsOf,
  toFreeLayout,
  toStructuredLayout,
} from "@/components/editor/sections";
import { messagesFor } from "@/i18n";
import { isSectionsPayload } from "@/lib/editor/payload";

/**
 * Feuille blanche et découpe proposée : passer de l'une à l'autre ne perd
 * jamais de texte, et chaque règle (sections obligatoires, relectures,
 * envoi au service) lit la mise en page du compte-rendu.
 */

const titles = messagesFor("fr").reading.sections.titles;

const decoupe = (sections: Partial<ReportSections>): ReportSections => ({
  ...EMPTY_REPORT_SECTIONS,
  ...sections,
});

describe("mises en page", () => {
  it("donne les sections de chaque mise en page, dans l'ordre du document", () => {
    expect(sectionsOf("structured").map((s) => s.key)).toEqual([
      "indication",
      "technique",
      "comparatif",
      "resultats",
      "conclusion",
    ]);
    expect(sectionsOf("free").map((s) => s.key)).toEqual([
      "corps",
      "conclusion",
    ]);
  });

  it("exige le texte libre et la conclusion d'une feuille blanche", () => {
    const vide = decoupe({});
    expect(missingRequiredSections(vide, "free")).toEqual([
      "corps",
      "conclusion",
    ]);
    expect(
      missingRequiredSections(
        decoupe({ corps: "<p>Texte</p>", conclusion: "<p></p>" }),
        "free",
      ),
    ).toEqual(["conclusion"]);
    // Par défaut, la découpe proposée : rien ne change pour l'existant.
    expect(missingRequiredSections(vide)).toEqual([
      "indication",
      "resultats",
      "conclusion",
    ]);
  });

  it("n'envoie au service que les sections de la mise en page", () => {
    const texte = decoupe({
      corps: "<p>Libre</p>",
      resultats: "<p>Reste</p>",
      conclusion: "<p>C</p>",
    });
    expect(sectionsForLayout(texte, "free")).toEqual({
      corps: "<p>Libre</p>",
      conclusion: "<p>C</p>",
    });
    expect(Object.keys(sectionsForLayout(texte, "structured"))).not.toContain(
      "corps",
    );
  });

  it("refuse un envoi qui mélange les mises en page", () => {
    expect(isSectionsPayload({ corps: "a", conclusion: "b" }, "free")).toBe(
      true,
    );
    expect(isSectionsPayload({ corps: "a", resultats: "b" }, "free")).toBe(
      false,
    );
    // Un exercice de formation, toujours en découpe, n'a pas de texte libre.
    expect(isSectionsPayload({ corps: "a" })).toBe(false);
  });
});

describe("passer d'une mise en page à l'autre", () => {
  const rubriques = decoupe({
    indication: "<p>Céphalées</p>",
    technique: "<p>T1 & T2</p>",
    resultats: "<p>Pas d’anomalie.</p>",
    conclusion: "<p>IRM normale.</p>",
  });

  it("réunit les rubriques dans la feuille blanche, sous leurs intitulés", () => {
    const libre = toFreeLayout(rubriques, titles);
    expect(libre.corps).toBe(
      "<h3>Indication clinique</h3><p>Céphalées</p>" +
        "<h3>Technique</h3><p>T1 & T2</p>" +
        "<h3>Résultats</h3><p>Pas d’anomalie.</p>",
    );
    // Pas d'intitulé orphelin pour une rubrique vide ; la conclusion reste
    // la conclusion ; les rubriques sont vidées.
    expect(libre.corps).not.toContain("Comparatif");
    expect(libre.conclusion).toBe("<p>IRM normale.</p>");
    expect(isReportBlank(libre, "structured")).toBe(false);
    expect(libre.resultats).toBe("");
  });

  it("écrit les intitulés dans la langue du compte-rendu, échappés", () => {
    const anglais = toFreeLayout(
      decoupe({ resultats: "<p>Normal.</p>" }),
      messagesFor("en").reading.sections.titles,
    );
    expect(anglais.corps).toBe("<h3>Findings</h3><p>Normal.</p>");
    const piege = toFreeLayout(decoupe({ resultats: "<p>x</p>" }), {
      ...titles,
      resultats: "<b>R</b>",
    });
    expect(piege.corps).toContain("<h3>&lt;b&gt;R&lt;/b&gt;</h3>");
  });

  it("place le texte libre, entier, dans les résultats", () => {
    const libre = decoupe({
      corps: "<h3>Utérus</h3><p>Normal.</p>",
      conclusion: "<p>RAS.</p>",
    });
    const retour = toStructuredLayout(libre);
    expect(retour.resultats).toBe("<h3>Utérus</h3><p>Normal.</p>");
    expect(retour.conclusion).toBe("<p>RAS.</p>");
    expect(retour.corps).toBe("");
  });

  it("ne perd aucun mot à l'aller et au retour", () => {
    const mots = (sections: ReportSections) =>
      Object.values(sections)
        .join(" ")
        .replace(/<h3>[^<]*<\/h3>/g, " ")
        .replace(/<[^>]*>/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .sort();
    const retour = toStructuredLayout(toFreeLayout(rubriques, titles));
    expect(mots(retour)).toEqual(mots(rubriques));
  });
});

describe("relectures d'une feuille blanche", () => {
  it("confronte la conclusion au texte libre", () => {
    const findings = reviewReport(
      decoupe({
        corps: "<p>Fracture du radius gauche.</p>",
        conclusion: "<p>Fracture du radius droit.</p>",
      }),
      "free",
    );
    expect(findings[0]).toMatchObject({
      kind: "laterality",
      section: "conclusion",
    });
  });

  it("relève restes de modèle et mesures sans unité dans le texte libre", () => {
    const kinds = reviewReport(
      decoupe({
        corps: "<p>Utérus de [taille] mm, nodule mesurant 12.</p>",
        conclusion: "<p>RAS.</p>",
      }),
      "free",
    ).map((finding) => [finding.kind, finding.section]);
    expect(kinds).toEqual([
      ["placeholder", "corps"],
      ["unit", "corps"],
    ]);
  });

  it("retrouve dans le texte libre ce que l'IA cite des résultats", () => {
    const libre = decoupe({
      corps: "<p>Épanchement pleural droit.</p>",
      conclusion: "<p>Examen normal.</p>",
    });
    expect(editorSection("resultats", "free")).toBe("corps");
    expect(editorSection("clinical_info", "free")).toBe("corps");
    expect(editorSection("conclusion", "free")).toBe("conclusion");
    expect(
      stillPresent(
        { section: "resultats", quote: "Épanchement pleural droit." },
        libre,
        "free",
      ),
    ).toBe(true);
  });

  it("tient une relecture pour périmée quand la mise en page change", () => {
    const rubriques = decoupe({ resultats: "<p>Normal.</p>" });
    expect(reviewSignature(rubriques, "structured")).not.toBe(
      reviewSignature(toFreeLayout(rubriques, titles), "free"),
    );
  });
});
