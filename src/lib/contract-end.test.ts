import { describe, expect, it } from "vitest";

import {
  confirmsClinicName,
  foldName,
  unreportedCount,
} from "@/lib/contract-end";

describe("confirmation par le nom de la clinique", () => {
  it("accepte le nom exact, aux espaces de bord et à la casse près", () => {
    expect(
      confirmsClinicName("Clinique Saint-Joseph", "Clinique Saint-Joseph"),
    ).toBe(true);
    expect(
      confirmsClinicName("  clinique saint-joseph ", "Clinique Saint-Joseph"),
    ).toBe(true);
    expect(
      confirmsClinicName("CLINIQUE SAINT-JOSEPH", "Clinique Saint-Joseph"),
    ).toBe(true);
  });

  it("refuse un nom partiel, vide ou différent", () => {
    expect(confirmsClinicName("Clinique Saint", "Clinique Saint-Joseph")).toBe(
      false,
    );
    expect(confirmsClinicName("", "Clinique Saint-Joseph")).toBe(false);
    expect(confirmsClinicName("   ", "   ")).toBe(false);
    expect(
      confirmsClinicName("Clinique Saint Joseph", "Clinique Saint-Joseph"),
    ).toBe(false);
  });

  it("garde les accents : ce sont des lettres distinctes", () => {
    expect(confirmsClinicName("Clinique Esperance", "Clinique Espérance")).toBe(
      false,
    );
    expect(confirmsClinicName("CLINIQUE ESPÉRANCE", "Clinique Espérance")).toBe(
      true,
    );
  });

  it("replie la casse comme casefold, eszett compris", () => {
    expect(foldName("Straße")).toBe("strasse");
    expect(confirmsClinicName("STRASSE", "Straße")).toBe(true);
  });
});

describe("examens non rendus annoncés par le service", () => {
  it("lit le nombre dans le message, en français comme en anglais", () => {
    expect(
      unreportedCount(
        "Examens non rendus : 3. Faites-les rendre, ou confirmez leur abandon",
      ),
    ).toBe(3);
    expect(
      unreportedCount(
        "Examinations not yet reported: 12. Have them reported, or confirm they will be abandoned",
      ),
    ).toBe(12);
  });

  it("ne voit rien dans le refus d'un contrat déjà terminé", () => {
    expect(
      unreportedCount("Le contrat de cette clinique est déjà terminé"),
    ).toBeNull();
    expect(unreportedCount("This clinic's contract has already ended")).toBe(
      null,
    );
  });
});
