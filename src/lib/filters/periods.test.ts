import { describe, expect, it } from "vitest";

import { periodsOf } from "@/lib/filters/periods";

const NOW = Date.parse("2026-10-29T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

describe("périodes d’une date", () => {
  it("une date est dans chaque période qui la contient", () => {
    expect(periodsOf(new Date(NOW - 3_600_000), NOW)).toEqual([
      "1",
      "7",
      "30",
      "90",
      "365",
    ]);
    expect(periodsOf(new Date(NOW - 10 * DAY), NOW)).toEqual([
      "30",
      "90",
      "365",
    ]);
    expect(periodsOf(new Date(NOW - 400 * DAY), NOW)).toEqual([]);
  });
});
