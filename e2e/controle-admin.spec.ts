import { expect, test } from "./support/fixtures";

/**
 * L'équipe IMAFRIK contrôle tout, comptes-rendus en cours compris.
 *
 * Demandé le 23 octobre 2026. En démonstration, l'équipe voit les
 * comptes-rendus de toutes les cliniques, en cours de rédaction compris,
 * les filtre par état, suit un brouillon en consultation, et retrouve un
 * examen par son adresse côté clinique. Côté service, les mêmes règles
 * sont éprouvées par `tests/test_controle_admin.py`.
 */

test.use({ membership: "m-admin", langue: "fr" });

test("la liste des comptes-rendus montre tout, filtrable par état", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/comptes-rendus");
  await expect(
    page.getByText(
      /toutes cliniques confondues, en cours de rédaction compris/,
    ),
  ).toBeVisible();
  const filtre = page.getByRole("navigation", {
    name: "État des comptes-rendus",
  });
  await expect(filtre.getByRole("link")).toHaveText([
    "Tous",
    "En cours de rédaction",
    "Signés",
    "Remis",
  ]);
  // Un brouillon en cours, avec son rédacteur, et un document signé.
  await expect(page.getByText(/^En rédaction · /).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /ADJOVI Mawuli/ })).toBeVisible();
  await checkA11y();

  await filtre.getByRole("link", { name: "En cours de rédaction" }).click();
  await expect(page).toHaveURL(/\?etat=draft$/);
  await expect(page.getByRole("link", { name: /ADJOVI Mawuli/ })).toHaveCount(
    0,
  );
  await expect(page.getByText(/^En rédaction · /).first()).toBeVisible();
});

test("un brouillon se suit en consultation, sans pouvoir être modifié", async ({
  page,
}) => {
  await page.goto("/comptes-rendus?etat=draft");
  await page.getByRole("link", { name: /MENSAH Kodjo/ }).click();
  await expect(page).toHaveURL("/lecture/2");
  await expect(
    page.getByText(
      /^Brouillon non signé de .+ La clinique ne le voit pas encore/,
    ),
  ).toBeVisible();
  // Le texte du radiologue, tel qu'il est enregistré, en lecture seule.
  const indication = page.getByRole("textbox", {
    name: "Indication clinique",
    exact: true,
  });
  await expect(indication).toContainText("Céphalées inhabituelles");
  await expect(indication).toHaveAttribute("contenteditable", "false");
  await expect(
    page.getByRole("button", { name: "Signer", exact: true }),
  ).toHaveCount(0);
});

test("l'adresse d'un examen côté clinique mène à l'écran de l'équipe", async ({
  page,
}) => {
  await page.goto("/examens/1");
  await expect(page).toHaveURL("/lecture/1");
  await page.goto("/examens");
  await expect(page).toHaveURL("/admin/examens");
});
