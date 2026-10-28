import { describe, expect, it } from "vitest";

import { DEMO_NETWORK } from "@/lib/demo/control";
import { demoPerformance } from "@/lib/demo/performance";
import {
  type RadiologistPerformance,
  defaultDirection,
  sortPerformance,
  toPerformanceMonth,
  trendOf,
} from "@/lib/performance";

/** 28 octobre 2026, 9 h UTC. */
const NOW = Date.UTC(2026, 9, 28, 9);

const delays = (median: number | null) => ({
  medianMinutes: median,
  meanMinutes: median,
  p90Minutes: median,
  withinSla: median === null ? null : 1,
});

function row(
  name: string,
  median: number | null,
  signed: number,
): RadiologistPerformance {
  return {
    id: name,
    name,
    signedRoutine: signed,
    signedUrgent: 0,
    medianMinutes: median,
    withinSla: median === null ? null : 1,
    routine: delays(median),
    urgent: delays(null),
    pickupMinutes: null,
    readingMinutes: null,
    released: 0,
    urgentClaimed: 0,
    assignedWaiting: 0,
    inReading: 0,
    previousMedianMinutes: null,
    previousWithinSla: null,
  };
}

const ROWS = [
  row("Dr Bakari", 45, 10),
  row("Dr Kponton", 20, 4),
  row("Dr Mensah", null, 0),
  row("Pr Agbeko", 45, 12),
];

describe("tri des performances", () => {
  it("range par délai médian, sans donnée en dernier, à égalité par nom", () => {
    expect(
      sortPerformance(ROWS, "median", "ascending").map((r) => r.name),
    ).toEqual(["Dr Kponton", "Dr Bakari", "Pr Agbeko", "Dr Mensah"]);
    // Dans l'autre sens, la ligne sans donnée reste en bas.
    expect(
      sortPerformance(ROWS, "median", "descending").map((r) => r.name),
    ).toEqual(["Dr Bakari", "Pr Agbeko", "Dr Kponton", "Dr Mensah"]);
  });

  it("trie les volumes et les noms", () => {
    expect(
      sortPerformance(ROWS, "signed", "descending").map((r) => r.name),
    ).toEqual(["Pr Agbeko", "Dr Bakari", "Dr Kponton", "Dr Mensah"]);
    expect(
      sortPerformance(ROWS, "name", "ascending").map((r) => r.name)[0],
    ).toBe("Dr Bakari");
  });

  it("lit un délai du plus court, un volume ou une part du plus grand", () => {
    expect(defaultDirection("median")).toBe("ascending");
    expect(defaultDirection("urgentP90")).toBe("ascending");
    expect(defaultDirection("pickup")).toBe("ascending");
    expect(defaultDirection("signed")).toBe("descending");
    expect(defaultDirection("withinSla")).toBe("descending");
    expect(defaultDirection("released")).toBe("descending");
  });
});

describe("tendance sur le mois précédent", () => {
  it("dit un délai plus court meilleur, une part plus grande meilleure", () => {
    expect(trendOf(30, 45, true, 1)).toEqual({
      direction: "better",
      delta: 15,
      rising: false,
    });
    expect(trendOf(0.8, 0.9, false, 0.01)).toEqual({
      direction: "worse",
      delta: expect.closeTo(0.1),
      rising: false,
    });
    expect(trendOf(0.95, 0.9, false, 0.01)?.direction).toBe("better");
  });

  it("tient pour stable un écart sous le seuil, et ne compare pas sans mois précédent", () => {
    expect(trendOf(30.5, 30, true, 1)?.direction).toBe("same");
    expect(trendOf(30, null, true, 1)).toBeNull();
    expect(trendOf(null, 30, true, 1)).toBeNull();
  });
});

describe("performances de démonstration", () => {
  const STJ = DEMO_NETWORK[0].id;

  it("rangent les radiologues par délai médian, avec des chiffres cohérents", () => {
    const month = toPerformanceMonth(demoPerformance("2026-10", STJ, NOW));
    expect(month.month).toBe("2026-10");
    expect(month.radiologists.length).toBeGreaterThan(1);
    const medians = month.radiologists
      .map((r) => r.medianMinutes)
      .filter((m) => m !== null);
    expect(medians).toEqual([...medians].sort((a, b) => a - b));
    for (const r of month.radiologists) {
      for (const priority of [r.routine, r.urgent]) {
        if (priority.medianMinutes === null) continue;
        expect(priority.p90Minutes!).toBeGreaterThanOrEqual(
          priority.medianMinutes,
        );
      }
      expect(r.withinSla ?? 0).toBeLessThanOrEqual(1);
    }
  });

  it("borne une clinique à ses examens, le réseau les additionne", () => {
    const clinic = demoPerformance("2026-09", STJ, NOW);
    const network = demoPerformance("2026-09", null, NOW);
    const total = (month: typeof clinic) =>
      month.radiologists.reduce(
        (sum, r) => sum + r.signed_routine + r.signed_urgent,
        0,
      );
    expect(total(network)).toBeGreaterThan(total(clinic));
    // Le mois précédent nourrit la tendance.
    expect(
      clinic.radiologists.some((r) => r.previous_median_minutes !== null),
    ).toBe(true);
  });
});
