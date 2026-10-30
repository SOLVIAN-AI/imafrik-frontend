import { describe, expect, it } from "vitest";

import { messagesFor } from "@/i18n";

import {
  type PlanLineInput,
  addDays,
  conflictsOfWeek,
  describeLine,
  isCalendarDay,
  isOvernight,
  lineIntervals,
  lineProblem,
  linesOfWeek,
  localParts,
  mondayOf,
  precisionOf,
  startsOnDay,
  toAssignmentPlan,
  weekCopyPreview,
  weekDays,
  weekdayOf,
} from "@/lib/assignment-plan";

/** Le 2 novembre 2026 est un lundi. */
const LUNDI = "2026-11-02";

const ligne = (
  radiologistId: string,
  weekdays: PlanLineInput["weekdays"],
  extra: Partial<PlanLineInput> = {},
): PlanLineInput & { id: string } => ({
  id: `${radiologistId}-${weekdays.join("")}-${extra.modality ?? ""}-${extra.startsOn ?? ""}`,
  radiologistId,
  weekdays,
  startsAt: null,
  endsAt: null,
  modality: null,
  startsOn: null,
  endsOn: null,
  ...extra,
});

describe("les jours de la clinique", () => {
  it("se comptent sans fuseau, d'un lundi à l'autre", () => {
    expect(weekdayOf(LUNDI)).toBe(1);
    expect(weekdayOf("2026-11-08")).toBe(7);
    expect(mondayOf("2026-11-08")).toBe(LUNDI);
    expect(mondayOf(LUNDI)).toBe(LUNDI);
    expect(addDays(LUNDI, -1)).toBe("2026-11-01");
    expect(weekDays(LUNDI)).toEqual([
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
    ]);
  });

  it("refusent une date mal formée ou qui n'existe pas", () => {
    expect(isCalendarDay("2026-11-02")).toBe(true);
    expect(isCalendarDay("2026-02-30")).toBe(false);
    expect(isCalendarDay("02/11/2026")).toBe(false);
  });

  it("se lisent à l'heure de la clinique", () => {
    // 23 h 30 UTC le dimanche est déjà lundi à Porto-Novo (UTC+1).
    const instant = new Date("2026-11-01T23:30:00Z");
    expect(localParts(instant, "Africa/Lome")).toEqual({
      day: "2026-11-01",
      minutes: 23 * 60 + 30,
    });
    expect(localParts(instant, "Africa/Porto-Novo")).toEqual({
      day: LUNDI,
      minutes: 30,
    });
  });
});

describe("une ligne du planning", () => {
  it("vaut chaque semaine sans période, et dans sa période sinon", () => {
    const chaque = ligne("a", [1]);
    const datee = ligne("a", [1], { startsOn: LUNDI, endsOn: "2026-11-08" });
    expect(startsOnDay(chaque, "2027-03-15")).toBe(true);
    expect(startsOnDay(datee, LUNDI)).toBe(true);
    expect(startsOnDay(datee, "2026-11-09")).toBe(false);
    expect(linesOfWeek([chaque, datee], "2026-11-09")).toEqual([chaque]);
  });

  it("appartient, la nuit, au jour où elle commence", () => {
    const nuit = ligne("a", [7], {
      startsAt: "20:00",
      endsAt: "08:00",
      startsOn: "2026-10-26",
      endsOn: "2026-11-01",
    });
    expect(isOvernight(nuit)).toBe(true);
    expect(lineIntervals(nuit, "2026-10-26")).toEqual([
      [6 * 1440 + 1200, 7 * 1440 + 480],
    ]);
  });

  it("est d'autant plus précise qu'elle a une modalité, une période, des heures", () => {
    expect(precisionOf(ligne("a", [1]))).toBe(0);
    expect(
      precisionOf(ligne("a", [1], { startsAt: "08:00", endsAt: "12:00" })),
    ).toBe(1);
    expect(
      precisionOf(ligne("a", [1], { startsOn: LUNDI, endsOn: LUNDI })),
    ).toBe(2);
    expect(precisionOf(ligne("a", [1], { modality: "mri" }))).toBe(4);
  });

  it("dit ce qui l'empêche d'être enregistrée", () => {
    const today = LUNDI;
    expect(lineProblem(ligne("", [1]), today)).toBe("radiologist");
    expect(lineProblem(ligne("a", []), today)).toBe("days");
    expect(lineProblem(ligne("a", [1], { startsAt: "08:00" }), today)).toBe(
      "hours",
    );
    expect(
      lineProblem(
        ligne("a", [1], { startsAt: "08:00", endsAt: "08:00" }),
        today,
      ),
    ).toBe("sameHours");
    expect(lineProblem(ligne("a", [1], { startsOn: LUNDI }), today)).toBe(
      "period",
    );
    expect(
      lineProblem(
        ligne("a", [1], { startsOn: "2026-11-08", endsOn: LUNDI }),
        today,
      ),
    ).toBe("periodOrder");
    expect(
      lineProblem(
        ligne("a", [1], { startsOn: LUNDI, endsOn: "2027-12-31" }),
        today,
      ),
    ).toBe("periodTooLong");
    expect(
      lineProblem(
        ligne("a", [1], { startsOn: "2026-10-26", endsOn: "2026-11-01" }),
        today,
      ),
    ).toBe("periodPast");
    expect(
      lineProblem(ligne("a", [3], { startsOn: LUNDI, endsOn: LUNDI }), today),
    ).toBe("noDayInPeriod");
    const irm = ligne("a", [1], { modality: "mri" });
    const lecteur = {
      profileId: "a",
      name: "Dr A",
      organizationName: "Clinique",
      viaPool: false,
      readModalities: ["ct" as const],
      canReceive: true,
    };
    expect(lineProblem(irm, today, lecteur)).toBe("modalityNotRead");
    expect(
      lineProblem(
        ligne("a", [1, 5], { startsAt: "20:00", endsAt: "08:00" }),
        today,
      ),
    ).toBeNull();
  });
});

describe("les conflits d'une semaine", () => {
  it("sont deux lignes aussi précises, pour deux radiologues, qui se recouvrent", () => {
    const a = ligne("a", [1, 2, 3], { startsAt: "08:00", endsAt: "14:00" });
    const b = ligne("b", [2, 3, 4], { startsAt: "12:00", endsAt: "18:00" });
    expect(conflictsOfWeek([a, b], LUNDI)).toEqual([
      { first: a.id, second: b.id, days: ["2026-11-03", "2026-11-04"] },
    ]);
  });

  it("épargnent la ligne la plus précise, qui l'emporte", () => {
    const lundis = ligne("a", [1]);
    const irm = ligne("b", [1, 2, 3, 4, 5, 6, 7], {
      modality: "mri",
      startsOn: LUNDI,
      endsOn: "2026-11-08",
    });
    const heures = ligne("c", [1], { startsAt: "08:00", endsAt: "12:00" });
    expect(conflictsOfWeek([lundis, irm, heures], LUNDI)).toEqual([]);
  });

  it("ne comptent ni deux modalités différentes, ni un radiologue qui ne compte pas", () => {
    const irm = ligne("a", [1], { modality: "mri" });
    const scanner = ligne("b", [1], { modality: "ct" });
    const aussi = ligne("c", [1], { modality: "mri" });
    expect(conflictsOfWeek([irm, scanner], LUNDI)).toEqual([]);
    expect(conflictsOfWeek([irm, aussi], LUNDI)).toHaveLength(1);
    expect(
      conflictsOfWeek(
        [irm, aussi],
        LUNDI,
        (line) => line.radiologistId !== "c",
      ),
    ).toEqual([]);
  });

  it("comptent la nuit qui déborde sur le matin du lendemain", () => {
    const nuit = ligne("a", [1], { startsAt: "20:00", endsAt: "08:00" });
    const matin = ligne("b", [2], { startsAt: "06:00", endsAt: "10:00" });
    expect(conflictsOfWeek([nuit, matin], LUNDI)).toEqual([
      { first: nuit.id, second: matin.id, days: ["2026-11-03"] },
    ]);
  });
});

describe("recopier la semaine précédente", () => {
  it("reprend les lignes datées d'avant, et nomme celles qu'elle remplacerait", () => {
    const precedente = ligne("a", [1, 2, 3, 4, 5], {
      modality: "mri",
      startsOn: "2026-10-26",
      endsOn: "2026-11-01",
    });
    const longue = ligne("b", [1], {
      startsOn: "2026-10-26",
      endsOn: "2026-11-15",
    });
    const cetteSemaine = ligne("c", [6, 7], {
      startsOn: "2026-11-07",
      endsOn: "2026-11-08",
    });
    const chaque = ligne("d", [1]);
    expect(
      weekCopyPreview([precedente, longue, cetteSemaine, chaque], LUNDI),
    ).toEqual({ sources: [precedente], replaced: [cetteSemaine] });
  });
});

describe("le planning reçu du service", () => {
  it("se traduit pour l'écran", () => {
    const plan = toAssignmentPlan({
      clinic_id: "c",
      time_zone: "Africa/Lome",
      today: LUNDI,
      lines: [
        {
          id: "l",
          radiologist_id: "a",
          weekdays: [1, 9],
          starts_at: null,
          ends_at: null,
          modality_group: "ct",
          starts_on: LUNDI,
          ends_on: "2026-11-08",
          updated_at: "2026-10-30T10:00:00Z",
          updated_by_name: "Alice",
        },
      ],
      radiologists: [],
    });
    expect(plan.lines[0]).toMatchObject({
      weekdays: [1],
      modality: "ct",
      startsOn: LUNDI,
      updatedByName: "Alice",
    });
  });
});

describe("une ligne en clair", () => {
  it("dit sa modalité, ses jours, ses heures et sa durée", () => {
    const t = messagesFor("fr");
    expect(
      describeLine(
        ligne("a", [1, 2, 3, 4, 5], {
          modality: "ct",
          startsAt: "08:00",
          endsAt: "18:00",
        }),
        t,
        "fr",
      ),
    ).toBe("Scanner · Lun à Ven · 08:00–18:00 · Chaque semaine");
    expect(
      describeLine(
        ligne("a", [1, 2, 3, 4, 5, 6, 7], {
          startsOn: LUNDI,
          endsOn: "2026-11-08",
        }),
        t,
        "fr",
      ),
    ).toBe(
      "Toutes modalités · Toute la semaine · Journée · Du 2 nov. au 8 nov.",
    );
  });
});
