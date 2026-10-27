import type { Locator, Page } from "@playwright/test";

import { expect, settle, test } from "./support/fixtures";

/**
 * Visites guidées : la prise en main de chaque écran, à la première
 * ouverture.
 *
 * Un premier venu (`visites: "a-faire"`) voit la visite de son écran
 * d'accueil démarrer seule. Elle se suit au clavier ou à la souris, ne
 * sort jamais de la fenêtre, ne recouvre jamais l'élément qu'elle montre,
 * et ne revient plus une fois faite ou passée. Le bouton d'aide la relance.
 */

test.use({ visites: "a-faire" });

/** Bulle de la visite : une boîte de dialogue nommée par son titre. */
function bubble(page: Page): Locator {
  return page.locator("[data-tour-step]");
}

/** Attend que la bulle soit posée : ni transition ni défilement en cours. */
async function stableBox(page: Page, locator: Locator) {
  await settle(page);
  let previous = await locator.boundingBox();
  await expect
    .poll(async () => {
      const current = await locator.boundingBox();
      const same = JSON.stringify(current) === JSON.stringify(previous);
      previous = current;
      return same;
    })
    .toBe(true);
  return previous!;
}

/**
 * Vérifie la géométrie de l'étape affichée : la bulle tient dans la
 * fenêtre, et ne recouvre pas l'élément mis en lumière.
 */
async function checkPlacement(page: Page) {
  const box = await stableBox(page, bubble(page));
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);

  const ring = page.locator("svg rect.stroke-accent");
  if ((await ring.count()) === 0) return;
  const hole = (await ring.boundingBox())!;
  // Un élément plus grand que l'écran (le volet d'images d'un téléphone)
  // laisse la bulle se poser dessus : c'est le seul cas admis.
  const fits =
    hole.width + box.width < viewport.width ||
    hole.height + box.height < viewport.height;
  if (!fits) return;
  const overlaps =
    box.x < hole.x + hole.width &&
    box.x + box.width > hole.x &&
    box.y < hole.y + hole.height &&
    box.y + box.height > hole.y;
  expect(
    overlaps,
    `La bulle recouvre l'élément montré (étape ${await bubble(page).getAttribute("data-tour-step")})`,
  ).toBe(false);
}

/**
 * Ouvre une adresse sur une horloge simulée, et laisse s'écouler tout le
 * délai où une visite pourrait démarrer : la page posée, puis au-delà des
 * dix secondes où le moteur attend qu'aucune fenêtre ne la couvre. Rien
 * n'est attendu en temps réel : ce qui doit rester absent l'est pour de bon.
 */
async function openPastAutoStart(page: Page, url: string) {
  await page.clock.install();
  await page.goto(url);
  await settle(page);
  await page.clock.runFor(15_000);
}

/** Parcourt la visite ouverte jusqu'au bout, en vérifiant chaque étape. */
async function walkThrough(page: Page) {
  const progress = bubble(page).getByText(/^Étape \d+ sur \d+$/);
  // Le texte du document : l'intitulé s'affiche en capitales.
  const [, first, total] = (await progress.textContent())!.match(
    /^Étape (\d+) sur (\d+)$/,
  )!;
  for (let step = Number(first); step <= Number(total); step += 1) {
    await expect(progress).toHaveText(`Étape ${step} sur ${total}`);
    await checkPlacement(page);
    await bubble(page)
      .getByRole("button", {
        name: step < Number(total) ? "Suivant" : "Terminer",
      })
      .click();
  }
  await expect(bubble(page)).toHaveCount(0);
}

test.describe("radiologue", () => {
  test.use({ membership: "m-radio" });

  test("la visite de la file démarre seule, se suit jusqu'au bout et ne revient plus", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/worklist");
    const dialog = page.getByRole("dialog", { name: "Bienvenue sur IMAFRIK" });
    await expect(dialog).toBeVisible();
    // Le focus est dans la bulle, sur l'action principale.
    await expect(dialog.getByRole("button", { name: "Suivant" })).toBeFocused();
    await stableBox(page, bubble(page));
    await checkA11y();

    await walkThrough(page);
    // Le focus revient au bouton d'aide, d'où la visite se relance.
    await expect(page.getByRole("button", { name: "Aide" })).toBeFocused();

    await openPastAutoStart(page, "/worklist");
    await expect(bubble(page)).toHaveCount(0);
  });

  test("le clavier suffit : flèches, Entrée, Échap ; la page ne réagit pas dessous", async ({
    page,
  }) => {
    await page.goto("/worklist");
    const progress = bubble(page).getByText(/^Étape \d+ sur \d+$/);
    await expect(progress).toHaveText(/^Étape 1 sur/);
    await page.keyboard.press("ArrowRight");
    await expect(progress).toHaveText(/^Étape 2 sur/);
    await page.keyboard.press("Enter");
    await expect(progress).toHaveText(/^Étape 3 sur/);
    await page.keyboard.press("ArrowLeft");
    await expect(progress).toHaveText(/^Étape 2 sur/);
    // « / » ouvre la recherche partout ailleurs : pas sous la visite.
    await page.keyboard.press("/");
    await expect(page.getByRole("dialog")).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(bubble(page)).toHaveCount(0);
    await openPastAutoStart(page, "/worklist");
    await expect(bubble(page)).toHaveCount(0);
  });

  test("le bouton d'aide relance la visite de l'écran, et mène à la formation", async ({
    page,
  }) => {
    await page.goto("/worklist");
    await bubble(page)
      .getByRole("button", { name: "Passer la visite" })
      .click();
    await expect(bubble(page)).toHaveCount(0);

    // L'aide de l'écran : la visite, la formation et l'équipe sont sous
    // « Pour aller plus loin ».
    await page.getByRole("button", { name: "Aide" }).click();
    const aide = page.getByRole("dialog", { name: "Aide" });
    await expect(
      aide.getByRole("link", { name: "Écrire à l’équipe IMAFRIK" }),
    ).toHaveAttribute("href", "mailto:contact@imafrik.tech");
    await aide
      .getByRole("button", { name: "Revoir la visite de cet écran" })
      .click();
    await expect(aide).toBeHidden();
    await expect(
      page.getByRole("dialog", { name: "Bienvenue sur IMAFRIK" }),
    ).toBeVisible();
    await expect(
      bubble(page).getByRole("button", { name: "Suivant" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Aide" }).click();
    await page
      .getByRole("dialog", { name: "Aide" })
      .getByRole("link", { name: "S’exercer dans la formation" })
      .click();
    await expect(page).toHaveURL("/formation");
  });

  test("d'un écran sans visite, l'aide mène à celle de l'accueil", async ({
    page,
  }) => {
    await openPastAutoStart(page, "/mes-examens");
    await expect(bubble(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Aide" }).click();
    await page
      .getByRole("dialog", { name: "Aide" })
      .getByRole("button", { name: "Visite guidée de l’accueil" })
      .click();
    await expect(page).toHaveURL("/worklist");
    await expect(
      page.getByRole("dialog", { name: "Bienvenue sur IMAFRIK" }),
    ).toBeVisible();
  });

  test("l'écran de lecture a sa visite, sur un exercice comme sur un examen", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/formation/irm-foie");
    await expect(
      page.getByRole("dialog", { name: "Les images" }),
    ).toBeVisible();
    await stableBox(page, bubble(page));
    await checkA11y();
    await walkThrough(page);
    // Faite sur un exercice, elle l'est aussi pour les vrais examens.
    await openPastAutoStart(page, "/lecture/1");
    await expect(bubble(page)).toHaveCount(0);
  });

  test.describe("sur téléphone", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("les entrées du tiroir sont montrées par le bouton du menu, et la bulle tient à l'écran", async ({
      page,
    }) => {
      await page.goto("/worklist");
      await expect(bubble(page)).toBeVisible();
      await walkThrough(page);
    });

    test("la visite de lecture tient aussi sur un téléphone", async ({
      page,
    }) => {
      await page.goto("/lecture/1");
      await expect(bubble(page)).toBeVisible();
      await walkThrough(page);
    });
  });
});

test.describe("clinique", () => {
  test.use({ membership: "m-clinic" });

  test("la visite de l'accueil montre l'envoi, le suivi et les comptes-rendus", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/tableau-de-bord");
    await expect(
      page.getByRole("dialog", { name: "Bienvenue sur IMAFRIK" }),
    ).toBeVisible();
    await stableBox(page, bubble(page));
    await checkA11y();
    await bubble(page).getByRole("button", { name: "Suivant" }).click();
    await expect(
      page.getByRole("dialog", { name: "Envoyer un examen" }),
    ).toBeVisible();
    await walkThrough(page);
  });
});

test.describe("équipe IMAFRIK", () => {
  test.use({ membership: "m-admin" });

  test("la visite du cockpit montre les alertes et les écrans à connaître", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(
      page.getByRole("dialog", { name: "La tour de contrôle" }),
    ).toBeVisible();
    await walkThrough(page);

    // L'équipe IMAFRIK n'a pas d'équipe à qui écrire.
    await page.getByRole("button", { name: "Aide" }).click();
    const aide = page.getByRole("dialog", { name: "Aide" });
    await expect(
      aide.getByRole("button", { name: "Revoir la visite de cet écran" }),
    ).toBeVisible();
    await expect(
      aide.getByRole("link", { name: "Écrire à l’équipe IMAFRIK" }),
    ).toHaveCount(0);
  });
});

test.describe("en anglais", () => {
  test.use({ membership: "m-radio", langue: "en" });

  test("la visite parle la langue de l'utilisateur", async ({ page }) => {
    await page.goto("/worklist");
    const dialog = page.getByRole("dialog", { name: "Welcome to IMAFRIK" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/^Step 1 of \d+$/)).toBeVisible();
    await dialog.getByRole("button", { name: "Skip the tour" }).click();
    await expect(dialog).toHaveCount(0);
  });
});
