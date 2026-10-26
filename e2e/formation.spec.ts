import { expect, settle, test } from "./support/fixtures";

/**
 * Espace de formation : s'exercer sur de vrais examens, sans patient.
 *
 * En démonstration, les sept cas du catalogue sont listés ; les trois
 * premiers sont à trois étapes différentes : la radiographie signée
 * (corrigé, addendum, PDF), le scanner en cours de rédaction, l'IRM du
 * foie à faire. Les images sont simulées ; ce qui est vérifié,
 * c'est que l'écran de lecture réel sert l'exercice, qu'il le dit partout,
 * et qu'il ne mène jamais à un vrai examen.
 */

test.use({ membership: "m-radio" });

test("la liste dit le parcours, chaque cas, son état et sa source", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/formation");
  await expect(
    page.getByRole("heading", { level: 1, name: "Formation" }),
  ).toBeVisible();
  await expect(
    page.getByText("Le parcours, comme sur un vrai examen"),
  ).toBeVisible();

  for (const [titre, etat, action] of [
    ["Radiographie du thorax", "Signé", "Revoir"],
    ["Scanner thoracique", "En cours", "Reprendre"],
    ["IRM du foie", "À faire", "Commencer"],
    ["Scanner cérébral", "À faire", "Commencer"],
    ["IRM cérébrale", "À faire", "Commencer"],
    ["IRM du rachis lombaire", "À faire", "Commencer"],
    ["Radiographie du bassin", "À faire", "Commencer"],
  ]) {
    const carte = page.locator("li", {
      has: page.getByRole("heading", { level: 2, name: titre }),
    });
    await expect(carte.getByText(etat, { exact: true })).toBeVisible();
    await expect(carte.getByRole("link", { name: action })).toBeVisible();
    await expect(carte.getByText(/licence CC BY [34]\.0/)).toBeVisible();
  }
  await expect(page.getByText("Corrigé disponible")).toBeVisible();
  await checkA11y();
});

test("un cas à faire s'ouvre dans l'écran de lecture, annoncé comme exercice", async ({
  page,
}) => {
  await page.goto("/formation");
  await page
    .locator("li", {
      has: page.getByRole("heading", { level: 2, name: "IRM du foie" }),
    })
    .getByRole("link", { name: "Commencer" })
    .click();
  await expect(page).toHaveURL("/formation/irm-foie");
  await settle(page);

  await expect(
    page.getByRole("heading", { level: 1, name: "IRM du foie" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Exercice de formation : rien de ce que vous faites ici/),
  ).toBeVisible();
  await expect(page.getByText("Images simulées")).toBeVisible();
  // Le contexte clinique du cas, comme le renseignement d'une clinique.
  await expect(
    page.getByText(
      "IRM hépatique sans puis avec injection, dans le bilan d’une lésion du foie.",
    ),
  ).toBeVisible();
  // La consigne dit ce qui est attendu, sans la réponse.
  await expect(page.getByText("Consigne", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Parcourez les neuf séries, avant puis après injection/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Commencer l’exercice" }),
  ).toBeVisible();
  // Le retour ramène aux exercices, jamais à la file des examens.
  await expect(page.getByRole("link", { name: "Retour" })).toHaveAttribute(
    "href",
    "/formation",
  );
});

test("un exercice en cours se rédige et se signe dans les mêmes gestes", async ({
  page,
}) => {
  await page.goto("/formation/scanner-thorax");
  await settle(page);
  await expect(
    page.getByRole("button", { name: "Signer l’exercice" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Recommencer" })).toBeVisible();

  await page.getByRole("button", { name: "Signer l’exercice" }).click();
  const fenetre = page.getByRole("dialog", { name: "Signer l’exercice" });
  await expect(fenetre).toBeVisible();
  await expect(fenetre.getByText(/ne sera transmis à personne/)).toBeVisible();
  // Résultats et conclusion restent à écrire : la fenêtre le dit, comme
  // pour un vrai compte-rendu.
  await expect(
    fenetre.getByText("2 sections obligatoires sont vides"),
  ).toBeVisible();
});

test("un exercice signé montre le corrigé, les addenda et le PDF spécimen", async ({
  page,
  checkA11y,
}) => {
  await page.goto("/formation/radio-thorax");
  await settle(page);
  await expect(
    page.getByText(/Exercice signé : le texte est figé/),
  ).toBeVisible();

  const apres = page.getByRole("region", { name: "Après la signature" });
  await expect(apres.getByText("Corrigé", { exact: true })).toBeVisible();
  await expect(
    apres.getByText("Rédigé ou validé par Dr Afi Lawson."),
  ).toBeVisible();
  // Le corrigé dit ce qui était attendu, et sur quoi il s'appuie.
  await expect(apres.getByText("Points attendus")).toBeVisible();
  await expect(
    apres.getByText("Proposer un scanner thoracique pour la caractériser."),
  ).toBeVisible();
  await expect(
    apres.getByText("Ce que documente le jeu de données"),
  ).toBeVisible();
  await expect(
    apres.getByText(
      "Comparaison souhaitée avec un cliché antérieur, s’il existe.",
    ),
  ).toBeVisible();
  await expect(apres.getByLabel("Nouvel addendum")).toBeVisible();

  // Audité avant le message qui suit le clic : pendant son animation,
  // son contraste partiel ferait échouer l'audit au hasard.
  await checkA11y();

  await page
    .getByRole("button", { name: "Télécharger le PDF spécimen" })
    .click();
  await expect(
    page.getByText("Le PDF spécimen n’est pas produit en démonstration."),
  ).toBeVisible();
});

test.describe("en anglais", () => {
  test.use({ langue: "en" });

  test("the list and the exercise screen are translated", async ({ page }) => {
    await page.goto("/formation");
    await expect(
      page.getByRole("heading", { level: 1, name: "Training" }),
    ).toBeVisible();
    await page.goto("/formation/scanner-thorax");
    await expect(
      page.getByText(/Training exercise: nothing you do here/),
    ).toBeVisible();
    await expect(page.getByText("Task", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign the exercise" }),
    ).toBeVisible();
  });
});

test.describe("pour une clinique", () => {
  test.use({ membership: "m-clinic" });

  test("l'espace de formation n'est pas ouvert aux cliniques", async ({
    page,
  }) => {
    await page.goto("/formation");
    await expect(page).not.toHaveURL(/\/formation/);
  });
});
