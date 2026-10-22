import { describe, expect, it } from "vitest";

import {
  ACTS,
  ACT_COUNT,
  FRAME_COUNT,
  actAt,
  actEnd,
  actProgress,
  clamp01,
  frameAt,
  routePoint,
  segment,
  typedLength,
} from "@/components/marketing/journey/timeline";
import { KARA, LOME } from "@/components/marketing/journey/togo";

describe("chorégraphie du parcours", () => {
  it("couvre tout l'avancement, sans trou ni chevauchement", () => {
    expect(ACTS).toHaveLength(ACT_COUNT);
    expect(ACTS[0][0]).toBe(0);
    expect(ACTS.at(-1)?.[1]).toBe(1);
    for (let index = 1; index < ACTS.length; index += 1) {
      expect(ACTS[index][0]).toBe(ACTS[index - 1][1]);
      expect(ACTS[index][1]).toBeGreaterThan(ACTS[index][0]);
    }
  });

  it("dit l'acte en cours, bornes comprises", () => {
    expect(actAt(0)).toBe(0);
    expect(actAt(ACTS[1][0])).toBe(1);
    expect(actAt(0.6)).toBe(2);
    expect(actAt(1)).toBe(3);
    expect(actAt(-1)).toBe(0);
    expect(actAt(Number.NaN)).toBe(0);
  });

  it("montre chaque acte achevé sans déborder sur le suivant", () => {
    for (let act = 0; act < ACT_COUNT; act += 1) {
      expect(actAt(actEnd(act))).toBe(act);
      expect(actProgress(actEnd(act), act)).toBeGreaterThan(0.95);
    }
  });

  it("borne les avancements locaux", () => {
    expect(segment(0.1, 0.2, 0.4)).toBe(0);
    expect(segment(0.3, 0.2, 0.4)).toBeCloseTo(0.5);
    expect(segment(0.9, 0.2, 0.4)).toBe(1);
    expect(clamp01(2)).toBe(1);
  });

  it("parcourt la pile, puis revient sur le nodule à la fin de la lecture", () => {
    const [start, end] = ACTS[2];
    expect(frameAt(start)).toBe(0);
    const frames = Array.from({ length: 101 }, (_, i) =>
      frameAt(start + ((end - start) * i) / 100),
    );
    expect(Math.max(...frames)).toBe(FRAME_COUNT - 1);
    expect(frameAt(end)).toBe(13);
    expect(frames.every((frame) => frame >= 0 && frame < FRAME_COUNT)).toBe(
      true,
    );
  });

  it("relie Kara à Lomé", () => {
    expect(routePoint(0, KARA, LOME)).toEqual({ x: KARA.x, y: KARA.y });
    expect(routePoint(1, KARA, LOME)).toEqual({ x: LOME.x, y: LOME.y });
    // Infléchi vers l'est, à l'intérieur du pays.
    expect(routePoint(0.5, KARA, LOME).x).toBeGreaterThan(
      Math.max(KARA.x, LOME.x),
    );
  });

  it("écrit la conclusion progressivement", () => {
    const text = "Nodule pulmonaire gauche de 27 mm.";
    expect(typedLength(text, 0)).toBe(0);
    expect(typedLength(text, 1)).toBe(text.length);
    expect(typedLength(text, 0.5)).toBe(Math.round(text.length / 2));
  });
});
