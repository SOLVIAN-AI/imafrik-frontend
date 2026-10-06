import { describe, expect, it } from "vitest";

import { firstBrokenRule } from "@/lib/security/password";

describe("firstBrokenRule", () => {
  it("accepte un mot de passe conforme", () => {
    expect(firstBrokenRule("Radiologie-2026")).toBeNull();
  });

  it.each([
    ["trop court", "Court-1"],
    ["sans majuscule", "radiologie-2026"],
    ["sans chiffre ni symbole", "RadiologieLome"],
    ["trop long", `A1${"x".repeat(200)}`],
  ])("refuse un mot de passe %s", (_label, password) => {
    expect(firstBrokenRule(password)).not.toBeNull();
  });
});
