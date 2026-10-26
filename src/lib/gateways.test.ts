import { describe, expect, it } from "vitest";

import {
  GATEWAY_STATUSES,
  availableActions,
  certificateState,
  demoEnrollmentCode,
  formatCountdown,
  groupCycles,
  groupFingerprint,
  heartbeatFreshness,
  isGatewayStatus,
  reasonProblem,
  secondsLeft,
  shortFingerprint,
  statusTone,
} from "@/lib/gateways";

const FINGERPRINT =
  "3f2504e04f8911d39a0c0305e82c33013f2504e04f8911d39a0c0305e82c3301";

describe("gestes proposés selon le statut", () => {
  it("suit le tableau de transitions de la base", () => {
    expect(availableActions("awaiting_approval")).toEqual([
      "approve",
      "reject",
    ]);
    expect(availableActions("pending")).toEqual(["reject", "revoke"]);
    expect(availableActions("active")).toEqual(["renew", "suspend", "revoke"]);
    expect(availableActions("suspended")).toEqual([
      "resume",
      "renew",
      "revoke",
    ]);
  });

  it("ne propose plus rien après un rejet ou une révocation", () => {
    expect(availableActions("rejected")).toEqual([]);
    expect(availableActions("revoked")).toEqual([]);
  });

  it("n’approuve jamais une passerelle déjà approuvée", () => {
    for (const status of GATEWAY_STATUSES.filter(
      (s) => s !== "awaiting_approval",
    )) {
      expect(availableActions(status)).not.toContain("approve");
    }
  });
});

describe("motif d’un geste", () => {
  it("exige de trois à cinq cents caractères, espaces de bord retirés", () => {
    expect(reasonProblem("Poste volé")).toBeNull();
    expect(reasonProblem("  ab  ")).toBe("short");
    expect(reasonProblem("   ")).toBe("short");
    expect(reasonProblem("x".repeat(500))).toBeNull();
    expect(reasonProblem("x".repeat(501))).toBe("long");
  });
});

describe("statuts", () => {
  it("reconnaît les seuls statuts du service", () => {
    expect(isGatewayStatus("active")).toBe(true);
    expect(isGatewayStatus("toString")).toBe(false);
    expect(isGatewayStatus(undefined)).toBe(false);
  });

  it("colore ce qui envoie, ce qui attend, ce qui est refusé", () => {
    expect(statusTone("active")).toBe("done");
    expect(statusTone("awaiting_approval")).toBe("progress");
    expect(statusTone("suspended")).toBe("urgent");
    expect(statusTone("revoked")).toBe("neutral");
  });
});

describe("empreintes", () => {
  it("se lisent par groupes de quatre", () => {
    expect(groupFingerprint(FINGERPRINT).split(" ")).toHaveLength(16);
    expect(groupFingerprint(FINGERPRINT).replaceAll(" ", "")).toBe(FINGERPRINT);
  });

  it("s’abrègent à douze signes dans une liste", () => {
    expect(shortFingerprint(FINGERPRINT)).toBe("3f25 04e0 4f89…");
  });
});

describe("compte à rebours d’un code", () => {
  const now = Date.UTC(2026, 9, 26, 12, 0, 0);

  it("compte les secondes restantes, jamais en dessous de zéro", () => {
    expect(secondsLeft(new Date(now + 15 * 60_000), now)).toBe(900);
    expect(secondsLeft(new Date(now + 1_500), now)).toBe(2);
    expect(secondsLeft(new Date(now - 60_000), now)).toBe(0);
  });

  it("s’affiche en minutes et secondes", () => {
    expect(formatCountdown(900)).toBe("15:00");
    expect(formatCountdown(61)).toBe("01:01");
    expect(formatCountdown(0)).toBe("00:00");
    expect(formatCountdown(-5)).toBe("00:00");
  });
});

describe("signal de vie", () => {
  const now = Date.UTC(2026, 9, 26, 12, 0, 0);

  it("signale un silence de plus de trente minutes", () => {
    expect(heartbeatFreshness(null, now)).toBe("never");
    expect(heartbeatFreshness(new Date(now - 29 * 60_000), now)).toBe("fresh");
    expect(heartbeatFreshness(new Date(now - 31 * 60_000), now)).toBe("stale");
  });
});

describe("état d’un certificat", () => {
  const date = new Date(Date.UTC(2026, 9, 26));

  it("distingue retiré, chevauchement, en vigueur et en attente", () => {
    expect(
      certificateState({ appliedAt: date, retireAfter: null, retiredAt: date }),
    ).toBe("retired");
    expect(
      certificateState({ appliedAt: date, retireAfter: date, retiredAt: null }),
    ).toBe("overlap");
    expect(
      certificateState({ appliedAt: date, retireAfter: null, retiredAt: null }),
    ).toBe("inForce");
    expect(
      certificateState({ appliedAt: null, retireAfter: null, retiredAt: null }),
    ).toBe("waiting");
  });
});

describe("code de démonstration", () => {
  it("a la forme exacte d’un vrai code, sans signe ambigu", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(demoEnrollmentCode()).toMatch(
        /^IMF(-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}){4}$/,
      );
    }
  });
});

describe("cycles marquants de la tâche d’hôte", () => {
  const refus = (minute: number) => ({
    reportedAt: new Date(
      `2026-10-26T23:${String(minute).padStart(2, "0")}:00Z`,
    ),
    outcome: "refused" as const,
    restarted: false,
    added: 0,
    removed: 0,
    error:
      "1 certificat(s) accepté(s) aujourd'hui par le PACS sont inconnus de la base",
  });

  it("réunit un refus qui dure en une ligne, avec sa première date", () => {
    const groups = groupCycles([refus(39), refus(38), refus(37), refus(34)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(4);
    expect(groups[0].reportedAt).toEqual(refus(39).reportedAt);
    expect(groups[0].firstAt).toEqual(refus(34).reportedAt);
  });

  it("sépare des refus dont l’erreur diffère", () => {
    const autre = {
      ...refus(38),
      error: "trusted-clients.pem actuel illisible",
    };
    expect(
      groupCycles([refus(39), autre, refus(37)]).map((g) => g.count),
    ).toEqual([1, 1, 1]);
  });

  it("laisse chaque cycle appliqué seul : chacun a changé la confiance", () => {
    const applique = (minute: number) => ({
      ...refus(minute),
      outcome: "applied" as const,
      added: 1,
      error: null,
    });
    const groups = groupCycles([
      applique(40),
      applique(39),
      refus(38),
      refus(37),
    ]);
    expect(groups.map((g) => [g.outcome, g.count])).toEqual([
      ["applied", 1],
      ["applied", 1],
      ["refused", 2],
    ]);
  });

  it("rend une liste vide pour aucun cycle", () => {
    expect(groupCycles([])).toEqual([]);
  });
});
