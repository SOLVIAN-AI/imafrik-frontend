import { describe, expect, it } from "vitest";

import {
  demoAnalytics,
  demoBilling,
  demoClinic,
  demoOverview,
  demoPipeline,
} from "@/lib/demo/control";

/** Instant fixe : les tests ne dépendent pas de l'heure de leur exécution. */
const NOW = Date.UTC(2026, 9, 7, 14, 30);

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe("réseau de démonstration", () => {
  it("est reproductible", () => {
    expect(demoAnalytics(30, null, NOW)).toEqual(demoAnalytics(30, null, NOW));
    expect(demoOverview(NOW)).toEqual(demoOverview(NOW));
  });

  it("donne les mêmes totaux sous tous les angles", () => {
    const data = demoAnalytics(30, null, NOW);
    const received = data.totals.received;
    expect(received).toBeGreaterThan(100);
    expect(sum(data.daily.map((d) => d.urgent + d.routine))).toBe(received);
    expect(sum(data.by_clinic.map((c) => c.received))).toBe(received);
    expect(sum(data.by_modality.map((m) => m.received))).toBe(received);
    expect(sum(data.heatmap.flat())).toBe(received);
    expect(sum(data.daily.map((d) => d.urgent))).toBe(data.totals.urgent);
    expect(data.totals.signed).toBeLessThanOrEqual(received);
    expect(sum(data.by_radiologist.map((r) => r.signed))).toBe(
      data.totals.signed,
    );
  });

  it("produit des proportions et des délais plausibles", () => {
    const { sla, stages } = demoAnalytics(90, null, NOW);
    for (const ratio of [sla.within_sla, sla.urgent.within_sla]) {
      expect(ratio).not.toBeNull();
      expect(ratio!).toBeGreaterThanOrEqual(0);
      expect(ratio!).toBeLessThanOrEqual(1);
    }
    expect(sla.urgent.median_minutes!).toBeLessThan(
      sla.routine.median_minutes!,
    );
    expect(stages.transfer!).toBeLessThan(stages.arrival!);
  });

  it("filtre par clinique sans rien inventer", () => {
    const all = demoAnalytics(30, null, NOW);
    const kara = all.by_clinic.find((c) => c.name === "Polyclinique de Kara")!;
    const filtered = demoAnalytics(30, kara.id, NOW);
    expect(filtered.totals.received).toBe(kara.received);
    expect(filtered.by_clinic).toHaveLength(1);
    // La liaison de Kara est la plus lente du réseau : c'est le scénario.
    const rates = all.by_clinic
      .filter((c) => c.median_mb_per_s !== null)
      .map((c) => c.median_mb_per_s!);
    expect(kara.median_mb_per_s).toBe(Math.min(...rates));
  });

  it("met en scène une clinique muette et une clinique en cours de mise en service", () => {
    const overview = demoOverview(NOW);
    expect(overview.alerts.map((a) => a.code)).toContain("clinic_silent");
    const esperance = demoClinic("org-esp", NOW)!;
    const steps = Object.fromEntries(
      esperance.onboarding.map((step) => [step.key, step.done]),
    );
    expect(steps).toMatchObject({
      created: true,
      connected: true,
      first_study: false,
    });
    expect(demoClinic("inconnue", NOW)).toBeNull();
  });

  it("ne date aucun instant dans le futur, ni dans le désordre", () => {
    for (const study of demoPipeline(100, null, NOW)) {
      const instants = [
        study.acquired_at,
        study.first_instance_at,
        study.last_instance_at,
        study.received_at,
        study.claimed_at,
        study.signed_at,
        study.delivered_at,
      ]
        .filter((value): value is string => value !== null)
        .map((value) => Date.parse(value));
      expect(instants).toEqual([...instants].sort((a, b) => a - b));
      expect(Math.max(...instants)).toBeLessThanOrEqual(NOW);
    }
  });

  it("facture le mois en cours jusqu'à maintenant, et pas au-delà", () => {
    const lines = demoBilling("2026-10", NOW);
    const month = demoAnalytics(7, null, NOW);
    expect(sum(lines.map((l) => l.urgent + l.routine))).toBeGreaterThanOrEqual(
      sum(month.daily.map((d) => d.urgent + d.routine)),
    );
    expect(demoBilling("2026-11", NOW)).toEqual([]);
    for (const line of lines) {
      expect(line.reported).toBeLessThanOrEqual(line.urgent + line.routine);
    }
  });
});
