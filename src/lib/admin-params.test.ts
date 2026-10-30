import { describe, expect, it } from "vitest";

import {
  parseCursor,
  parseMonth,
  parsePeriod,
  parseUserFilter,
  shiftMonth,
  userListHref,
} from "@/lib/admin-params";

describe("paramètres d'adresse de la tour de contrôle", () => {
  it("ne retient qu'une période proposée", () => {
    expect(parsePeriod("90")).toBe(90);
    expect(parsePeriod(["7", "30"])).toBe(7);
    expect(parsePeriod("12")).toBe(30);
    expect(parsePeriod(undefined)).toBe(30);
    expect(parsePeriod("1e3")).toBe(30);
  });

  it("borne le mois au mois courant", () => {
    const now = new Date("2026-10-07T12:00:00Z");
    expect(parseMonth("2026-09", now)).toBe("2026-09");
    expect(parseMonth("2027-01", now)).toBe("2026-10");
    expect(parseMonth("2026-13", now)).toBe("2026-10");
    expect(parseMonth("'; drop", now)).toBe("2026-10");
  });

  it("passe d'un mois à l'autre, années comprises", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("n'accepte qu'un curseur entier positif", () => {
    expect(parseCursor("120")).toBe(120);
    expect(parseCursor("0")).toBeUndefined();
    expect(parseCursor("-3")).toBeUndefined();
    expect(parseCursor("12abc")).toBeUndefined();
    expect(parseCursor("99999999999999999999")).toBeUndefined();
  });
});

describe("filtre de la liste des comptes", () => {
  it("lit l’adresse ouverte par l’alerte du cockpit", () => {
    expect(parseUserFilter({ validation: "attente" })).toBe("unverified");
    expect(parseUserFilter({ attente: "1" })).toBe("pending");
    expect(parseUserFilter({ attente: "1", validation: "attente" })).toBe(
      "unverified",
    );
    expect(parseUserFilter({ validation: "autre" })).toBe("all");
    expect(parseUserFilter({})).toBe("all");
  });

  it("lit l’adresse ouverte par l’information des signatures à vérifier", () => {
    expect(parseUserFilter({ signature: "attente" })).toBe("signing");
    expect(parseUserFilter({ signature: "autre" })).toBe("all");
    expect(userListHref("signing")).toBe(
      "/admin/utilisateurs?signature=attente",
    );
  });

  it("garde la modalité d’un filtre à l’autre, jamais une recherche", () => {
    expect(userListHref("all", "ct")).toBe(
      "/admin/utilisateurs?modalite=scanner",
    );
    expect(userListHref("unverified")).toBe(
      "/admin/utilisateurs?validation=attente",
    );
    expect(userListHref("pending", "mri")).toBe(
      "/admin/utilisateurs?modalite=irm&attente=1",
    );
    expect(userListHref("all")).toBe("/admin/utilisateurs");
    // Aller-retour : l'adresse produite se relit en le même filtre.
    for (const filter of ["all", "pending", "unverified", "signing"] as const) {
      const params = Object.fromEntries(
        new URL(userListHref(filter), "https://imafrik.test").searchParams,
      );
      expect(parseUserFilter(params)).toBe(filter);
    }
  });
});
