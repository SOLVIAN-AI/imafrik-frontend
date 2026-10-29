import { describe, expect, it } from "vitest";

import type { StudyFacets } from "@/lib/data/studies";
import { LIST_FILTERS } from "@/lib/filters/screens";
import {
  facetDimensions,
  facetsFor,
  STATE_STATUSES,
  studyQuery,
} from "@/lib/filters/studies";

const NOW = new Date("2026-10-29T12:00:00Z");

describe("requête d’une liste d’examens", () => {
  it("traduit chaque filtre pour le service", () => {
    expect(
      studyQuery(
        {
          clinic: "org-stj",
          radiologist: "prof-1",
          modality: "ct",
          state: "reading",
          urgency: "urgent",
          period: "7",
        },
        NOW,
      ),
    ).toEqual({
      clinic: "org-stj",
      radiologist: "prof-1",
      modalityGroup: "ct",
      status: ["assigned", "in_progress"],
      priority: "urgent",
      receivedAfter: new Date("2026-10-22T12:00:00Z"),
    });
    expect(studyQuery({}, NOW)).toEqual({});
  });

  it("chaque état couvre des statuts distincts, tous les statuts couverts", () => {
    const statuses = Object.values(STATE_STATUSES).flat();
    expect(new Set(statuses).size).toBe(statuses.length);
    expect([...statuses].sort()).toEqual(
      ["assigned", "delivered", "in_progress", "received", "reported"].sort(),
    );
  });
});

describe("barre tirée des comptes du service", () => {
  const counts: StudyFacets = {
    total: 9,
    facets: {
      clinic: [
        { value: "org-pka", label: "Polyclinique de Kara", count: 4 },
        { value: "org-stj", label: "Clinique Saint-Joseph", count: 5 },
      ],
      radiologist: [{ value: "prof-1", label: "Dr Diallo", count: 3 }],
      modality: [
        { value: "ct", count: 6 },
        { value: "mri", count: 3 },
      ],
      status: [
        { value: "received", count: 2 },
        { value: "assigned", count: 1 },
        { value: "in_progress", count: 2 },
        { value: "reported", count: 3 },
        { value: "delivered", count: 1 },
      ],
      priority: [
        { value: "routine", count: 7 },
        { value: "urgent", count: 2 },
      ],
    },
  };

  it("demande au service chaque dimension comptée de l’écran, et elles seules", () => {
    expect(facetsFor(LIST_FILTERS["admin-examens"])).toEqual([
      "clinic",
      "radiologist",
      "modality",
      "status",
      "priority",
    ]);
    expect(facetsFor(LIST_FILTERS.examens)).not.toContain("clinic");
  });

  it("additionne les statuts de chaque état, et nomme ce qui vient des données", () => {
    const bar = facetDimensions(LIST_FILTERS["admin-examens"], counts, {
      urgency: "Urgences en cours",
    });
    const byKey = Object.fromEntries(bar.map((entry) => [entry.key, entry]));
    expect(byKey.state.options).toEqual([
      { value: "to_assign", count: 2 },
      { value: "reading", count: 3 },
      { value: "ready", count: 3 },
      { value: "delivered", count: 1 },
    ]);
    expect(byKey.state.total).toBe(9);
    expect(byKey.clinic.total).toBe(9);
    expect(byKey.radiologist.options).toEqual([
      { value: "prof-1", label: "Dr Diallo", count: 3 },
    ]);
    // Un examen à attribuer n'a pas de radiologue : « Tous » ne se compte pas.
    expect(byKey.radiologist.total).toBeUndefined();
    // Chaque groupe de modalités, zéro compris, dans l'ordre de l'écran.
    expect(byKey.modality.options?.map((option) => option.count)).toEqual([
      0, 0, 0, 6, 3, 0,
    ]);
    expect(byKey.urgency.label).toBe("Urgences en cours");
    expect(byKey.period.options?.map((option) => option.value)).toEqual([
      "1",
      "7",
      "30",
      "90",
      "365",
    ]);
  });
});
