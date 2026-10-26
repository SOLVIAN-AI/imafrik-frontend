import { expect, test } from "./support/fixtures";

/**
 * Passerelles des cliniques, dans la tour de contrôle (démonstration).
 *
 * Le jeu de démonstration n'a pas de service derrière lui : les gestes
 * s'y arrêtent sur le message qui le dit, après avoir montré leurs
 * garde-fous (motif, confirmation, second facteur). Le code d'enrôlement
 * est l'exception : un code au bon format, qui ne raccorde rien, montre
 * le geste jusqu'au bout.
 */

test.use({ membership: "m-admin" });

/** Format d'un code d'enrôlement (contrat 3.6 du service). */
const CODE = /^IMF(-[A-Z2-9]{4}){4}$/;

test("la vue d'ensemble liste les passerelles, leurs alertes, la tâche d'hôte et le kit", async ({
  page,
}) => {
  await page.goto("/admin");
  const nav = page.getByRole("navigation", { name: "Navigation principale" });
  await nav.getByRole("link", { name: /Passerelles/ }).click();
  await expect(page).toHaveURL(/\/admin\/passerelles$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Passerelles" }),
  ).toBeVisible();

  // Alertes du service : approbation qui attend, passerelle muette.
  const alerts = page.getByRole("list", { name: /Alertes/ });
  await expect(
    alerts.getByText(/ESPERANCE-01 attend une approbation/),
  ).toBeVisible();
  await expect(
    alerts.getByText(/GOLFE-PC ne donne plus signe de vie/),
  ).toBeVisible();

  const table = page.getByRole("table");
  await expect(
    table.getByRole("link", { name: /PC-ACCUEIL-01/ }),
  ).toBeVisible();
  await expect(table.getByText("Révoquée", { exact: true })).toBeVisible();

  // Filtre par statut, porté par l'adresse.
  await page
    .getByRole("navigation", { name: "Filtrer par statut" })
    .getByRole("link", { name: /En attente d’approbation/ })
    .click();
  await expect(page).toHaveURL(/statut=awaiting_approval/);
  await expect(table.getByRole("link", { name: /ESPERANCE-01/ })).toBeVisible();
  await expect(table.getByRole("link", { name: /PC-ACCUEIL-01/ })).toHaveCount(
    0,
  );

  await expect(
    page.getByText("Application de la confiance au PACS"),
  ).toBeVisible();
  await expect(page.getByText("Signé (Authenticode)")).toBeVisible();
  await expect(page.getByText(/Éditeur : CN=IMAFRIK SAS/)).toBeVisible();
  await expect(page.getByTestId("kit-sha256")).toHaveText(
    /^([0-9a-f]{4} ){15}[0-9a-f]{4}$/,
  );
  await page.getByRole("button", { name: "Télécharger le kit" }).click();
  await expect(
    page.getByText(
      /Le téléchargement du kit n’est pas disponible en démonstration/,
    ),
  ).toBeVisible();
});

test("approuver montre ce qu'il faut vérifier avec la clinique", async ({
  page,
}) => {
  await page.goto("/admin/passerelles?statut=awaiting_approval");
  await page
    .getByRole("table")
    .getByRole("button", { name: "Approuver · ESPERANCE-01" })
    .click();
  const dialog = page.getByRole("dialog", { name: "Approuver ESPERANCE-01" });
  await expect(
    dialog.getByText("Identifiant Windows (MachineGuid)", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Adresse d’enrôlement", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Empreinte SHA-256", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Approuver la passerelle" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    /L’approbation d’une passerelle n’est pas disponible en démonstration/,
  );
});

test("révoquer exige un motif et la confirmation du caractère définitif", async ({
  page,
}) => {
  await page.goto("/admin/passerelles/gw-stj-accueil");
  await expect(
    page.getByRole("heading", { level: 1, name: "PC-ACCUEIL-01" }),
  ).toBeVisible();
  await expect(page.getByText("Certificats", { exact: true })).toBeVisible();
  await expect(page.getByText("Historique", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Révoquer · PC-ACCUEIL-01" }).click();
  const dialog = page.getByRole("dialog", { name: "Révoquer PC-ACCUEIL-01" });
  const submit = dialog.getByRole("button", { name: "Révoquer la passerelle" });
  await expect(submit).toBeDisabled();

  await dialog.getByLabel("Motif").fill("ok");
  await dialog.getByLabel("Motif").blur();
  await expect(
    dialog.getByText("Motif : trois caractères au moins."),
  ).toBeVisible();
  await expect(submit).toBeDisabled();

  await dialog.getByLabel("Motif").fill("Poste volé à l’accueil");
  await expect(submit).toBeDisabled();
  await dialog
    .getByLabel("Je comprends que la révocation est définitive.")
    .check();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(dialog.getByRole("alert")).toHaveText(
    /La révocation d’une passerelle n’est pas disponible en démonstration/,
  );
});

test("un code d'enrôlement s'affiche une fois, avec son compte à rebours", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/admin/organisations/org-lum");
  await expect(page.getByText("Raccorder une passerelle")).toBeVisible();
  // Un code est déjà en cours : il est listé sans sa valeur.
  await expect(page.getByText("Code en cours")).toBeVisible();

  // Le nouveau code annule l'ancien : l'écran le demande d'abord.
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Émettre un nouveau code" }).click();

  const code = page.getByTestId("enrollment-code");
  await expect(code).toHaveText(CODE);
  await expect(page.getByTestId("enrollment-countdown")).toHaveText(
    /Expire dans 1[45]:\d\d/,
  );
  await expect(
    page.getByText("Code de démonstration : il ne raccorde aucun poste."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Copier le code" }).click();
  await expect(page.getByRole("button", { name: "Code copié" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    await code.textContent(),
  );
});

test("une clinique se crée depuis la liste des organisations", async ({
  page,
}) => {
  await page.goto("/admin/organisations");
  await page.getByRole("button", { name: "Nouvelle clinique" }).click();
  const dialog = page.getByRole("dialog", { name: "Créer une clinique" });
  await dialog.getByRole("button", { name: "Créer la clinique" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Le nom de l’établissement est requis (2 caractères au moins).",
  );
  await dialog.getByLabel("Nom de l’établissement").fill("Clinique du Plateau");
  await dialog.getByLabel("Ville").fill("Atakpamé");
  await dialog.getByRole("button", { name: "Créer la clinique" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    /La création d’une clinique n’est pas disponible en démonstration/,
  );
});

test("la connexion Tailscale se lit sans son secret, s'éprouve, et sa politique se compare", async ({
  page,
}) => {
  await page.goto("/admin/reglages");
  const panel = page.locator("#tailscale");
  await expect(
    panel.getByText("Saisie en console", { exact: true }),
  ).toBeVisible();
  await expect(panel.getByText("•••• 7Hq2")).toBeVisible();

  await panel.getByRole("button", { name: "Éprouver la connexion" }).click();
  await expect(
    panel.getByText("Connexion éprouvée : jeton obtenu, portées présentes."),
  ).toBeVisible();

  await expect(panel.getByTestId("policy-diff")).toContainText(
    "autogroup:admin",
  );
  await panel
    .getByRole("button", { name: "Pousser la politique versionnée" })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Pousser la politique versionnée",
  });
  await dialog
    .getByLabel("Code de votre application d’authentification")
    .fill("123456");
  await dialog
    .getByRole("button", { name: "Pousser la politique versionnée" })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText(
    /La politique d’accès n’est pas disponible en démonstration/,
  );

  await dialog.getByRole("button", { name: "Annuler" }).click();
  await expect(dialog).toHaveCount(0);

  // Le secret ne se réaffiche jamais : le remplacer, c'est en saisir un.
  await panel.getByRole("button", { name: "Remplacer la connexion" }).click();
  const replace = page.getByRole("dialog", { name: "Remplacer la connexion" });
  await expect(replace.getByLabel("Secret du client")).toHaveValue("");
  await expect(replace.getByLabel("Secret du client")).toHaveAttribute(
    "type",
    "password",
  );
});
