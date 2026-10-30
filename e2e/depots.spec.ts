import { expect, test } from "./support/fixtures";

/**
 * Dépôt d'une archive ZIP d'images (démonstration).
 *
 * Le jeu de démonstration n'a pas de service derrière lui : l'envoi y est
 * simulé (rien ne quitte le poste), avec sa coupure, pour montrer ce que
 * vit le responsable : progression, débit, temps restant, connexion
 * perdue puis reprise, archive reçue. La liste et les comptes rendus
 * sont ceux du jeu de démonstration.
 */

/** Une petite archive ZIP : sa signature suffit au contrôle du navigateur. */
function archive(name: string, size = 256 * 1024) {
  const buffer = Buffer.alloc(size);
  buffer.set([0x50, 0x4b, 0x03, 0x04]);
  return { name, mimeType: "application/zip", buffer };
}

test.describe("chez le responsable", () => {
  test.use({ membership: "m-clinic" });

  test("« Déposer des images » est dans la navigation, sous « Envoyer un examen »", async ({
    page,
  }) => {
    await page.goto("/tableau-de-bord");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    const hrefs = await nav
      .locator("a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs.slice(0, 3)).toEqual([
      "/tableau-de-bord",
      "/envoyer",
      "/examens/depots",
    ]);
    await nav.getByRole("link", { name: "Déposer des images" }).click();
    await expect(page).toHaveURL("/examens/depots");
    await expect(
      page.getByRole("heading", { level: 1, name: "Dépôts d’images" }),
    ).toBeVisible();
    // Une seule entrée allumée : le dépôt, pas « Examens ».
    await expect(
      nav.getByRole("link", { name: "Déposer des images" }),
    ).toHaveAttribute("aria-current", "page");
    await expect(nav.locator('a[href="/examens"]')).not.toHaveAttribute(
      "aria-current",
    );

    // « Envoyer un examen » garde son lien vers le dépôt.
    await nav.getByRole("link", { name: "Envoyer un examen" }).click();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Déposer des images" }),
    ).toHaveAttribute("href", "/examens/depots");
  });

  test("« Déposer des images » mène au dépôt, depuis « Examens »", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/examens");
    await page
      .getByRole("main")
      .getByRole("link", { name: "Déposer des images" })
      .click();
    await expect(page).toHaveURL(/\/examens\/depots$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Dépôts d’images" }),
    ).toBeVisible();

    // Le message honnête : une connexion reste nécessaire, l'envoi reprend.
    await expect(
      page.getByText("Une connexion reste nécessaire pendant l’envoi"),
    ).toBeVisible();
    await expect(
      page.getByText(/reprend seul, là où il s’était arrêté/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Choisir une archive" }),
    ).toBeVisible();

    // « Mes dépôts » : les dépôts de la clinique, pas ceux d'une autre.
    const list = page.getByRole("table");
    await expect(
      list.getByRole("link", { name: "cd-urgences-mardi.zip", exact: true }),
    ).toBeVisible();
    await expect(
      list.getByRole("link", { name: "scanner-thorax-cd.zip", exact: true }),
    ).toBeVisible();
    await expect(list.getByText("kara-radios-semaine.zip")).toHaveCount(0);
    await checkA11y();
  });

  test("la barre de filtres commune trie les dépôts par état", async ({
    page,
  }) => {
    await page.goto("/examens/depots");
    await page
      .getByRole("group", { name: "État" })
      .getByRole("link", { name: /^Refusé/ })
      .click();
    await expect(page).toHaveURL(/etat=refuse/);
    const list = page.getByRole("table");
    await expect(
      list.getByRole("link", { name: "export-console.zip", exact: true }),
    ).toBeVisible();
    await expect(
      list.getByRole("link", { name: "cd-urgences-mardi.zip", exact: true }),
    ).toHaveCount(0);
    await expect(list.getByText("Archive écartée par sécurité")).toBeVisible();
  });

  test("un envoi montre sa progression, sa coupure, sa reprise et sa réception", async ({
    page,
  }) => {
    await page.goto("/examens/depots");
    await page
      .getByTestId("depot-fichier")
      .setInputFiles(archive("irm-genou.zip"));

    const row = page
      .getByRole("list", { name: "Déposer une archive ZIP" })
      .getByRole("listitem")
      .filter({ hasText: "irm-genou.zip" });
    await expect(row.getByRole("progressbar")).toBeVisible();
    // Débit et temps restant, pendant l'envoi.
    await expect(row.getByText(/\/s$/)).toBeVisible();
    await expect(row.getByText(/^reste environ/)).toBeVisible();
    await expect(row.getByRole("button", { name: "Pause" })).toBeVisible();

    // La coupure : l'envoi attend le réseau, puis reprend seul.
    await expect(row.getByText(/Connexion perdue/)).toBeVisible();
    await expect(row.getByText(/Connexion perdue/)).toHaveCount(0, {
      timeout: 15_000,
    });
    await expect(row.getByText(/Archive reçue/)).toBeVisible({
      timeout: 20_000,
    });
  });

  test("un fichier qui n’est pas une archive ZIP est refusé avant de partir", async ({
    page,
  }) => {
    await page.goto("/examens/depots");
    await page.getByTestId("depot-fichier").setInputFiles({
      name: "compte-rendu.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7 rien d’autre"),
    });
    await expect(
      page.getByText("Ce fichier n’est pas une archive ZIP."),
    ).toBeVisible();
  });

  test("« Reprendre » rouvre le choix du fichier de l’envoi interrompu", async ({
    page,
  }) => {
    await page.goto("/examens/depots");
    const interrupted = page
      .getByRole("row")
      .filter({ hasText: "scanner-thorax-cd.zip" });
    await expect(interrupted.getByText(/^41 %/)).toBeVisible();
    await expect(
      interrupted.getByText(/Interrompu\. Choisissez de nouveau/),
    ).toBeVisible();

    const chooser = page.waitForEvent("filechooser");
    await interrupted
      .getByRole("button", {
        name: "Reprendre l’envoi de scanner-thorax-cd.zip",
      })
      .click();
    await (await chooser).setFiles(archive("scanner-thorax-cd.zip"));
    await expect(page.getByText(/Reprise de l’envoi à/)).toBeVisible();
  });

  test("le compte rendu dit ce que l’archive a donné, et mène aux examens", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/examens/depots");
    await page
      .getByRole("table")
      .getByRole("link", {
        name: "Compte rendu du dépôt cd-urgences-mardi.zip",
      })
      .first()
      .click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Dépôt cd-urgences-mardi.zip",
      }),
    ).toBeVisible();
    await expect(page.getByText("Images transmises")).toBeVisible();
    await expect(page.getByText("1 558")).toBeVisible();

    // Les examens trouvés, un lien vers chacun ; celui d'une autre
    // clinique n'est pas transmis.
    const studies = page.getByRole("table");
    await expect(studies.getByText("AGBEKO Selom")).toBeVisible();
    await expect(studies.getByText("Non transmis")).toBeVisible();
    await expect(
      studies.getByRole("link", { name: "Ouvrir l’examen" }).first(),
    ).toHaveAttribute("href", /^\/examens\//);

    // Les fichiers ignorés, regroupés par raison.
    await expect(page.getByText("Sommaire du CD")).toBeVisible();
    await page.getByText("Voir les 3 fichiers").click();
    await expect(page.getByText("AUTORUN.INF")).toBeVisible();
    await checkA11y();
  });

  test("une archive refusée dit pourquoi, et quoi faire", async ({ page }) => {
    await page.goto("/examens/depots/demo-depot-refuse");
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Archive écartée par sécurité" }),
    ).toBeVisible();
    await expect(
      page.getByText(/Recréez-la à partir du dossier d’images/),
    ).toBeVisible();
  });

  test("un dépôt d’une autre clinique n’existe pas pour le responsable", async ({
    page,
  }) => {
    await page.goto("/examens/depots/demo-depot-equipe");
    await expect(page.getByText("Cette page n’existe pas")).toBeVisible();
    await expect(page.getByText("kara-radios-semaine.zip")).toHaveCount(0);
  });

  test("le dépôt de l’équipe est marqué, sans nommer son auteur", async ({
    page,
  }) => {
    await page.goto("/examens/depots");
    await expect(page.getByText("Mawuli Dossou")).toHaveCount(0);
  });
});

test.describe("dans la console de l’équipe", () => {
  test.use({ membership: "m-admin" });

  test("« Dépôts » liste le réseau, et l’équipe dépose au nom d’une clinique", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/admin");
    await page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: /^Dépôts/ })
      .click();
    await expect(page).toHaveURL(/\/admin\/depots$/);

    const list = page.getByRole("table");
    await expect(list.getByText("kara-radios-semaine.zip")).toBeVisible();
    await expect(list.getByText("Mawuli Dossou")).toBeVisible();

    // Sans clinique choisie, rien ne part.
    await expect(
      page.getByRole("button", { name: "Choisir une archive" }),
    ).toBeDisabled();
    await page
      .getByRole("combobox", { name: "Clinique" })
      .selectOption({ label: "Polyclinique de Kara" });
    await expect(page).toHaveURL(/clinique=org-pka/);
    await expect(
      page.getByText(/Dépôt au nom de Polyclinique de Kara, tracé à votre nom/),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Choisir une archive" }),
    ).toBeEnabled();
    // La clinique choisie filtre aussi la liste.
    await expect(list.getByText("cd-urgences-mardi.zip")).toHaveCount(0);
    await checkA11y();
  });

  test("la vue des cliniques mène au dépôt au nom de la clinique consultée", async ({
    page,
  }) => {
    await page.goto("/admin/vue-clinique/org-stj/examens");
    await page
      .getByRole("main")
      .getByRole("link", { name: "Déposer des images" })
      .click();
    // Sans quitter la vue : la clinique est celle de l'écran.
    await expect(page).toHaveURL("/admin/vue-clinique/org-stj/examens/depots");
    await expect(
      page.getByText(/Dépôt au nom de Clinique Saint-Joseph/),
    ).toBeVisible();
  });

  test("« Dépôts » de la vue des cliniques : sa clinique, ses dépôts, en son nom", async ({
    page,
    checkA11y,
  }) => {
    const vue = "/admin/vue-clinique/org-stj";
    await page.goto(`${vue}/tableau-de-bord`);
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await nav.locator(`a[href="${vue}/examens/depots"]`).click();
    await expect(page).toHaveURL(`${vue}/examens/depots`);
    await expect(
      page.getByRole("heading", { level: 1, name: "Dépôts d’images" }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Vue des cliniques" }),
    ).toBeVisible();
    // Une seule entrée allumée : « Dépôts », pas « Examens ».
    await expect(
      nav.locator(`a[href="${vue}/examens/depots"]`),
    ).toHaveAttribute("aria-current", "page");
    await expect(nav.locator(`a[href="${vue}/examens"]`)).not.toHaveAttribute(
      "aria-current",
    );

    // La clinique est celle de l'écran : ni choix, ni filtre de clinique.
    await expect(page.getByRole("combobox", { name: "Clinique" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("group", { name: "Clinique" })).toHaveCount(0);
    await expect(
      page.getByText(
        /Dépôt au nom de Clinique Saint-Joseph, tracé à votre nom/,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Choisir une archive" }),
    ).toBeEnabled();

    // Ses dépôts, et eux seuls, avec leur auteur.
    await expect(
      page.getByRole("heading", { name: "Dépôts de la clinique" }),
    ).toBeVisible();
    const list = page.getByRole("table");
    await expect(
      list.getByRole("link", { name: "cd-urgences-mardi.zip", exact: true }),
    ).toBeVisible();
    await expect(list.getByText("kara-radios-semaine.zip")).toHaveCount(0);
    await expect(list.getByText("Afi Lawson").first()).toBeVisible();
    await checkA11y();

    // Le compte rendu s'ouvre sans quitter la clinique, et y ramène.
    await list
      .getByRole("link", { name: "cd-urgences-mardi.zip", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`^.*${vue}/examens/depots/`));
    await expect(
      page.getByRole("link", { name: "Ouvrir l’examen" }).first(),
    ).toHaveAttribute("href", new RegExp(`^${vue}/examens/`));
    await expect(
      nav.locator(`a[href="${vue}/examens/depots"]`),
    ).toHaveAttribute("aria-current", "page");
    await page
      .getByRole("main")
      .getByRole("link", { name: "Dépôts", exact: true })
      .click();
    await expect(page).toHaveURL(`${vue}/examens/depots`);
  });

  test("la vue d’une autre clinique ne montre que ses dépôts", async ({
    page,
  }) => {
    await page.goto("/admin/vue-clinique/org-pka/examens/depots");
    const list = page.getByRole("table");
    await expect(list.getByText("kara-radios-semaine.zip")).toBeVisible();
    await expect(list.getByText("cd-urgences-mardi.zip")).toHaveCount(0);
    // Le dépôt d'une clinique n'existe pas dans la vue d'une autre.
    await page.goto(
      "/admin/vue-clinique/org-pka/examens/depots/demo-depot-integre",
    );
    await expect(page.getByText("Cette page n’existe pas")).toBeVisible();
  });

  test("le compte rendu ouvre l’examen dans la vue des cliniques", async ({
    page,
  }) => {
    await page.goto("/admin/depots/demo-depot-integre");
    await expect(
      page.getByRole("link", { name: "Ouvrir l’examen" }).first(),
    ).toHaveAttribute("href", /^\/admin\/vue-clinique\/org-stj\/examens\//);
  });
});
