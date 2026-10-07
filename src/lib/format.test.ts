import { describe, expect, it } from "vitest";

import {
  formatCount,
  formatDayShort,
  formatDuration,
  formatMinutes,
  formatPercent,
  formatRate,
  formatPatientAge,
  formatPatientName,
  formatSex,
} from "@/lib/format";

describe("formatDuration", () => {
  it.each([
    [45, "45 min"],
    [60, "1 h"],
    [130, "2 h 10"],
    [1500, "1 j 1 h"],
    [-3, "0 min"],
  ])("%d minutes → %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe("formatPatientName", () => {
  it("met en forme un nom DICOM", () => {
    expect(formatPatientName("koffi^Ama")).toBe("KOFFI Ama");
    expect(formatPatientName("")).toBe("—");
  });
});

describe("formatPatientAge", () => {
  const at = new Date("2026-10-07T10:00:00Z");

  it("compte en années, à la date de l'examen", () => {
    expect(formatPatientAge("1968-03-14", at)).toBe("58 ans");
    expect(formatPatientAge("1968-10-08", at)).toBe("57 ans");
  });

  it("compte en mois sous deux ans", () => {
    expect(formatPatientAge("2025-08-01", at)).toBe("14 mois");
  });

  it("ne devine rien d'une date absente ou incohérente", () => {
    expect(formatPatientAge(null, at)).toBeNull();
    expect(formatPatientAge("inconnue", at)).toBeNull();
    expect(formatPatientAge("2030-01-01", at)).toBeNull();
  });
});

describe("formatSex", () => {
  it("traduit le tag DICOM", () => {
    expect(formatSex("F")).toBe("Femme");
    expect(formatSex("m")).toBe("Homme");
    expect(formatSex(null)).toBeNull();
  });
});

describe("formats de la tour de contrôle", () => {
  it("met une proportion en pourcentage", () => {
    expect(formatPercent(0.944)).toBe("94 %");
    expect(formatPercent(1)).toBe("100 %");
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(Number.NaN)).toBe("—");
  });

  it("exprime une durée sans jamais mentir sous la minute", () => {
    expect(formatMinutes(null)).toBe("—");
    expect(formatMinutes(0.4)).toBe("24 s");
    expect(formatMinutes(0)).toBe("0 min");
    expect(formatMinutes(95)).toBe("1 h 35");
  });

  it("formate un débit et un volume à la française", () => {
    expect(formatRate(2.44).replace(/\s/g, " ")).toBe("2,4 Mo/s");
    expect(formatRate(null)).toBe("—");
    expect(formatCount(12480).replace(/\s/g, " ")).toBe("12 480");
  });

  it("lit un jour en UTC, quel que soit le fuseau du serveur", () => {
    expect(formatDayShort(new Date("2026-10-07T00:00:00Z"))).toBe("7 oct.");
  });
});
