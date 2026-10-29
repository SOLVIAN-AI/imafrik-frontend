import { describe, expect, it } from "vitest";

import {
  clinicChoiceHref,
  foldForSearch,
  matchClinics,
  moveActive,
  sortClinics,
  typeAhead,
} from "@/lib/clinic-choice";

const names = (clinics: { name: string }[]) => clinics.map((c) => c.name);

describe("ordre des cliniques", () => {
  it("suit l’alphabet de la langue, accents et majuscules compris", () => {
    const clinics = [
      { name: "Polyclinique de Kara" },
      { name: "Élavagnon" },
      { name: "clinique du Golfe" },
      { name: "Cabinet Espérance" },
      { name: "Eyadéma" },
      { name: "Centre 10" },
      { name: "Centre 2" },
    ];
    expect(names(sortClinics(clinics, "fr"))).toEqual([
      "Cabinet Espérance",
      "Centre 2",
      "Centre 10",
      "clinique du Golfe",
      "Élavagnon",
      "Eyadéma",
      "Polyclinique de Kara",
    ]);
    expect(names(sortClinics(clinics, "en"))[4]).toBe("Élavagnon");
  });

  it("ne modifie pas la liste reçue", () => {
    const clinics = [{ name: "B" }, { name: "A" }];
    sortClinics(clinics, "fr");
    expect(names(clinics)).toEqual(["B", "A"]);
  });
});

describe("recherche d’une clinique", () => {
  const clinics = [
    { name: "Cabinet Espérance" },
    { name: "Clinique Saint-Joseph" },
    { name: "Polyclinique de Kara" },
    { name: "CHU Campus" },
  ];

  it("ignore accents et majuscules", () => {
    expect(foldForSearch("  ÉSPÉRANCE ")).toBe("esperance");
    expect(names(matchClinics(clinics, "esperance"))).toEqual([
      "Cabinet Espérance",
    ]);
    expect(names(matchClinics(clinics, "CHU"))).toEqual(["CHU Campus"]);
  });

  it("retient les cliniques qui contiennent chacun des mots", () => {
    expect(names(matchClinics(clinics, "clinique"))).toEqual([
      "Clinique Saint-Joseph",
      "Polyclinique de Kara",
    ]);
    expect(names(matchClinics(clinics, "saint jo"))).toEqual([
      "Clinique Saint-Joseph",
    ]);
    expect(matchClinics(clinics, "lomé")).toEqual([]);
  });

  it("garde tout pour une saisie vide", () => {
    expect(matchClinics(clinics, "   ")).toHaveLength(4);
  });
});

describe("déplacement au clavier", () => {
  it("avance et recule sans boucler", () => {
    expect(moveActive(-1, "ArrowDown", 5)).toBe(0);
    expect(moveActive(-1, "ArrowUp", 5)).toBe(4);
    expect(moveActive(2, "ArrowDown", 5)).toBe(3);
    expect(moveActive(4, "ArrowDown", 5)).toBe(4);
    expect(moveActive(0, "ArrowUp", 5)).toBe(0);
  });

  it("va au début, à la fin, et par pages", () => {
    expect(moveActive(3, "Home", 5)).toBe(0);
    expect(moveActive(1, "End", 5)).toBe(4);
    expect(moveActive(2, "PageDown", 30)).toBe(12);
    expect(moveActive(25, "PageDown", 30)).toBe(29);
    expect(moveActive(5, "PageUp", 30)).toBe(0);
  });

  it("ignore les autres touches et les listes vides", () => {
    expect(moveActive(1, "a", 5)).toBeNull();
    expect(moveActive(0, "ArrowDown", 0)).toBeNull();
  });

  it("saute à la clinique suivante qui commence par la lettre tapée", () => {
    const labels = [
      "Toutes les cliniques",
      "Cabinet Espérance",
      "Clinique Saint-Joseph",
      "Élavagnon",
      "Polyclinique de Kara",
    ];
    expect(typeAhead(labels, 0, "c")).toBe(1);
    expect(typeAhead(labels, 1, "c")).toBe(2);
    // Après la dernière, on repart du début.
    expect(typeAhead(labels, 2, "c")).toBe(1);
    expect(typeAhead(labels, 0, "e")).toBe(3);
    expect(typeAhead(labels, 0, "z")).toBeNull();
  });
});

describe("adresse du choix", () => {
  it("garde les autres filtres et repart de la première page", () => {
    expect(
      clinicChoiceHref(
        "/admin/examens",
        "modalite=scanner&apres=abc&urgent=1",
        "clinique",
        "org-pka",
        ["apres"],
      ),
    ).toBe("/admin/examens?modalite=scanner&urgent=1&clinique=org-pka");
  });

  it("retire la clinique pour toutes les cliniques", () => {
    expect(
      clinicChoiceHref(
        "/worklist",
        new URLSearchParams("clinique=org-stj&modalite=CT"),
        "clinique",
        null,
        [],
      ),
    ).toBe("/worklist?modalite=CT");
    expect(
      clinicChoiceHref("/worklist", "clinique=org-stj", "clinique", null, []),
    ).toBe("/worklist");
  });
});
