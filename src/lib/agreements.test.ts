import { describe, expect, it } from "vitest";

import {
  AGREEMENT_KINDS,
  type AgreementStatus,
  acceptanceProblem,
  agreementKindFor,
  agreementKindFromSlug,
  agreementPdfHref,
  agreementSlug,
  pendingAgreements,
} from "@/lib/agreements";

/** Engagement dû, ajusté. */
function status(overrides: Partial<AgreementStatus>): AgreementStatus {
  return {
    kind: "radiologist_agreement",
    version: "1.0",
    title: "Contrat d'exercice du radiologue",
    effectiveDate: "2026-11-01",
    sha256: "a".repeat(64),
    acceptedAt: null,
    acceptedBy: null,
    canAccept: true,
    ...overrides,
  };
}

describe("engagements par rôle", () => {
  it("demande un contrat au radiologue et une convention à la clinique", () => {
    expect(agreementKindFor("radiologist")).toBe("radiologist_agreement");
    expect(agreementKindFor("clinic_staff")).toBe("clinic_agreement");
    expect(agreementKindFor("platform_admin")).toBeNull();
  });

  it("ne garde que les engagements non acceptés", () => {
    const accepted = status({ acceptedAt: new Date("2026-11-02T08:00:00Z") });
    const pending = status({ kind: "clinic_agreement" });
    expect(pendingAgreements([accepted, pending])).toEqual([pending]);
    expect(pendingAgreements([accepted])).toEqual([]);
  });
});

describe("adresses", () => {
  it("fait l'aller-retour entre nature et segment d'URL", () => {
    for (const kind of AGREEMENT_KINDS) {
      expect(agreementKindFromSlug(agreementSlug(kind))).toBe(kind);
    }
  });

  it("refuse un segment inconnu", () => {
    expect(agreementKindFromSlug("radiologist_agreement")).toBeNull();
    expect(agreementKindFromSlug("../admin")).toBeNull();
    expect(agreementKindFromSlug("")).toBeNull();
  });

  it("donne l'adresse du PDF relayé", () => {
    expect(agreementPdfHref("clinic_agreement")).toBe(
      "/engagements/convention-etablissement/pdf",
    );
  });
});

describe("contrôle avant acceptation", () => {
  const base = { version: "1.0", sha256: "b".repeat(64) };

  it("n'exige rien de plus du radiologue", () => {
    expect(
      acceptanceProblem({ ...base, kind: "radiologist_agreement" }),
    ).toBeNull();
  });

  it("exige la qualité et la déclaration de pouvoir pour une convention", () => {
    expect(
      acceptanceProblem({
        ...base,
        kind: "clinic_agreement",
        declaresAuthority: true,
      }),
    ).toBe("capacity_missing");
    expect(
      acceptanceProblem({
        ...base,
        kind: "clinic_agreement",
        signatoryCapacity: "   ",
        declaresAuthority: true,
      }),
    ).toBe("capacity_missing");
    expect(
      acceptanceProblem({
        ...base,
        kind: "clinic_agreement",
        signatoryCapacity: "Directeur général",
      }),
    ).toBe("authority_missing");
    expect(
      acceptanceProblem({
        ...base,
        kind: "clinic_agreement",
        signatoryCapacity: "Directeur général",
        declaresAuthority: true,
      }),
    ).toBeNull();
  });
});
