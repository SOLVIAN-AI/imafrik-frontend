import { describe, expect, it } from "vitest";

import {
  type RuleSlot,
  isOvernight,
  overlaps,
  slotIntervals,
  slotProblem,
  toAssignmentRules,
} from "@/lib/assignment-rules";

const slot = (
  radiologistId: string,
  weekdays: RuleSlot["weekdays"],
  startsAt: string | null = null,
  endsAt: string | null = null,
): RuleSlot => ({ radiologistId, weekdays, startsAt, endsAt });

describe("un créneau du planning", () => {
  it("couvre la journée entière sans heures", () => {
    expect(slotIntervals(slot("a", [1, 3]))).toEqual([
      [0, 1440],
      [2880, 4320],
    ]);
  });

  it("couvre ses heures, fin exclue", () => {
    expect(slotIntervals(slot("a", [2], "08:00", "14:30"))).toEqual([
      [1440 + 480, 1440 + 870],
    ]);
  });

  it("déborde sur le lendemain la nuit, et le dimanche sur le lundi", () => {
    const nuit = slot("a", [7], "20:00", "08:00");
    expect(isOvernight(nuit)).toBe(true);
    expect(slotIntervals(nuit)).toEqual([
      [6 * 1440 + 1200, 7 * 1440],
      [0, 480],
    ]);
    expect(isOvernight(slot("a", [1], "08:00", "20:00"))).toBe(false);
  });

  it("dit ce qui l'empêche d'être enregistré", () => {
    expect(slotProblem(slot("", [1]))).toBe("radiologist");
    expect(slotProblem(slot("a", []))).toBe("days");
    expect(slotProblem(slot("a", [1], "08:00", null))).toBe("hours");
    expect(slotProblem(slot("a", [1], "08:00", "08:00"))).toBe("sameHours");
    expect(slotProblem(slot("a", [1], "20:00", "08:00"))).toBeNull();
  });
});

describe("les radiologues de garde en même temps", () => {
  it("sont signalés, avec les jours où ils se chevauchent", () => {
    expect(
      overlaps([
        slot("b", [1, 2, 3], "08:00", "14:00"),
        slot("a", [2, 3, 4], "12:00", "18:00"),
      ]),
    ).toEqual([{ first: "a", second: "b", days: [2, 3] }]);
  });

  it("ne le sont pas quand l'un prend le relais de l'autre", () => {
    expect(
      overlaps([
        slot("a", [1, 2, 3, 4, 5], "08:00", "20:00"),
        slot("b", [1, 2, 3, 4, 5], "20:00", "08:00"),
      ]),
    ).toEqual([]);
  });

  it("le sont quand une garde de nuit déborde sur la journée d'un autre", () => {
    expect(
      overlaps([
        slot("a", [7], "20:00", "09:00"),
        slot("b", [1], "08:00", "16:00"),
      ]),
    ).toEqual([{ first: "a", second: "b", days: [1] }]);
  });

  it("ignorent les créneaux d'un même radiologue et les créneaux incomplets", () => {
    expect(
      overlaps([
        slot("a", [1]),
        slot("a", [1], "08:00", "12:00"),
        slot("b", []),
      ]),
    ).toEqual([]);
  });
});

describe("la réponse du service", () => {
  it("se traduit dans le vocabulaire de l'interface", () => {
    const rules = toAssignmentRules({
      clinic_id: "c",
      time_zone: "Africa/Lome",
      version: "v1",
      slots: [{ radiologist_id: "a", weekdays: [1, 5], starts_at: null }],
      modalities: [{ group: "ct", radiologist_id: "a" }],
      radiologists: [
        {
          profile_id: "a",
          name: "Dr A",
          organization_name: "Clinique",
          via_pool: false,
          read_modalities: null,
          can_receive: true,
        },
      ],
    });
    expect(rules.slots).toEqual([slot("a", [1, 5])]);
    expect(rules.modalities).toEqual([{ group: "ct", radiologistId: "a" }]);
    expect(rules.radiologists[0].canReceive).toBe(true);
  });
});
