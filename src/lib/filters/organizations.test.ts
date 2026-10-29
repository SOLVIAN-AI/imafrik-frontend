import { describe, expect, it } from "vitest";

import { linkOf, SILENT_AFTER_MS } from "@/lib/filters/organizations";

const NOW = Date.parse("2026-10-29T12:00:00Z");

describe("raccordement d’une organisation", () => {
  it("dit si une clinique est raccordée, et silencieuse au-delà de 24 h", () => {
    const clinique = { kind: "clinic" as const, connected: true };
    expect(
      linkOf({ ...clinique, lastReceivedAt: new Date(NOW - 3_600_000) }, NOW),
    ).toEqual(["connected"]);
    expect(
      linkOf(
        { ...clinique, lastReceivedAt: new Date(NOW - SILENT_AFTER_MS - 1) },
        NOW,
      ),
    ).toEqual(["connected", "silent"]);
    // Raccordée mais jamais rien reçu : silencieuse aussi.
    expect(linkOf({ ...clinique, lastReceivedAt: null }, NOW)).toEqual([
      "connected",
      "silent",
    ]);
    expect(
      linkOf({ kind: "clinic", connected: false, lastReceivedAt: null }, NOW),
    ).toEqual(["not_connected"]);
  });

  it("un groupe de radiologie n’a pas de raccordement", () => {
    expect(
      linkOf(
        { kind: "radiology_group", connected: false, lastReceivedAt: null },
        NOW,
      ),
    ).toEqual([]);
  });
});
