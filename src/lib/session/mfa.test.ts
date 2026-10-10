import { describe, expect, it } from "vitest";

import {
  assuranceFromVerified,
  needsSecondFactor,
  passwordChangeNeedsSecondFactor,
  normalizeOtp,
  secondFactorPending,
  roleRequiresMfa,
} from "@/lib/session/mfa";

describe("double authentification", () => {
  it("est exigée de tous les rôles", () => {
    expect(roleRequiresMfa("radiologist")).toBe(true);
    expect(roleRequiresMfa("platform_admin")).toBe(true);
    // Tous les rôles depuis le 10 octobre 2026 : le personnel de clinique
    // voit les données de tous les patients de sa clinique.
    expect(roleRequiresMfa("clinic_staff")).toBe(true);
  });

  it("est demandée tant que la session n'est pas en aal2", () => {
    const aal1 = { current: "aal1", next: "aal1" };
    expect(needsSecondFactor("radiologist", aal1)).toBe(true);
    expect(needsSecondFactor("clinic_staff", aal1)).toBe(true);
    expect(
      needsSecondFactor("radiologist", { current: "aal2", next: "aal2" }),
    ).toBe(false);
  });

  it("tient quiconque a activé un facteur, même en clinique", () => {
    expect(
      needsSecondFactor("clinic_staff", { current: "aal1", next: "aal2" }),
    ).toBe(true);
  });

  it("n'accepte qu'un code de six chiffres, espaces tolérés", () => {
    expect(normalizeOtp("123 456")).toBe("123456");
    expect(normalizeOtp(" 654321 ")).toBe("654321");
    expect(normalizeOtp("12345")).toBeNull();
    expect(normalizeOtp("12a456")).toBeNull();
    expect(normalizeOtp("1234567")).toBeNull();
  });
});

describe("changement de mot de passe", () => {
  it("attend le second facteur quand un facteur vérifié existe", () => {
    expect(
      passwordChangeNeedsSecondFactor({ current: "aal1", next: "aal2" }),
    ).toBe(true);
  });

  it("passe une fois le second facteur vérifié, ou sans facteur", () => {
    expect(
      passwordChangeNeedsSecondFactor({ current: "aal2", next: "aal2" }),
    ).toBe(false);
    expect(
      passwordChangeNeedsSecondFactor({ current: "aal1", next: "aal1" }),
    ).toBe(false);
    expect(passwordChangeNeedsSecondFactor({ current: null, next: null })).toBe(
      false,
    );
  });

  it("calcule le niveau à partir du jeton et des facteurs vérifiés", () => {
    const verified = { status: "verified" };
    expect(assuranceFromVerified("aal1", [])).toEqual({
      current: "aal1",
      next: "aal1",
    });
    expect(assuranceFromVerified("aal1", [verified])).toEqual({
      current: "aal1",
      next: "aal2",
    });
    expect(assuranceFromVerified("aal2", [verified])).toEqual({
      current: "aal2",
      next: "aal2",
    });
    // Un facteur en cours d'enrôlement n'ouvre pas le second niveau.
    expect(assuranceFromVerified("aal1", [{ status: "unverified" }])).toEqual({
      current: "aal1",
      next: "aal1",
    });
    // Claim absent ou inattendu : aucun niveau reconnu.
    expect(assuranceFromVerified(undefined, undefined)).toEqual({
      current: null,
      next: null,
    });
    expect(assuranceFromVerified("aal3", null).current).toBeNull();
  });
});

describe("second facteur attendu, avant toute lecture en base", () => {
  const aal1 = { current: "aal1", next: "aal1" };
  const withFactor = { current: "aal1", next: "aal2" };
  const aal2 = { current: "aal2", next: "aal2" };

  it("suit l'exigence posée par le hook dans le jeton", () => {
    expect(secondFactorPending(true, aal1)).toBe(true);
    expect(secondFactorPending(false, aal1)).toBe(false);
    expect(secondFactorPending(undefined, aal1)).toBe(false);
    // Seul le booléen vaut exigence : une chaîne n'est pas un claim valide.
    expect(secondFactorPending("true", aal1)).toBe(false);
  });

  it("vaut pour un facteur vérifié, même sur un jeton qui ne le dit pas", () => {
    expect(secondFactorPending(false, withFactor)).toBe(true);
  });

  it("n'attend plus rien au second niveau", () => {
    expect(secondFactorPending(true, aal2)).toBe(false);
    expect(secondFactorPending(false, aal2)).toBe(false);
  });
});
