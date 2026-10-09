import { describe, expect, it } from "vitest";

import {
  needsSecondFactor,
  passwordChangeNeedsSecondFactor,
  normalizeOtp,
  roleRequiresMfa,
} from "@/lib/session/mfa";

describe("double authentification", () => {
  it("est exigée des rôles sensibles seulement", () => {
    expect(roleRequiresMfa("radiologist")).toBe(true);
    expect(roleRequiresMfa("platform_admin")).toBe(true);
    expect(roleRequiresMfa("clinic_staff")).toBe(false);
  });

  it("est demandée tant que la session n'est pas en aal2", () => {
    const aal1 = { current: "aal1", next: "aal1" };
    expect(needsSecondFactor("radiologist", aal1)).toBe(true);
    expect(needsSecondFactor("clinic_staff", aal1)).toBe(false);
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
});
