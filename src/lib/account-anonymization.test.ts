import { describe, expect, it } from "vitest";

import {
  confirmsAccountName,
  needsMembershipRemoval,
} from "@/lib/account-anonymization";

describe("confirmation par le nom du compte", () => {
  it("accepte le nom exact, aux espaces de bord et à la casse près", () => {
    expect(confirmsAccountName("Afi Lawson", "Afi Lawson")).toBe(true);
    expect(confirmsAccountName("  afi LAWSON ", "Afi Lawson")).toBe(true);
  });

  it("refuse un nom partiel, vide, ou précédé du titre", () => {
    expect(confirmsAccountName("Afi", "Afi Lawson")).toBe(false);
    expect(confirmsAccountName("", "Afi Lawson")).toBe(false);
    expect(confirmsAccountName("   ", "   ")).toBe(false);
    expect(confirmsAccountName("Dr Afi Lawson", "Afi Lawson")).toBe(false);
  });
});

describe("retrait des appartenances", () => {
  it("est exigé tant que le compte garde une organisation active", () => {
    expect(needsMembershipRemoval({ inactiveSince: null })).toBe(true);
    expect(
      needsMembershipRemoval({ inactiveSince: new Date("2026-01-01") }),
    ).toBe(false);
  });
});
