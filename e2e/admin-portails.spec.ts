import { expect, test } from "./support/fixtures";

/**
 * Portails des radiologues, ouverts en consultation à l’équipe IMAFRIK
 * (la navigation de chaque portail est parcourue par `portails.spec.ts`).
 *
 * L'administration supervise le service comme ses utilisateurs le vivent :
 * la file à lire, les comptes-rendus, les modèles, sur toute la
 * plateforme. Les gestes médicaux (prise en charge, rédaction, signature,
 * suppression d'un modèle) restent aux radiologues.
 */

test.use({ membership: "m-admin" });

test("la navigation ouvre les portails en consultation", async ({ page }) => {
  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  // La vue des radiologues est repliée : elle s'ouvre d'un clic sur son titre.
  const vue = nav.getByRole("button", { name: "Vue des radiologues" });
  await expect(vue).toHaveAttribute("aria-expanded", "false");
  await expect(nav.getByRole("link", { name: /À lire/ })).toBeHidden();
  await vue.click();
  await expect(vue).toHaveAttribute("aria-expanded", "true");

  await nav.getByRole("link", { name: /À lire/ }).click();
  await expect(page).toHaveURL(/\/worklist/);
  await expect(page.getByRole("heading", { name: "À lire" })).toBeVisible();
  // Rien n'y est « à soi » : la file se lit en consultation.
  await expect(
    page.getByText(/Toute la plateforme, en consultation/),
  ).toBeVisible();
  await expect(
    page.getByRole("table").getByText("En cours de lecture", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Pris en charge par vous")).toHaveCount(0);
  await expect(page.getByText("Chez un confrère")).toHaveCount(0);

  await nav.getByRole("link", { name: /Comptes-rendus/ }).click();
  await expect(page).toHaveURL(/\/comptes-rendus/);

  await nav.getByRole("link", { name: /Modèles/ }).click();
  await expect(page).toHaveURL(/\/modeles/);
  // Consultation : aucun modèle ne se supprime d'ici.
  await expect(page.getByRole("button", { name: /Supprimer/ })).toHaveCount(0);
});

test("un examen ouvert depuis la file reste en consultation", async ({
  page,
}) => {
  await page.goto("/lecture/1");
  await expect(
    page.getByRole("button", { name: "Prendre en charge" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Signer" })).toHaveCount(0);
});

test("ce qui n'est qu'au radiologue ou à la clinique reste fermé", async ({
  page,
}) => {
  await page.goto("/mes-examens");
  await expect(page).not.toHaveURL(/\/mes-examens/);
});
