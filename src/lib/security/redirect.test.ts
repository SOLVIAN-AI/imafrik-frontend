import { describe, expect, it } from "vitest";

import { safeRedirect } from "@/lib/security/redirect";

describe("safeRedirect", () => {
  it("accepte un chemin interne, requête et ancre comprises", () => {
    expect(safeRedirect("/lecture/42")).toBe("/lecture/42");
    expect(safeRedirect("/examens?q=koffi#x")).toBe("/examens?q=koffi#x");
  });

  it("accepte les destinations des liens envoyés par courriel", () => {
    // Invitation et réinitialisation : `/auth/callback?suite=…`.
    expect(safeRedirect("/invitation")).toBe("/invitation");
    expect(safeRedirect("/nouveau-mot-de-passe")).toBe("/nouveau-mot-de-passe");
  });

  it.each([
    ["absent", null],
    ["vide", ""],
    ["absolu", "https://exemple.test/"],
    ["protocole relatif", "//exemple.test"],
    ["barre inverse", "/\\exemple.test"],
    ["tabulation", "/\t/exemple.test"],
    ["retour à la ligne", "/\n/exemple.test"],
    ["javascript", "javascript:alert(1)"],
    ["sans barre", "connexion"],
    ["point puis double barre", "/.//exemple.test"],
    ["point encodé puis double barre", "/%2e//exemple.test"],
    ["remontée puis double barre", "/a/..//exemple.test"],
    ["double point encodé puis double barre", "/x/%2e%2e//exemple.test"],
  ])("refuse une destination %s", (_label, target) => {
    expect(safeRedirect(target)).toBeNull();
  });
});
