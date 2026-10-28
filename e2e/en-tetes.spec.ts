import type { Page } from "@playwright/test";

import { type DemoMembership, expect, settle, test } from "./support/fixtures";

/**
 * Aucun intitulé de colonne ne passe à la ligne, dans aucun tableau de
 * l'application (règle commune : `thead th`, `globals.css`).
 *
 * Sur chaque écran principal, à 1280 px, 1440 px et sur téléphone, en
 * français et en anglais : chaque intitulé visible tient sur une ligne et
 * dans sa cellule, et la page ne défile pas en largeur (c'est le tableau
 * qui défile, dans son conteneur).
 */

const SCREENS: Record<DemoMembership, string[]> = {
  "m-admin": [
    "/admin/examens",
    "/admin/organisations",
    "/admin/passerelles",
    "/admin/facturation",
    "/admin/activite?onglet=radiologues",
    "/admin/activite?onglet=cliniques",
    "/worklist",
    "/admin/vue-clinique/org-stj/examens",
    "/admin/vue-clinique/org-stj/activite",
  ],
  "m-clinic": ["/examens", "/activite"],
  "m-radio": ["/worklist", "/mes-examens"],
};

const VIEWPORTS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

/** Intitulés qui passent à la ligne ou débordent de leur cellule. */
async function brokenHeaders(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const broken: string[] = [];
    for (const th of document.querySelectorAll<HTMLElement>("thead th")) {
      const text = th.innerText.trim();
      // Invisible (tableau masqué sur téléphone, texte réservé aux
      // lecteurs d'écran) : rien à mesurer.
      if (!text || th.getClientRects().length === 0) continue;
      const tops: number[] = [];
      const walker = document.createTreeWalker(th, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (rect.width > 0 && rect.height > 0) tops.push(rect.top);
        }
      }
      tops.sort((a, b) => a - b);
      const lines = tops.filter(
        (top, index) => index === 0 || top - tops[index - 1] > 6,
      ).length;
      if (lines > 1) broken.push(`« ${text} » sur ${lines} lignes`);
      else if (th.scrollWidth > th.clientWidth + 1)
        broken.push(`« ${text} » déborde de sa cellule`);
    }
    return broken;
  });
}

test("le contrôle repère un intitulé coupé ou qui déborde", async ({
  page,
}) => {
  await page.setContent(`
    <table style="table-layout: fixed; width: 240px">
      <thead><tr>
        <th style="width: 60px; white-space: normal">Délai médian de lecture</th>
        <th style="width: 60px; white-space: nowrap; overflow: hidden">Prise en charge</th>
        <th>Lecture</th>
      </tr></thead>
    </table>`);
  expect(await brokenHeaders(page)).toEqual([
    expect.stringMatching(/Délai médian de lecture/),
    expect.stringMatching(/Prise en charge.*déborde/),
  ]);
});

for (const langue of ["fr", "en"] as const) {
  for (const viewport of VIEWPORTS) {
    for (const [membership, paths] of Object.entries(SCREENS) as [
      DemoMembership,
      string[],
    ][]) {
      test.describe(`${langue} ${viewport.width}px ${membership}`, () => {
        test.use({ membership, langue, viewport });

        for (const path of paths) {
          test(`${path} : intitulés sur une ligne`, async ({ page }) => {
            await page.goto(path);
            await settle(page);
            expect(await brokenHeaders(page)).toEqual([]);
            const overflow = await page.evaluate(
              () =>
                document.documentElement.scrollWidth -
                document.documentElement.clientWidth,
            );
            expect(overflow, "la page défile en largeur").toBeLessThanOrEqual(
              0,
            );
          });
        }
      });
    }
  }
}
