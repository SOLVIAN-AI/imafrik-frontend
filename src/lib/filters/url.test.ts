import { describe, expect, it } from "vitest";

import { messagesFor } from "@/i18n";
import { DIMENSION_ORDER, DIMENSIONS } from "@/lib/filters/dimensions";
import { LIST_FILTERS, NETWORK } from "@/lib/filters/screens";
import {
  clearFiltersHref,
  filterHref,
  hasFilters,
  paramHref,
  readFilters,
} from "@/lib/filters/url";

const SCREEN = LIST_FILTERS["admin-examens"];

describe("lecture des filtres", () => {
  it("lit chaque dimension de l’écran", () => {
    expect(
      readFilters(
        { clinique: "org-stj", modalite: "scanner", urgent: "1" },
        SCREEN,
      ),
    ).toEqual({ clinic: "org-stj", modality: "ct", urgency: "urgent" });
  });

  it("ignore une valeur inconnue : la dimension revient à « Tous »", () => {
    expect(
      readFilters(
        { modalite: "SCANNER", urgent: "oui", clinique: "<script>" },
        SCREEN,
      ),
    ).toEqual({});
    expect(readFilters({ clinique: "x".repeat(65) }, SCREEN)).toEqual({});
    expect(readFilters({ modalite: "" }, SCREEN)).toEqual({});
  });

  it("ne retient une clinique que parmi celles connues, quand on les donne", () => {
    const known = { clinic: ["org-stj", "org-pka"] };
    expect(readFilters({ clinique: "org-inconnue" }, SCREEN, known)).toEqual(
      {},
    );
    expect(readFilters({ clinique: "org-pka" }, SCREEN, known)).toEqual({
      clinic: "org-pka",
    });
  });

  it("ouvre le groupe d’un ancien filtre de « À lire », en codes DICOM", () => {
    expect(readFilters({ modalite: "CT" }, SCREEN)).toEqual({
      modality: "ct",
    });
    expect(readFilters({ modalite: "MR,CT" }, SCREEN)).toEqual({
      modality: "mri",
    });
    // L'HSG est une radiographie.
    expect(readFilters({ modalite: "RF" }, SCREEN)).toEqual({
      modality: "radiography",
    });
    // Un mot qui ressemble à un code n'en est pas un : la file était vidée.
    expect(readFilters({ modalite: "SCANNER" }, SCREEN)).toEqual({});
    expect(readFilters({ modalite: "IRM" }, SCREEN)).toEqual({});
  });

  it("ne lit que les dimensions de l’écran", () => {
    expect(readFilters({ modalite: "irm" }, ["clinic"])).toEqual({});
  });

  it("prend la première valeur d’un paramètre répété", () => {
    expect(readFilters({ modalite: ["irm", "scanner"] }, SCREEN)).toEqual({
      modality: "mri",
    });
  });

  it("accepte toutes les formes d’adresse", () => {
    expect(readFilters("modalite=irm", SCREEN)).toEqual({ modality: "mri" });
    expect(
      readFilters(new URLSearchParams({ modalite: "irm" }), SCREEN),
    ).toEqual({ modality: "mri" });
  });
});

describe("état, radiologue, période", () => {
  const EXAMENS = LIST_FILTERS.examens;

  it("lit l’état, le radiologue et la période", () => {
    expect(
      readFilters(
        { etat: "en-lecture", radiologue: "prof-diallo", jours: "7" },
        EXAMENS,
      ),
    ).toEqual({ state: "reading", radiologist: "prof-diallo", period: "7" });
    expect(readFilters({ etat: "lu", jours: "8" }, EXAMENS)).toEqual({});
  });

  it("lit encore les anciens états des comptes-rendus de l’équipe", () => {
    const EQUIPE = LIST_FILTERS["comptes-rendus-equipe"];
    expect(readFilters({ etat: "draft" }, EQUIPE)).toEqual({
      state: "reading",
    });
    expect(readFilters({ etat: "signed" }, EQUIPE)).toEqual({ state: "ready" });
    expect(readFilters({ etat: "delivered" }, EQUIPE)).toEqual({
      state: "delivered",
    });
    // Changer une autre dimension laisse l'état tel qu'il est écrit.
    expect(
      filterHref("/comptes-rendus", "etat=signed", { modality: "ct" }),
    ).toBe("/comptes-rendus?etat=signed&modalite=scanner");
  });

  it("lit encore l’ancienne vue « À attribuer », puis la remplace", () => {
    expect(readFilters({ vue: "a-attribuer" }, EXAMENS)).toEqual({
      state: "to_assign",
    });
    // Le paramètre d'aujourd'hui l'emporte.
    expect(readFilters({ vue: "a-attribuer", etat: "remis" }, EXAMENS)).toEqual(
      {
        state: "delivered",
      },
    );
    expect(
      filterHref("/examens", { vue: "a-attribuer" }, { state: "ready" }),
    ).toBe("/examens?etat=pret");
    expect(
      clearFiltersHref("/examens", { vue: "a-attribuer", x: "1" }, EXAMENS),
    ).toBe("/examens?x=1");
  });
});

describe("écriture des filtres", () => {
  it("garde les autres paramètres et repart de la première page", () => {
    expect(
      filterHref(
        "/admin/examens",
        { clinique: "org-stj", apres: "abc", avant: "12", onglet: "x" },
        { modality: "ct" },
      ),
    ).toBe("/admin/examens?clinique=org-stj&onglet=x&modalite=scanner");
  });

  it("retire une dimension ramenée à « Tous »", () => {
    expect(
      filterHref(
        "/admin/examens",
        { clinique: "org-stj", modalite: "irm" },
        { clinic: null },
      ),
    ).toBe("/admin/examens?modalite=irm");
    expect(
      filterHref("/admin/examens", { urgent: "1" }, { urgency: null }),
    ).toBe("/admin/examens");
  });

  it("se relit en les mêmes filtres", () => {
    const filters = {
      clinic: "org-pka",
      modality: "radiography",
      urgency: "urgent",
    };
    const href = filterHref("/admin/examens", "", filters);
    expect(
      readFilters(new URL(href, "https://imafrik.test").searchParams, SCREEN),
    ).toEqual(filters);
  });

  it("efface les filtres de l’écran, et eux seuls", () => {
    expect(
      clearFiltersHref(
        "/admin/examens",
        { clinique: "org-stj", modalite: "irm", urgent: "1", onglet: "x" },
        SCREEN,
      ),
    ).toBe("/admin/examens?onglet=x");
  });

  it("change un paramètre seul, la page retirée", () => {
    expect(
      paramHref("/worklist", "clinique=a&apres=z&urgent=1", "clinique", "b"),
    ).toBe("/worklist?clinique=b&urgent=1");
    expect(paramHref("/worklist", "clinique=a", "clinique", null)).toBe(
      "/worklist",
    );
    expect(paramHref("/x", "a=1&apres=2", "c", "3", [])).toBe(
      "/x?a=1&apres=2&c=3",
    );
  });

  it("dit si un filtre est actif", () => {
    expect(hasFilters({})).toBe(false);
    expect(hasFilters({ modality: "ct" })).toBe(true);
  });
});

describe("registre des dimensions", () => {
  it("un paramètre d’adresse par dimension, jamais celui d’une recherche", () => {
    const params = DIMENSION_ORDER.map((key) => DIMENSIONS[key].param);
    expect(new Set(params).size).toBe(params.length);
    expect(params).not.toContain("q");
  });

  it("chaque valeur fixe s’écrit puis se relit à l’identique", () => {
    for (const key of DIMENSION_ORDER) {
      const definition = DIMENSIONS[key];
      for (const value of "values" in definition ? definition.values : [])
        expect(definition.read(definition.write(value))).toBe(value);
    }
  });

  it("chaque dimension a son nom et son option par défaut, en deux langues", () => {
    for (const locale of ["fr", "en"] as const) {
      const t = messagesFor(locale);
      for (const key of DIMENSION_ORDER) {
        const { name, all } = DIMENSIONS[key].text(t);
        expect(name).not.toBe("");
        expect(all).toMatch(locale === "fr" ? /^(Tous|Toutes) / : /^All /);
      }
    }
  });

  it("les écrans du réseau reçoivent les dimensions du réseau", () => {
    for (const key of NETWORK)
      expect(LIST_FILTERS["admin-examens"]).toContain(key);
  });
});
