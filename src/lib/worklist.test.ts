import { describe, expect, it } from "vitest";

import type { Study } from "@/lib/data/studies";
import {
  applyFilters,
  byDeadline,
  deadlineOf,
  filterOptions,
  filtersToQuery,
  formatDuration,
  hasFilters,
  newUrgentArrivals,
  NO_FILTERS,
  parseFilters,
  shortDemographics,
  splitWorklist,
} from "@/lib/worklist";

const MINUTE = 60_000;
const NOW = Date.UTC(2026, 9, 7, 12, 0);

/** Examen minimal : reçu il y a `ago` minutes, avec un délai de `sla` minutes. */
function study(
  id: string,
  {
    ago = 10,
    sla = 120,
    ...rest
  }: Partial<Study> & { ago?: number; sla?: number } = {},
): Study {
  const receivedAt = new Date(NOW - ago * MINUTE);
  return {
    id,
    studyInstanceUid: `1.2.${id}`,
    patientName: "TEST^Patient",
    patientId: `ID-${id}`,
    patientSex: null,
    patientBirthDate: null,
    modality: "CT",
    bodyPart: null,
    clinicalInfo: null,
    clinic: "Clinique A",
    clinicId: "org-a",
    status: "received",
    urgent: false,
    seriesCount: 1,
    instanceCount: 10,
    receivedAt,
    assignedTo: null,
    assignedToName: null,
    reportId: null,
    reportedAt: null,
    reportedBy: null,
    dueAt: new Date(receivedAt.getTime() + sla * MINUTE),
    reportLanguage: "fr",
    ...rest,
  };
}

describe("formatDuration", () => {
  it("arrondit à ce qui sert", () => {
    expect(formatDuration(12 * MINUTE)).toBe("12 min");
    expect(formatDuration(60 * MINUTE)).toBe("1 h");
    expect(formatDuration(134 * MINUTE)).toBe("2 h 15");
    expect(formatDuration(28 * 60 * MINUTE)).toBe("1 j 4 h");
    expect(formatDuration(48 * 60 * MINUTE)).toBe("2 j");
    expect(formatDuration(-5)).toBe("0 min");
  });

  it("écrit l'unité du jour dans la langue demandée", () => {
    expect(formatDuration(28 * 60 * MINUTE, "en")).toBe("1 d 4 h");
    expect(formatDuration(48 * 60 * MINUTE, "en")).toBe("2 d");
  });
});

describe("deadlineOf", () => {
  it("signale un dépassement", () => {
    const deadline = deadlineOf(study("a", { ago: 300, sla: 120 }), NOW);
    expect(deadline.tone).toBe("overdue");
    expect(deadline.label).toBe("dépassé de 3 h");
  });

  it("libelle l'échéance dans la langue de l'utilisateur", () => {
    expect(
      deadlineOf(study("a", { ago: 300, sla: 120 }), NOW, "en").label,
    ).toBe("overdue by 3 h");
    expect(deadlineOf(study("a", { ago: 95, sla: 120 }), NOW, "en").label).toBe(
      "25 min left",
    );
  });

  it("prévient au dernier quart du délai, quinze minutes au moins", () => {
    // Routine de deux heures : alerte à trente minutes du terme.
    expect(deadlineOf(study("a", { ago: 85, sla: 120 }), NOW).tone).toBe("ok");
    expect(deadlineOf(study("a", { ago: 95, sla: 120 }), NOW)).toMatchObject({
      tone: "soon",
      label: "reste 25 min",
    });
    // Urgence de trente minutes : alerte à quinze minutes du terme.
    expect(deadlineOf(study("a", { ago: 10, sla: 30 }), NOW).tone).toBe("ok");
    expect(deadlineOf(study("a", { ago: 16, sla: 30 }), NOW).tone).toBe("soon");
  });
});

describe("splitWorklist", () => {
  it("sépare les miens, les libres et ceux des confrères, chacun par échéance", () => {
    const sections = splitWorklist(
      [
        study("libre-tard", { ago: 10 }),
        study("confrere", { assignedTo: "autre", assignedToName: "Dr B" }),
        study("libre-urgent", { ago: 5, sla: 30, urgent: true }),
        study("mien", { assignedTo: "moi", status: "in_progress" }),
        study("libre-retard", { ago: 200 }),
      ],
      "moi",
    );
    expect(sections.mine.map((s) => s.id)).toEqual(["mien"]);
    expect(sections.open.map((s) => s.id)).toEqual([
      "libre-retard",
      "libre-urgent",
      "libre-tard",
    ]);
    expect(sections.colleagues.map((s) => s.id)).toEqual(["confrere"]);
  });

  it("départage deux échéances égales par la réception", () => {
    const a = study("a", { ago: 30, sla: 60 });
    const b = study("b", { ago: 60, sla: 90 });
    expect([a, b].sort(byDeadline).map((s) => s.id)).toEqual(["b", "a"]);
  });
});

describe("filtres", () => {
  it("relit l'adresse en ignorant les valeurs mal formées", () => {
    expect(
      parseFilters({
        modalite: ["ct,mr", "<script>"],
        clinique: "org-a",
        urgent: "1",
      }),
    ).toEqual({
      modalities: ["CT", "MR"],
      clinicId: "org-a",
      urgentOnly: true,
    });
    expect(parseFilters({})).toEqual(NO_FILTERS);
    expect(hasFilters(NO_FILTERS)).toBe(false);
  });

  it("se sérialise sans rien de nominatif", () => {
    expect(
      filtersToQuery({
        modalities: ["CT", "MR"],
        clinicId: null,
        urgentOnly: true,
      }),
    ).toBe("modalite=CT%2CMR&urgent=1");
  });

  it("filtre par modalité, clinique et urgence", () => {
    const studies = [
      study("ct-a", { modality: "CT" }),
      study("mr-b", { modality: "MR", clinicId: "org-b", clinic: "B" }),
      study("ct-b-urgent", {
        modality: "CT",
        clinicId: "org-b",
        clinic: "B",
        urgent: true,
      }),
    ];
    const ids = (filters: Partial<typeof NO_FILTERS>) =>
      applyFilters(studies, { ...NO_FILTERS, ...filters }).map((s) => s.id);
    expect(ids({ modalities: ["CT"] })).toEqual(["ct-a", "ct-b-urgent"]);
    expect(ids({ clinicId: "org-b" })).toEqual(["mr-b", "ct-b-urgent"]);
    expect(ids({ urgentOnly: true })).toEqual(["ct-b-urgent"]);
  });

  it("propose les options présentes, les plus fréquentes d'abord", () => {
    const options = filterOptions([
      study("1", { modality: "MR" }),
      study("2", { modality: "CT" }),
      study("3", { modality: "CT", clinicId: "org-b", clinic: "B" }),
    ]);
    expect(options.modalities).toEqual([
      { value: "CT", label: "CT", count: 2 },
      { value: "MR", label: "MR", count: 1 },
    ]);
    expect(options.clinics.map((c) => c.label)).toEqual(["Clinique A", "B"]);
  });
});

describe("shortDemographics", () => {
  it("abrège sexe et âge au jour de la réception", () => {
    expect(
      shortDemographics(
        study("a", { patientSex: "F", patientBirthDate: "1968-03-14" }),
      ),
    ).toBe("F · 58 ans");
    expect(shortDemographics(study("a", { patientSex: "M" }))).toBe("H");
    expect(shortDemographics(study("a"))).toBeNull();
    expect(
      shortDemographics(
        study("a", { patientSex: "M", patientBirthDate: "1968-03-14" }),
        "en",
      ),
    ).toBe("M · 58 years");
  });
});

describe("newUrgentArrivals", () => {
  it("n'alerte pas au premier relevé, puis signale les seules nouvelles urgences", () => {
    const first = newUrgentArrivals(null, [
      study("u1", { urgent: true }),
      study("r1"),
    ]);
    expect(first.arrivals).toEqual([]);

    const second = newUrgentArrivals(first.seen, [
      study("u1", { urgent: true }),
      study("u2", { urgent: true }),
      study("r2"),
    ]);
    expect(second.arrivals.map((s) => s.id)).toEqual(["u2"]);
    expect([...second.seen].sort()).toEqual(["u1", "u2"]);
  });
});
