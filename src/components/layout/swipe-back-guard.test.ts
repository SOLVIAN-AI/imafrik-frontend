// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";

import { blocksSwipeBack } from "@/components/layout/swipe-back-guard";

/**
 * Une cellule dans un tableau large qui défile de côté, dans la page.
 *
 * happy-dom ne met rien en page : les dimensions sont posées à la main.
 */
function wideTable(scrollLeft: number) {
  const table = document.createElement("div");
  table.style.overflowX = "auto";
  Object.defineProperties(table, {
    scrollWidth: { value: 600 },
    clientWidth: { value: 200 },
    scrollLeft: { value: scrollLeft, writable: true },
  });
  const cell = document.createElement("span");
  table.append(cell);
  document.body.append(table);
  return cell;
}

function pageText() {
  const paragraph = document.createElement("p");
  document.body.append(paragraph);
  return paragraph;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("blocksSwipeBack", () => {
  it("annule une molette surtout horizontale, dans les deux sens", () => {
    for (const deltaX of [120, -120]) {
      expect(blocksSwipeBack({ deltaX, deltaY: 0, target: pageText() })).toBe(
        true,
      );
    }
    expect(
      blocksSwipeBack({ deltaX: -100, deltaY: 40, target: pageText() }),
    ).toBe(true);
  });

  it("laisse la molette surtout verticale au défilement de la page", () => {
    expect(
      blocksSwipeBack({ deltaX: 0, deltaY: 120, target: pageText() }),
    ).toBe(false);
    expect(
      blocksSwipeBack({ deltaX: 40, deltaY: 100, target: pageText() }),
    ).toBe(false);
  });

  it("laisse défiler un élément large tant qu'il a de la place de ce côté", () => {
    expect(
      blocksSwipeBack({ deltaX: 120, deltaY: 0, target: wideTable(100) }),
    ).toBe(false);
    expect(
      blocksSwipeBack({ deltaX: -120, deltaY: 0, target: wideTable(100) }),
    ).toBe(false);
  });

  it("annule de nouveau une fois l'élément large au bout", () => {
    expect(
      blocksSwipeBack({ deltaX: 120, deltaY: 0, target: wideTable(400) }),
    ).toBe(true);
    expect(
      blocksSwipeBack({ deltaX: -120, deltaY: 0, target: wideTable(0) }),
    ).toBe(true);
  });

  it("annule quand la cible n'est pas un élément (le document)", () => {
    expect(blocksSwipeBack({ deltaX: 120, deltaY: 0, target: document })).toBe(
      true,
    );
  });
});
