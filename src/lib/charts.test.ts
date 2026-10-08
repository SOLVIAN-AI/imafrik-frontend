import { describe, expect, it } from "vitest";

import {
  axisTicks,
  chunk,
  labelIndices,
  niceMax,
  quantile,
  weightedMean,
} from "@/lib/charts";

describe("niceMax", () => {
  it.each([
    [0, 1],
    [1, 1],
    [47, 50],
    [101, 200],
    [0.3, 0.5],
    [240, 250],
  ])("%d → %d", (value, expected) => {
    expect(niceMax(value)).toBe(expected);
  });
});

describe("labelIndices", () => {
  it("garde tout quand c'est court", () => {
    expect(labelIndices(3, 6)).toEqual([0, 1, 2]);
  });
  it("garde la première et la dernière", () => {
    const indices = labelIndices(30, 5);
    expect(indices[0]).toBe(0);
    expect(indices.at(-1)).toBe(29);
    expect(indices).toHaveLength(5);
  });
});

describe("quantile", () => {
  it("médiane et 90e centile", () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(
      quantile([10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 0.9),
    ).toBeCloseTo(91);
    expect(quantile([], 0.5)).toBeNull();
  });
});

describe("chunk", () => {
  it("regroupe par paquets et garde le dernier, incomplet", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 7)).toEqual([]);
    expect(chunk([1, 2], 0)).toEqual([[1], [2]]);
  });
});

describe("weightedMean", () => {
  it("pondère et ignore les valeurs absentes", () => {
    expect(
      weightedMean([
        [10, 1],
        [20, 3],
      ]),
    ).toBe(17.5);
    expect(
      weightedMean([
        [null, 5],
        [8, 2],
      ]),
    ).toBe(8);
    expect(
      weightedMean([
        [null, 1],
        [4, 0],
      ]),
    ).toBeNull();
  });
});

describe("axisTicks", () => {
  it("découpe un comptage en graduations rondes", () => {
    expect(axisTicks(47)).toEqual([0, 10, 20, 30, 40, 50]);
    expect(axisTicks(90)).toEqual([0, 25, 50, 75, 100]);
    expect(axisTicks(18)).toEqual([0, 5, 10, 15, 20]);
    expect(axisTicks(230)).toEqual([0, 50, 100, 150, 200, 250]);
  });

  it("n'invente pas de demi-examen", () => {
    expect(axisTicks(2)).toEqual([0, 1, 2]);
    expect(axisTicks(1)).toEqual([0, 1]);
    expect(axisTicks(0)).toEqual([0, 1]);
  });

  it("gradue les durées en pas lisibles", () => {
    expect(axisTicks(130, "minutes")).toEqual([0, 30, 60, 90, 120, 150]);
    expect(axisTicks(40, "minutes")).toEqual([0, 10, 20, 30, 40]);
    expect(axisTicks(400, "minutes")).toEqual([0, 120, 240, 360, 480]);
    expect(axisTicks(0, "minutes")).toEqual([0, 5, 10]);
  });
});
