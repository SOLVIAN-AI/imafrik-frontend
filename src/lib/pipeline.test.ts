import { describe, expect, it } from "vitest";

import { type FlowInstants, segments, throughput } from "@/lib/pipeline";

const at = (minute: number) => new Date(Date.UTC(2026, 9, 7, 8, minute));

const base: FlowInstants = {
  acquiredAt: at(0),
  firstInstanceAt: at(3),
  lastInstanceAt: at(5),
  receivedAt: at(6),
  claimedAt: null,
  signedAt: null,
  deliveredAt: null,
  transferBytes: 120 * 1_048_576,
};

describe("segments", () => {
  it("compte l'étape en cours jusqu'à maintenant", () => {
    expect(segments(base, at(36))).toEqual([
      { key: "arrival", minutes: 5, ongoing: false },
      { key: "queue", minutes: 30, ongoing: true },
    ]);
  });

  it("enchaîne toutes les étapes d'un examen remis", () => {
    const done = {
      ...base,
      claimedAt: at(16),
      signedAt: at(36),
      deliveredAt: at(50),
    };
    expect(
      segments(done, at(59)).map((s) => [s.key, s.minutes, s.ongoing]),
    ).toEqual([
      ["arrival", 5, false],
      ["queue", 10, false],
      ["reading", 20, false],
      ["delivery", 14, false],
    ]);
  });

  it("omet une étape dont le début est inconnu", () => {
    const keys = segments({ ...base, acquiredAt: null }, at(10)).map(
      (s) => s.key,
    );
    expect(keys).toEqual(["queue"]);
  });
});

describe("throughput", () => {
  it("mesure le débit entre la première et la dernière image", () => {
    expect(throughput(base)).toBe(1);
  });

  it("refuse une fenêtre trop courte ou un volume absent", () => {
    expect(throughput({ ...base, lastInstanceAt: base.firstInstanceAt })).toBe(
      null,
    );
    expect(throughput({ ...base, transferBytes: null })).toBeNull();
  });
});
