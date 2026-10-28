import { describe, expect, it } from "vitest";

import {
  EDGE,
  GAP,
  SPOTLIGHT_PADDING,
  isCrowded,
  isInView,
  isUsableBox,
  placeBubble,
  spotlight,
} from "@/components/tour/geometry";

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 375, height: 812 };
const BUBBLE = { width: 320, height: 180 };

describe("placeBubble", () => {
  it("pose la bulle sous l'élément, centrée, quand la place le permet", () => {
    const target = { top: 100, left: 600, width: 200, height: 40 };
    const position = placeBubble(target, BUBBLE, DESKTOP, "bottom");
    expect(position.placement).toBe("bottom");
    expect(position.top).toBe(100 + 40 + SPOTLIGHT_PADDING + GAP);
    expect(position.left).toBe(700 - BUBBLE.width / 2);
  });

  it("passe au-dessus quand le bas de la fenêtre manque", () => {
    const target = { top: 800, left: 600, width: 200, height: 40 };
    expect(placeBubble(target, BUBBLE, DESKTOP, "bottom").placement).toBe(
      "top",
    );
  });

  it("pose la bulle à droite d'une entrée de la barre latérale", () => {
    const target = { top: 200, left: 8, width: 200, height: 36 };
    const position = placeBubble(target, BUBBLE, DESKTOP, "right");
    expect(position.placement).toBe("right");
    expect(position.left).toBe(8 + 200 + SPOTLIGHT_PADDING + GAP);
  });

  it("reste dans la fenêtre d'un téléphone, même pour un élément au bord", () => {
    const target = { top: 20, left: 330, width: 40, height: 40 };
    const position = placeBubble(target, BUBBLE, PHONE, "bottom");
    expect(position.left).toBeGreaterThanOrEqual(EDGE);
    expect(position.left + BUBBLE.width).toBeLessThanOrEqual(
      PHONE.width - EDGE,
    );
    expect(position.top).toBeGreaterThanOrEqual(EDGE);
  });

  it("se pose en bas de la fenêtre quand l'élément occupe tout l'écran", () => {
    const target = {
      top: 0,
      left: 0,
      width: PHONE.width,
      height: PHONE.height,
    };
    const position = placeBubble(target, BUBBLE, PHONE, "right");
    expect(position.top).toBe(PHONE.height - BUBBLE.height - EDGE);
  });

  it("centre la bulle d'une étape sans élément", () => {
    const position = placeBubble(null, BUBBLE, DESKTOP);
    expect(position.placement).toBe("center");
    expect(position.left).toBe((DESKTOP.width - BUBBLE.width) / 2);
    expect(position.top).toBe((DESKTOP.height - BUBBLE.height) / 2);
  });

  it("ne déborde pas d'une fenêtre plus étroite que la bulle", () => {
    const narrow = { width: 300, height: 600 };
    const position = placeBubble(null, BUBBLE, narrow);
    expect(position.left).toBe(EDGE);
  });
});

describe("spotlight", () => {
  it("élargit la zone d'une marge sans sortir de la fenêtre", () => {
    expect(
      spotlight({ top: 2, left: 2, width: 100, height: 20 }, DESKTOP),
    ).toEqual({
      top: 0,
      left: 0,
      width: 2 + 100 + SPOTLIGHT_PADDING,
      height: 2 + 20 + SPOTLIGHT_PADDING,
    });
  });
});

describe("repères", () => {
  it("écarte un élément masqué, de taille nulle", () => {
    expect(isUsableBox(null)).toBe(false);
    expect(isUsableBox({ top: 0, left: 0, width: 0, height: 0 })).toBe(false);
    expect(isUsableBox({ top: 0, left: 0, width: 10, height: 10 })).toBe(true);
  });

  it("sait si l'élément est entièrement à l'écran", () => {
    expect(
      isInView({ top: 10, left: 10, width: 100, height: 100 }, DESKTOP),
    ).toBe(true);
    expect(
      isInView({ top: 850, left: 10, width: 100, height: 100 }, DESKTOP),
    ).toBe(false);
  });
});

describe("isCrowded", () => {
  it("dit qu'un élément au milieu d'un téléphone ne laisse aucune place à la bulle", () => {
    // Une file de cinq examens, visible en entier, au milieu de l'écran.
    const file = { top: 140, left: 12, width: 351, height: 480 };
    expect(isInView(file, PHONE)).toBe(true);
    expect(isCrowded(file, BUBBLE, PHONE)).toBe(true);
  });

  it("laisse en place un élément qui a la bulle au-dessous ou à côté", () => {
    expect(
      isCrowded({ top: 20, left: 12, width: 351, height: 400 }, BUBBLE, PHONE),
    ).toBe(false);
    expect(
      isCrowded(
        { top: 300, left: 40, width: 400, height: 500 },
        BUBBLE,
        DESKTOP,
      ),
    ).toBe(false);
  });

  it("laisse en place un élément trop haut pour tenir avec la bulle", () => {
    expect(
      isCrowded({ top: 0, left: 0, width: 375, height: 700 }, BUBBLE, PHONE),
    ).toBe(false);
  });
});
