import { describe, expect, it } from "vitest";

import {
  demoAnalytics,
  demoBilling,
  demoClinic,
  demoContactRequests,
  demoOverview,
  demoPipeline,
  demoSystem,
  demoUsers,
  credentialReviewDue,
} from "@/lib/demo/control";
import { DEMO_STUDIES } from "@/lib/demo/studies";

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

  it("montre au cockpit la file que voient les radiologues", () => {
    // Le jeu d'examens est daté depuis le chargement du module : l'instant
    // présent est donc le vrai, pas l'instant fixe des autres tests.
    const now = Date.now();
    const { live } = demoOverview(now);
    const open = DEMO_STUDIES.filter(
      (s) => s.status === "received" || s.status === "in_progress",
    );
    const waiting = open.filter((s) => s.assignedTo === null);
    expect(live.waiting).toBe(waiting.length);
    expect(live.waiting).toBeGreaterThan(0);
    expect(live.urgent_waiting).toBe(waiting.filter((s) => s.urgent).length);
    expect(live.in_progress).toBe(open.length - waiting.length);
    // La radiographie de Kara attend depuis plus de cinq heures : la file
    // la montre en retard, le cockpit aussi.
    expect(live.routine_overdue).toBe(
      open.filter((s) => !s.urgent && s.dueAt.getTime() < now).length,
    );
    expect(live.routine_overdue).toBeGreaterThan(0);
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

  it("rédige ses textes dans la langue demandée, sans toucher aux données", () => {
    const fr = demoOverview(NOW, "fr");
    const en = demoOverview(NOW, "en");
    // Mêmes chiffres, mêmes alertes : seuls les messages changent.
    expect(en.live).toEqual(fr.live);
    expect(en.alerts.map((a) => a.code)).toEqual(fr.alerts.map((a) => a.code));
    const silent = en.alerts.find((a) => a.code === "clinic_silent")!;
    expect(silent.message).toContain("Clinique du Golfe");
    expect(silent.message).toContain("has sent nothing");
    expect(en.ops.find((r) => r.kind === "backup")!.summary).toContain(
      "encrypted",
    );
    expect(demoSystem(NOW, "en").environment).toBe("demo");
    const steps = demoClinic("org-esp", NOW, "en")!.onboarding;
    expect(steps[0]).toMatchObject({
      key: "created",
      label: "Organisation created",
    });
    expect(demoClinic("org-esp", NOW)!.onboarding[0].label).toBe(
      "Organisation créée",
    );
  });
});

describe("dossiers à examiner en démonstration", () => {
  it("signale au cockpit les justificatifs en attente", () => {
    const unverified = demoUsers(NOW).filter(credentialReviewDue);
    const names = unverified.map((user) => user.full_name);
    // Un justificatif en attente : c'est ce que la pastille « À valider »
    // des lignes affiche, et ce que l'équipe IMAFRIK peut examiner.
    expect(names).toContain("Kossi Amegah");
    for (const user of unverified) {
      expect(user.credential_state).toBe("pending");
      expect(user.credentials_verified_at).toBeFalsy();
    }
    // Dossier incomplet : rien à examiner, hors du compte.
    expect(names).not.toContain("Afi Lawson");
    const alert = demoOverview(NOW).alerts.find(
      (candidate) => candidate.code === "unverified_radiologists",
    );
    expect(alert?.href).toBe("/admin/utilisateurs?validation=attente");
    expect(alert?.message).toContain(String(unverified.length));
    // Le compte des demandes nouvelles du cockpit suit la liste.
    expect(demoOverview(NOW).network.new_requests).toBe(
      demoContactRequests(NOW).filter((request) => request.status === "new")
        .length,
    );
  });
});
