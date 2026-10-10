import { describe, expect, it } from "vitest";

import { admin as adminEn } from "@/i18n/messages/en/admin";
import { admin as adminFr } from "@/i18n/messages/fr/admin";

/**
 * Accords en nombre des textes dont le compte varie.
 *
 * En français, 0 et 1 commandent le singulier ; en anglais, seul 1.
 */
describe("accords en nombre", () => {
  it("décrit la liste de tous les examens au singulier comme au pluriel", () => {
    expect(adminFr.studies.allDescription(1)).toBe(
      "1 examen, toutes organisations confondues",
    );
    expect(adminFr.studies.allDescription(0)).toBe(
      "0 examen, toutes organisations confondues",
    );
    expect(adminFr.studies.allDescription(12)).toBe(
      "12 examens, toutes organisations confondues",
    );
    expect(adminEn.studies.allDescription(1)).toBe(
      "1 examination across all organisations",
    );
    expect(adminEn.studies.allDescription(0)).toBe(
      "0 examinations across all organisations",
    );
    expect(adminEn.studies.allDescription(12)).toBe(
      "12 examinations across all organisations",
    );
  });
});
