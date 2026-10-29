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
 * violation … resolved to 2 elements ». Puis avec l'aide, ouverte d'un
 * écran qui finissait de se charger (`help/help-context.ts`).
 *
 * Sur une machine rapide, le dévoilement passe d'ordinaire avant
 * l'hydratation, et la course est rare. Ce test la rend systématique : il
 * retient le dévoilement, attend que la page soit hydratée et que ses
 * effets de montage soient passés, puis le déclenche lui-même. Une page
 * saine attend, puis s'hydrate sur les nœuds du serveur : le segment caché
 * se vide dans la page. Une page reconstruite laisse le segment plein,
 * jeté sans avoir servi, et la garde des fixtures voit deux `<h1>`.
 *
 * Le test emploie deux noms du script de dévoilement de React : `$RV`
 * (le dévoilement, que le minuteur appelle) et `$RB` (les frontières en
 * attente). Si React les change, les préalables vérifiés ci-dessous le
 * disent.
 */

/** Script de page : retient le dévoilement et suit les segments streamés. */
function holdReveal() {
  // Le script de React définit `$RV`, puis l'appelle par minuteur ; tant
  // que le test ne l'a pas libéré, l'appel ne fait rien, et les frontières
  // restent dans `$RB`. Aucun délai en jeu : ni le minuteur de 300 ms, ni
  // l'échéance de 2,3 s que React applique aussi.
  type Reveal = (batch: unknown[]) => void;
  let reveal: Reveal | undefined;
  let held = true;
  Object.defineProperty(window, "$RV", {
    configurable: true,
    get: (): Reveal => (batch) => {
      if (!held) reveal?.(batch);
    },
    set: (fn: Reveal) => {
      reveal = fn;
    },
  });
  const release = () => {
    held = false;
    reveal?.((window as unknown as { $RB: unknown[] }).$RB);
  };
  const segments: HTMLElement[] = [];
  Object.assign(window, {
    __imafrikSegments: segments,
    __imafrikRelease: release,
  });
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

/**
 * Charge un écran en retenant son dévoilement, jusqu'à ce qu'il soit
 * hydraté et que ses effets de montage soient passés.
 */
async function loadHeld(page: Page, path: string) {
  await page.addInitScript(holdReveal);
  await page.goto(path);
  // Le bouton de thème prend son intitulé à l'hydratation (`useHydrated`) ;
  // le repos laisse passer les effets du montage.
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
    "Page dévoilée avant l'hydratation : le dévoilement n'est plus retenu (`$RV`).",
  ).toBeGreaterThan(0);
}

/** Dévoile l'écran, et vérifie que le rendu du serveur a servi. */
async function releaseAndCheck(page: Page) {
  await idle(page);
  // Le dévoilement que le minuteur aurait lancé.
  await page.evaluate(() =>
    (window as unknown as { __imafrikRelease: () => void }).__imafrikRelease(),
  );
  await expect.poll(async () => (await segments(page)).pending).toBe(0);
  await idle(page);

  expect(
    (await segments(page)).thrown,
    "Rendu du serveur jeté : la page a été reconstruite côté client.",
  ).toBe(0);
  await expect(page.locator("#contenu h1")).toHaveCount(1);
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
          await loadHeld(page, path);
          await releaseAndCheck(page);
        });
      });
    }
  });
}

/**
 * Un geste fait avant le dévoilement ne reconstruit pas la page : ce
 * qu'il change au-dessus des pages (aide, thème) passe par un abonnement,
 * jamais par un contexte qui changerait de valeur.
 */
test.describe("geste pendant le chargement", () => {
  test.use({ membership: "m-admin" });

  test("ouvrir l’aide", async ({ page }) => {
    await loadHeld(page, "/admin/passerelles");
    await page.keyboard.press("?");
    await expect(page.getByRole("dialog", { name: "Aide" })).toBeVisible();
    await releaseAndCheck(page);
  });

  test("basculer le thème", async ({ page }) => {
    await loadHeld(page, "/admin/passerelles");
    await page.getByRole("button", { name: "Passer en thème clair" }).click();
    await expect(
      page.getByRole("button", { name: "Passer en thème sombre" }),
    ).toBeVisible();
    await releaseAndCheck(page);
  });
});
