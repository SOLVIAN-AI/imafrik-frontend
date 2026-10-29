import type { Page } from "@playwright/test";

import { expect, test, type DemoMembership } from "./support/fixtures";

/**
 * Une page chargée en entier s'hydrate sur le rendu du serveur, et
 * n'existe qu'une fois dans le document.
 *
 * Au chargement complet, `loading.tsx` s'affiche d'abord, et la page
 * arrive ensuite en flux : React l'écrit dans un `<div hidden id="S:…">`
 * en fin de document, puis la met à sa place. Depuis React 19.2, ce
 * dévoilement attend un minuteur, jusqu'à 300 ms après le premier
 * affichage. Si un contexte placé au-dessus des pages change de valeur
 * pendant cette attente, React renonce à hydrater la page et la
 * reconstruit côté client : le rendu du serveur est jeté, et la page
 * existe deux fois jusqu'au dévoilement. C'est arrivé avec next-themes
 * (`hooks/use-theme.ts`), sur tout poste dont le système n'avait pas le
 * thème de l'application ; la CI tombait au hasard sur « strict mode
 * violation … resolved to 2 elements ».
 *
 * Sur une machine rapide, le dévoilement passe d'ordinaire avant
 * l'hydratation, et la course est rare. Ce test la rend systématique : il
 * retient le dévoilement, attend que la page soit hydratée et que ses
 * effets de montage soient passés, puis le déclenche lui-même. Une page
 * saine attend, puis s'hydrate sur les nœuds du serveur : le segment caché
 * se vide dans la page. Une page reconstruite laisse le segment plein,
 * jeté sans avoir servi, et la garde des fixtures voit deux `<h1>`.
 *
 * Le test emploie trois noms du script de dévoilement de React : `$RT`
 * (instant du premier affichage, d'après lequel le minuteur est réglé),
 * `$RB` (frontières en attente) et `$RV` (leur dévoilement). Si React les
 * change, les préalables vérifiés ci-dessous le disent.
 */

/** Script de page : retient le dévoilement et suit les segments streamés. */
function holdReveal() {
  // Premier affichage déclaré dans une minute : le minuteur de dévoilement
  // ne partira pas pendant le test. L'écriture de React est ignorée.
  const late = performance.now() + 60_000;
  Object.defineProperty(window, "$RT", {
    configurable: true,
    get: () => late,
    set: () => undefined,
  });
  const segments: HTMLElement[] = [];
  (
    window as unknown as { __imafrikSegments: HTMLElement[] }
  ).__imafrikSegments = segments;
  new MutationObserver((records) => {
    for (const record of records)
      for (const node of record.addedNodes)
        if (node instanceof HTMLElement && node.hidden && /^S:/.test(node.id))
          segments.push(node);
  }).observe(document, { childList: true, subtree: true });
}

/** État des segments streamés depuis le chargement. */
function segments(page: Page) {
  return page.evaluate(() => {
    const all = (window as unknown as { __imafrikSegments: HTMLElement[] })
      .__imafrikSegments;
    return {
      streamed: all.length,
      // Encore dans le document : en attente de dévoilement.
      pending: all.filter((segment) => segment.isConnected).length,
      // Sorti du document sans s'être vidé dans la page : jeté.
      thrown: all.filter(
        (segment) => !segment.isConnected && segment.childNodes.length > 0,
      ).length,
    };
  });
}

/** Attend que le fil principal soit au repos : rendus et effets passés. */
function idle(page: Page) {
  return page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestIdleCallback(() => resolve(), { timeout: 5_000 }),
      ),
  );
}

/** Un écran de chaque portail, arrivé en flux derrière `loading.tsx`. */
const PAGES: { membership: DemoMembership; path: string }[] = [
  { membership: "m-radio", path: "/worklist" },
  { membership: "m-clinic", path: "/tableau-de-bord" },
  { membership: "m-admin", path: "/admin/organisations/org-stj" },
];

/** Écarts entre le thème du système et celui de l'application. */
const GAPS = [
  { name: "système clair, application sombre", system: "light", app: null },
  { name: "système sombre, application claire", system: "dark", app: "light" },
] as const;

for (const gap of GAPS) {
  test.describe(gap.name, () => {
    test.use({ colorScheme: gap.system, theme: gap.app });

    for (const { membership, path } of PAGES) {
      test.describe(`portail ${membership}`, () => {
        test.use({ membership });

        test(`${path} s'hydrate sur le rendu du serveur`, async ({ page }) => {
          await page.addInitScript(holdReveal);
          await page.goto(path);
          // Le bouton de thème prend son intitulé à l'hydratation
          // (`useHydrated`) ; le repos laisse passer les effets du montage.
          await expect(
            page.getByRole("button", { name: /^Passer en thème/ }),
          ).toBeVisible();
          await idle(page);

          const before = await segments(page);
          expect(
            before.streamed,
            "Aucune page arrivée en flux : ce test ne vérifie plus rien.",
          ).toBeGreaterThan(0);
          expect(
            before.pending,
            "Page dévoilée avant l'hydratation : le dévoilement n'est plus retenu (`$RT`).",
          ).toBeGreaterThan(0);

          // Le dévoilement que le minuteur aurait lancé.
          await page.evaluate(() => {
            const fizz = window as unknown as {
              $RV: (batch: unknown[]) => void;
              $RB: unknown[];
            };
            fizz.$RV(fizz.$RB);
          });
          await expect.poll(async () => (await segments(page)).pending).toBe(0);
          await idle(page);

          expect(
            (await segments(page)).thrown,
            "Rendu du serveur jeté : la page a été reconstruite côté client.",
          ).toBe(0);
          await expect(page.locator("#contenu h1")).toHaveCount(1);
        });
      });
    }
  });
}
