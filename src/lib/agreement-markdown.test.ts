import { describe, expect, it } from "vitest";

import { parseAgreementMarkdown, parseInlines } from "@/lib/agreement-markdown";

describe("mise en valeur", () => {
  it("lit le gras et l'italique", () => {
    expect(
      parseInlines("Le **radiologue** signe *seul* son _compte rendu_."),
    ).toEqual([
      { text: "Le " },
      { text: "radiologue", strong: true },
      { text: " signe " },
      { text: "seul", em: true },
      { text: " son " },
      { text: "compte rendu", em: true },
      { text: "." },
    ]);
  });

  it("laisse en clair une marque isolée ou un souligné dans un mot", () => {
    expect(parseInlines("12 500 FCFA* HT")).toEqual([
      { text: "12 500 FCFA* HT" },
    ]);
    expect(parseInlines("radiologist_agreement")).toEqual([
      { text: "radiologist_agreement" },
    ]);
  });

  it("ne produit jamais de balise : le HTML reste du texte", () => {
    const blocks = parseAgreementMarkdown(
      '<script>alert(1)</script>\n\n<a href="javascript:x">lien</a>',
    );
    expect(blocks).toEqual([
      {
        type: "paragraph",
        inlines: [{ text: "<script>alert(1)</script>" }],
      },
      {
        type: "paragraph",
        inlines: [{ text: '<a href="javascript:x">lien</a>' }],
      },
    ]);
  });
});

describe("découpage en blocs", () => {
  it("ignore l'en-tête de métadonnées", () => {
    const blocks = parseAgreementMarkdown(
      '---\nkind: radiologist_agreement\nversion: "1.0"\n---\n# Contrat\n',
    );
    expect(blocks).toEqual([
      { type: "heading", level: 1, inlines: [{ text: "Contrat" }] },
    ]);
  });

  it("lit titres, paragraphes et listes", () => {
    const blocks = parseAgreementMarkdown(
      [
        "# Contrat d'exercice",
        "",
        "## Article 1 : Objet",
        "",
        "1.1 Le présent contrat",
        "définit les conditions.",
        "",
        "- le secret médical ;",
        "- les délais,",
        "  selon l'urgence.",
        "",
        "1. premier",
        "2. second",
      ].join("\n"),
    );
    expect(blocks).toEqual([
      { type: "heading", level: 1, inlines: [{ text: "Contrat d'exercice" }] },
      { type: "heading", level: 2, inlines: [{ text: "Article 1 : Objet" }] },
      {
        type: "paragraph",
        inlines: [{ text: "1.1 Le présent contrat définit les conditions." }],
      },
      {
        type: "list",
        ordered: false,
        items: [
          [{ text: "le secret médical ;" }],
          [{ text: "les délais, selon l'urgence." }],
        ],
      },
      {
        type: "list",
        ordered: true,
        items: [[{ text: "premier" }], [{ text: "second" }]],
      },
    ]);
  });

  it("lit un tableau tarifaire", () => {
    const blocks = parseAgreementMarkdown(
      [
        "| Examen | Normal | Urgent |",
        "| :--- | ---: | ---: |",
        "| Scanner | 2 500 | 3 000 |",
        "| **IRM** | 4 000 | 5 000 |",
      ].join("\n"),
    );
    expect(blocks).toEqual([
      {
        type: "table",
        header: [
          [{ text: "Examen" }],
          [{ text: "Normal" }],
          [{ text: "Urgent" }],
        ],
        rows: [
          [[{ text: "Scanner" }], [{ text: "2 500" }], [{ text: "3 000" }]],
          [
            [{ text: "IRM", strong: true }],
            [{ text: "4 000" }],
            [{ text: "5 000" }],
          ],
        ],
      },
    ]);
  });

  it("traite une ligne à barres sans séparation comme un paragraphe", () => {
    expect(parseAgreementMarkdown("| pas un tableau |")).toEqual([
      { type: "paragraph", inlines: [{ text: "| pas un tableau |" }] },
    ]);
  });

  it("normalise les fins de ligne Windows", () => {
    expect(parseAgreementMarkdown("# Titre\r\n\r\nTexte\r\n")).toEqual([
      { type: "heading", level: 1, inlines: [{ text: "Titre" }] },
      { type: "paragraph", inlines: [{ text: "Texte" }] },
    ]);
  });
});
