import { describe, expect, it } from "vitest";

import {
  editorSection,
  reviewSignature,
  stillPresent,
} from "@/components/editor/ai-review";
import { EMPTY_REPORT_SECTIONS } from "@/components/editor/sections";

const sections = {
  ...EMPTY_REPORT_SECTIONS,
  resultats: "<p>Épanchement pleural droit de faible abondance.</p>",
  conclusion: "<p>Pas d’épanchement&nbsp;pleural.</p>",
};

describe("reviewSignature", () => {
  it("ne change pas quand seule la mise en forme change", () => {
    const bold = {
      ...sections,
      resultats:
        "<p>Épanchement <strong>pleural droit</strong>\n de faible abondance.</p>",
    };
    expect(reviewSignature(bold)).toBe(reviewSignature(sections));
  });

  it("change dès qu’un mot change, dans n’importe quelle section", () => {
    const edited = { ...sections, conclusion: "<p>Épanchement pleural.</p>" };
    expect(reviewSignature(edited)).not.toBe(reviewSignature(sections));
  });

  it("distingue un même texte placé dans deux sections différentes", () => {
    const a = { ...EMPTY_REPORT_SECTIONS, resultats: "<p>Normal.</p>" };
    const b = { ...EMPTY_REPORT_SECTIONS, conclusion: "<p>Normal.</p>" };
    expect(reviewSignature(a)).not.toBe(reviewSignature(b));
  });
});

describe("stillPresent", () => {
  it("retrouve un passage malgré les espaces et les entités", () => {
    expect(
      stillPresent(
        { section: "conclusion", quote: "Pas d’épanchement pleural." },
        sections,
      ),
    ).toBe(true);
  });

  it("tient un passage disparu pour corrigé", () => {
    const fixed = {
      ...sections,
      conclusion: "<p>Épanchement pleural droit.</p>",
    };
    expect(
      stillPresent(
        { section: "conclusion", quote: "Pas d’épanchement pleural." },
        fixed,
      ),
    ).toBe(false);
  });

  it("ne cherche pas dans une autre section", () => {
    expect(
      stillPresent(
        { section: "resultats", quote: "Pas d’épanchement pleural." },
        sections,
      ),
    ).toBe(false);
  });

  it("garde toujours une citation du renseignement clinique", () => {
    expect(
      stillPresent(
        { section: "clinical_info", quote: "Épanchement ?" },
        sections,
      ),
    ).toBe(true);
  });
});

describe("editorSection", () => {
  it("mène à l’indication pour le renseignement clinique", () => {
    expect(editorSection("clinical_info")).toBe("indication");
    expect(editorSection("conclusion")).toBe("conclusion");
  });
});
