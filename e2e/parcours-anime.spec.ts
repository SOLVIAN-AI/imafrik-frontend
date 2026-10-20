import { expect, test } from "./support/fixtures";

/**
 * Aperçu de l'accueil avec le parcours animé (`/apercu/parcours`).
 *
 * Page à valider avant sa mise en ligne : elle ne s'annonce pas aux
 * moteurs, et le parcours s'y lit dans les trois cas qu'il sert, défilé
 * sur grand écran, joué carte par carte sur téléphone, figé quand on a
 * demandé moins de mouvement.
 */

const PREVIEWS = [
  {
    langue: "fr",
    path: "/apercu/parcours",
    titre: "De la console de la clinique au compte-rendu signé",
    premiere: "La passerelle reçoit",
    derniere: "Le compte-rendu revient",
  },
  {
    langue: "en",
    path: "/en/preview/journey",
    titre: "From the clinic’s scanner to the signed report",
    premiere: "The gateway receives",
    derniere: "The report comes back",
  },
] as const;

test.describe("thème clair", () => {
  // Scènes achevées, pour un audit sur leur état final (voir plus bas).
  test.use({ theme: "light", reducedMotion: "reduce" });

  test("contrastes suffisants, scènes achevées", async ({
    page,
    checkA11y,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/apercu/parcours");
    await page.locator("#parcours-titre").scrollIntoViewIfNeeded();
    await checkA11y();
  });
});

for (const apercu of PREVIEWS) {
  test(`${apercu.path} : jamais indexé, parcours présent`, async ({
    page,
    checkA11y,
  }) => {
    const response = await page.goto(apercu.path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", apercu.langue);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(
      page.getByRole("heading", { level: 2, name: apercu.titre }),
    ).toBeVisible();
    await checkA11y();
  });
}

test.describe("moins de mouvement", () => {
  test.use({ reducedMotion: "reduce" });

  // L'audit des scènes se fait ici, sur leur état final : pendant une
  // animation, un fondu en cours donne des contrastes de passage.
  test("les quatre étapes se lisent, chaque scène achevée", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/apercu/parcours");
    const section = page.locator('section[aria-labelledby="parcours-titre"]');
    const etapes = section.getByRole("heading", { level: 3 });
    // Seule la version empilée est rendue : le défilement est masqué.
    await expect(etapes).toHaveCount(4);
    await expect(etapes.first()).toHaveText(PREVIEWS[0].premiere);
    await expect(etapes.last()).toHaveText(PREVIEWS[0].derniere);
    // Les scènes sont achevées d'emblée : compte-rendu signé, puis remis.
    await expect(
      page.getByText("Signer", { exact: true }).filter({ visible: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Signé", { exact: true }).filter({ visible: true }),
    ).toHaveCount(2);
    await expect(
      page.getByText("Remis à la clinique").filter({ visible: true }),
    ).toHaveCount(1);
    await checkA11y();
  });
});

test.describe("téléphone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("aucun débordement horizontal, scènes jouées à l'arrivée", async ({
    page,
  }) => {
    await page.goto("/apercu/parcours");
    const titre = page.locator("#parcours-titre");
    await titre.scrollIntoViewIfNeeded();
    const largeur = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(largeur).toBeLessThanOrEqual(0);

    // La dernière carte, une fois à l'écran, finit sur le compte-rendu remis.
    await page
      .getByRole("heading", { level: 3, name: PREVIEWS[0].derniere })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByText("Remis à la clinique").filter({ visible: true }),
    ).toHaveCount(1, { timeout: 10_000 });
  });
});

test.describe("grand écran", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("l'étape en cours suit le défilement", async ({ page }) => {
    await page.goto("/apercu/parcours");
    const piste = page.locator("div.h-\\[400vh\\]");
    await expect(piste).toBeVisible();
    const courante = page.locator('li[aria-current="step"]');

    const aller = async (ratio: number) => {
      await piste.evaluate((track, r) => {
        const top = track.getBoundingClientRect().top + window.scrollY;
        const course = (track as HTMLElement).offsetHeight - window.innerHeight;
        window.scrollTo(0, top + course * r);
      }, ratio);
    };

    await aller(0.1);
    await expect(courante).toContainText(PREVIEWS[0].premiere);
    await aller(0.6);
    await expect(courante).toContainText("Un radiologue lit");
    await aller(0.99);
    await expect(courante).toContainText(PREVIEWS[0].derniere);
  });
});
