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
