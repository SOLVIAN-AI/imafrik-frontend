import { expect, test } from "./support/fixtures";

/**
 * Logo d'une clinique, imprimé en filigrane de ses comptes-rendus.
 *
 * La démonstration n'enregistre aucun logo : un dépôt valide aboutit au
 * message « indisponible en démonstration ». Le test vérifie ce que
 * l'écran garantit seul : la rubrique, son explication, et le refus
 * immédiat d'un fichier que le service refuserait (SVG, trop lourd), sans
 * rien envoyer. Le rendu du filigrane dans le PDF est éprouvé côté
 * service (`tests/test_clinic_logo.py`).
 */

test.use({ membership: "m-admin", langue: "fr" });

/** Une image PNG d'un pixel, assez pour passer les contrôles de l'écran. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("la fiche d'une clinique règle le logo en filigrane", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/admin/organisations/org-stj");
  // La rubrique : le panneau qui porte son titre.
  const rubrique = page
    .getByRole("heading", { name: "Logo en filigrane" })
    .locator("xpath=ancestor::div[contains(@class, 'rounded-xl')][1]");
  await expect(rubrique).toContainText("Aucun logo");
  await expect(rubrique).toContainText("pâle et légèrement flouté");
  await checkA11y();

  const fichier = rubrique.locator('input[type="file"]');
  await fichier.setInputFiles({
    name: "logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"),
  });
  await expect(
    page.getByText("Déposez un PNG, un JPEG ou un WebP."),
  ).toBeVisible();

  await fichier.setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
  });
  await expect(page.getByText("Ce fichier dépasse 2 Mo.")).toBeVisible();

  await fichier.setInputFiles({
    name: "logo.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(page.getByText(/pas disponible en démonstration/)).toBeVisible();
});
