import { expect, test } from "./support/fixtures";

/**
 * Fenêtre d'attribution d'un examen, depuis la liste de l'équipe.
 *
 * La démonstration ne réserve rien : attribuer aboutit au message
 * « indisponible en démonstration ». Le test vérifie ce que l'écran
 * garantit seul : le titulaire, les radiologues du jeu les moins chargés
 * d'abord, le titulaire impossible à rechoisir, les antériorités du
 * patient, et la confirmation exigée avant d'effacer un brouillon
 * commencé. L'attribution elle-même est
 * éprouvée de bout en bout par `e2e/reel/attribution.spec.ts`, et côté
 * service par `tests/test_attribution.py`.
 */

test.use({ membership: "m-admin", langue: "fr" });

for (const theme of ["dark", "light"] as const) {
  test.describe(`thème ${theme === "dark" ? "sombre" : "clair"}`, () => {
    test.use({ theme });

    test("la fenêtre d'attribution exige une confirmation avant d'effacer un brouillon", async ({
      page,
      checkA11y,
    }) => {
      await page.goto("/admin/examens");
      await page
        .getByRole("button", { name: "Réattribuer l’examen de MENSAH Kodjo" })
        .click();
      const dialogue = page.getByRole("dialog", { name: "Attribuer l’examen" });
      await expect(dialogue).toBeVisible();
      await expect(dialogue.getByText(/attribué le/)).toBeVisible();
      // Les antériorités du patient sont cherchées dans la clinique.
      await expect(
        dialogue.getByText("Antériorités du patient", { exact: true }),
      ).toBeVisible();

      const radiologues = dialogue.getByRole("radio");
      await expect(radiologues).toHaveCount(4);
      // Le titulaire ne se rechoisit pas.
      await expect(
        dialogue.getByRole("radio", { name: /Dr Adjo Kponton/ }),
      ).toBeDisabled();

      const reattribuer = dialogue.getByRole("button", { name: "Réattribuer" });
      await expect(reattribuer).toBeDisabled();
      await dialogue.getByRole("radio", { name: /Dr Fatou Diallo/ }).check();
      await expect(
        dialogue.getByText(/Son brouillon sera effacé\.$/),
      ).toBeVisible();
      await expect(reattribuer).toBeDisabled();
      await dialogue.getByLabel("J’ai compris : effacer le brouillon").check();
      await expect(reattribuer).toBeEnabled();
      // Les boutons passent de l'état désactivé à l'état actif par un fondu :
      // l'audit attend la fin des transitions, et mesure l'état final.
      await page.waitForFunction(() => document.getAnimations().length === 0);
      await checkA11y();

      await reattribuer.click();
      await expect(dialogue.getByRole("alert")).toContainText("démonstration");
    });
  });
}

test("un examen signé ne propose pas d'attribution", async ({ page }) => {
  await page.goto("/admin/examens");
  const signe = page.getByRole("row").filter({ hasText: "Signé" }).first();
  await expect(signe).toBeVisible();
  await expect(
    signe.getByRole("button", { name: /ttribuer l’examen/ }),
  ).toHaveCount(0);
});

test.describe("le bouton d’attribution", () => {
  for (const largeur of [1440, 390]) {
    test.describe(`à ${largeur} px`, () => {
      test.use({ viewport: { width: largeur, height: 900 } });

      test("est libellé sur chaque examen non signé de « Examens »", async ({
        page,
      }) => {
        await page.goto("/admin/examens");
        const boutons = page
          .locator("main")
          .getByRole("button", { name: /^(Ré)?[aA]ttribuer l’examen de/ })
          .filter({ visible: true });
        expect(await boutons.count()).toBeGreaterThan(0);
        for (const texte of await boutons.allInnerTexts())
          expect(texte.trim()).toMatch(/^(Attribuer|Réattribuer)$/);
        if (largeur === 1440)
          await expect(
            page.getByRole("columnheader", { name: "Attribution" }),
          ).toBeVisible();
      });
    });
  }
});

test.describe("le responsable de la clinique", () => {
  test.use({ membership: "m-clinic" });

  for (const largeur of [1440, 390]) {
    test(`voit « Attribuer », libellé, sur les examens à attribuer, à ${largeur} px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: largeur, height: 900 });
      await page.goto("/examens?vue=a-attribuer");
      const bouton = page
        .getByRole("button", { name: "Attribuer l’examen de KOFFI Ama" })
        .filter({ visible: true });
      await expect(bouton).toHaveText("Attribuer");
      if (largeur === 1440)
        await expect(
          page.getByRole("columnheader", { name: "Attribution" }),
        ).toBeVisible();
      await bouton.click();
      await expect(
        page.getByRole("dialog", { name: "Attribuer l’examen" }),
      ).toBeVisible();
    });
  }
});
