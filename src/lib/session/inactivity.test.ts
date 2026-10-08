import { describe, expect, it } from "vitest";

import {
  IDLE_MINUTES,
  READING_IDLE_MINUTES,
  parseActivity,
  phaseOf,
  remainingMs,
} from "@/lib/session/inactivity";

const MIN = 60_000;

describe("verrouillage après inactivité", () => {
  it("verrouille après le délai, prévient une minute avant", () => {
    const start = 1_000_000;
    expect(phaseOf(remainingMs(start + 10 * MIN, start, false))).toBe("active");
    expect(phaseOf(remainingMs(start + 14.5 * MIN, start, false))).toBe(
      "warning",
    );
    expect(phaseOf(remainingMs(start + IDLE_MINUTES * MIN, start, false))).toBe(
      "locked",
    );
  });

  it("laisse plus de temps quand on lit les images, sans devenir infini", () => {
    const start = 0;
    expect(phaseOf(remainingMs(20 * MIN, start, true))).toBe("active");
    expect(phaseOf(remainingMs(READING_IDLE_MINUTES * MIN, start, true))).toBe(
      "locked",
    );
  });

  it("ignore une activité partagée absente, illisible ou dans le futur", () => {
    const now = 10 * MIN;
    expect(parseActivity(null, 5 * MIN, now)).toBe(5 * MIN);
    expect(parseActivity("abc", 5 * MIN, now)).toBe(5 * MIN);
    expect(parseActivity(String(99 * MIN), 5 * MIN, now)).toBe(5 * MIN);
    expect(parseActivity(String(8 * MIN), 5 * MIN, now)).toBe(8 * MIN);
    // Une activité plus ancienne d'un autre onglet ne recule pas l'horloge.
    expect(parseActivity(String(2 * MIN), 5 * MIN, now)).toBe(5 * MIN);
  });
});
