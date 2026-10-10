import { expect, test } from "@playwright/test";

import { decodeBase32, totpAt } from "./support/totp";

/**
 * Le calcul des codes TOTP du parcours, contre les vecteurs de la RFC 6238.
 *
 * Un code faux ne ferait pas échouer la double authentification pour une
 * raison lisible : GoTrue répondrait « code incorrect », comme pour une
 * vraie faute de frappe. On vérifie donc l'outil lui-même, à part.
 */

/** Clé des vecteurs SHA-1 de la RFC 6238 (annexe B) : « 12345678901234567890 ». */
const RFC_KEY = Buffer.from("12345678901234567890", "ascii");

test("les codes sont ceux de la RFC 6238", () => {
  const vectors: [number, string][] = [
    [59, "94287082"],
    [1_111_111_109, "07081804"],
    [1_111_111_111, "14050471"],
    [1_234_567_890, "89005924"],
    [2_000_000_000, "69279037"],
  ];
  for (const [seconds, code] of vectors) {
    expect(totpAt(RFC_KEY, seconds * 1000, 8), `t = ${seconds}`).toBe(code);
  }
});

test("la clé affichée, groupée par quatre, se décode", () => {
  // « 12345678901234567890 » en Base32, telle que l'écran la groupe.
  const shown = "GEZD GNBV GY3T QOJQ GEZD GNBV GY3T QOJQ";
  expect(decodeBase32(shown).equals(RFC_KEY)).toBe(true);
  expect(() => decodeBase32("GEZD1")).toThrow(/Base32/);
});
