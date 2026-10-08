import { describe, expect, it } from "vitest";

import {
  EMPTY_REPORT_SECTIONS,
  type ReportSections,
} from "@/components/editor/sections";
import {
  describeFinding,
  plainText,
  reviewReport,
  sidesIn,
} from "@/components/editor/review";
import { messagesFor } from "@/i18n";

const report = (sections: Partial<ReportSections>): ReportSections => ({
  ...EMPTY_REPORT_SECTIONS,
  ...sections,
});

const kinds = (sections: Partial<ReportSections>) =>
  reviewReport(report(sections)).map((finding) => [
    finding.kind,
    finding.section,
  ]);

describe("sidesIn", () => {
  it("reconnaît les formes accordées et le bilatéral", () => {
    expect([...sidesIn("Genou DROIT")]).toEqual(["droit"]);
    expect([...sidesIn("hanches gauches")]).toEqual(["gauche"]);
    expect(sidesIn("atteinte bilatérale").size).toBe(2);
    expect(sidesIn("à l'endroit de la lésion").size).toBe(0);
  });
});

describe("reviewReport — latéralité", () => {
  it("signale un côté demandé et l'autre décrit", () => {
    expect(
      kinds({
        indication: "<p>Douleur du genou droit.</p>",
        resultats: "<p>Épanchement du genou gauche.</p>",
      }),
    ).toEqual([["laterality", "resultats"]]);
  });

  it("signale une conclusion sur un côté jamais décrit", () => {
    expect(
      kinds({
        indication: "<p>Traumatisme de la cheville droite.</p>",
        resultats: "<p>Fracture de la malléole latérale droite.</p>",
        conclusion: "<p>Fracture de la malléole gauche.</p>",
      }),
    ).toEqual([["laterality", "conclusion"]]);
  });

  it("se tait quand tout concorde ou que l'examen est bilatéral", () => {
    expect(
      kinds({
        indication: "<p>Genou droit douloureux.</p>",
        resultats: "<p>Genou droit : ménisque interne fissuré.</p>",
        conclusion: "<p>Fissure méniscale interne droite.</p>",
      }),
    ).toEqual([]);
    expect(
      kinds({
        indication: "<p>Douleur bilatérale.</p>",
        resultats: "<p>Coxarthrose gauche.</p>",
        conclusion: "<p>Coxarthrose gauche.</p>",
      }),
    ).toEqual([]);
  });
});

describe("reviewReport — modèle, unités, répétitions", () => {
  it("trouve les restes de modèle", () => {
    const findings = reviewReport(
      report({ resultats: "<p>Nodule de XX mm, segment [à préciser].</p>" }),
    );
    expect(findings.filter((f) => f.kind === "placeholder")).toHaveLength(2);
  });

  it("trouve une mesure sans unité, pas une mesure correcte", () => {
    expect(
      kinds({ resultats: "<p>Kyste mesurant 12 dans le segment VI.</p>" }),
    ).toEqual([["unit", "resultats"]]);
    expect(
      kinds({ resultats: "<p>Masse de 34 x 21 au contact du rein.</p>" }),
    ).toEqual([["unit", "resultats"]]);
    expect(
      kinds({
        resultats:
          "<p>Kyste mesurant 12 mm. Masse de 34 x 21 x 18 mm. Épaisseur de 3,5 cm.</p>",
      }),
    ).toEqual([]);
  });

  it("trouve un mot répété, sauf les répétitions françaises légitimes", () => {
    expect(kinds({ conclusion: "<p>Absence de de lésion.</p>" })).toEqual([
      ["repeat", "conclusion"],
    ]);
    expect(kinds({ resultats: "<p>Aspect déjà été été décrit.</p>" })).toEqual([
      ["repeat", "resultats"],
    ]);
    expect(
      kinds({ conclusion: "<p>Lésion élargie à l'ensemble.</p>" }),
    ).toEqual([]);
    expect(kinds({ conclusion: "<p>Nous nous sommes assurés.</p>" })).toEqual(
      [],
    );
  });

  it("classe la latéralité en tête", () => {
    const findings = reviewReport(
      report({
        indication: "<p>Épaule droite.</p>",
        resultats: "<p>Le le tendon de l'épaule gauche.</p>",
      }),
    );
    expect(findings[0].kind).toBe("laterality");
  });
});

describe("plainText", () => {
  it("ôte le balisage et rend les entités", () => {
    expect(plainText("<p>A&nbsp;&amp; <strong>B</strong></p><p>C</p>")).toBe(
      "A & B\nC\n",
    );
  });
});

describe("describeFinding", () => {
  it("écrit le message dans la langue de l'écran, la détection restant celle du texte", () => {
    const findings = reviewReport(
      report({
        indication: "<p>Douleur du genou droit.</p>",
        resultats: "<p>Épanchement du genou gauche mesurant 12.</p>",
      }),
    );
    const fr = messagesFor("fr").reading.review;
    const en = messagesFor("en").reading.review;
    expect(describeFinding(findings[0], fr)).toBe(
      "L’indication porte sur le côté droit, les résultats ne décrivent que le côté gauche.",
    );
    expect(describeFinding(findings[0], en)).toBe(
      "The clinical indication concerns the right side, but the findings describe only the left side.",
    );
    expect(describeFinding(findings[1], en)).toBe(
      "Measurement without a unit: “mesurant 12”.",
    );
  });
});

describe("reviewReport : compte-rendu en anglais", () => {
  it("reconnaît les côtés et le bilatéral anglais", () => {
    expect([...sidesIn("Right knee")]).toEqual(["droit"]);
    expect(sidesIn("bilateral pleural effusion").size).toBe(2);
    expect(sidesIn("changes on both sides").size).toBe(2);
  });

  it("signale un côté demandé et l'autre décrit", () => {
    expect(
      kinds({
        indication: "<p>Right knee pain.</p>",
        resultats: "<p>Left knee joint effusion.</p>",
      }),
    ).toEqual([["laterality", "resultats"]]);
  });

  it("trouve une mesure sans unité, pas une mesure correcte", () => {
    expect(
      kinds({ resultats: "<p>Nodule measuring 12. Cyst of 8 mm.</p>" }),
    ).toEqual([["unit", "resultats"]]);
    expect(
      kinds({ resultats: "<p>Lesion measuring approximately 14 mm.</p>" }),
    ).toEqual([]);
  });

  it("trouve un mot répété, sauf les répétitions anglaises légitimes", () => {
    expect(kinds({ resultats: "<p>No sign of the the lesion.</p>" })).toEqual([
      ["repeat", "resultats"],
    ]);
    expect(
      kinds({ resultats: "<p>The lesion that that study showed.</p>" }),
    ).toEqual([]);
  });
});
