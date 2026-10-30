import type { Locator, Page } from "@playwright/test";

import { expect, settle, test } from "./support/fixtures";

/**
 * « Vos idées » (démonstration) : les radiologues et les responsables
 * proposent une idée depuis l’écran où ils se trouvent, et suivent les
 * leurs ; l’équipe IMAFRIK les trie sur la barre commune et les suit.
 *
 * Le contexte joint ne porte jamais l’adresse de la page : seulement la
 * clé de l’écran, que l’adresse de « Vos idées » transporte (`?ecran=`).
 */

/** La barre de filtres. */
function bar(page: Page) {
  return page.getByRole("group", { name: "Filtres" });
}

/** Le nombre affiché par une puce. */
async function shown(target: Locator): Promise<number> {
  return Number(await target.locator("span[aria-hidden]").first().innerText());
}

test.describe("radiologue", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("propose une idée depuis l’écran où il se trouve", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/worklist");
    await page
      .getByRole("link", { name: "Proposer une idée pour cet écran" })
      .click();
    await expect(page).toHaveURL(/\/idees\?ecran=worklist$/);
    await expect(
      page.getByRole("heading", { name: "Vos idées", level: 1 }),
    ).toBeVisible();

    // Le contexte nomme l’écran, jamais son adresse.
    const formulaire = page.getByRole("form", { name: "Proposer une idée" });
    await expect(formulaire.getByText("Écran « À lire »")).toBeVisible();
    await expect(formulaire.getByText("/worklist")).toHaveCount(0);
    await expect(
      formulaire.getByRole("checkbox", { name: "Joindre ce contexte" }),
    ).toBeChecked();
    // L’avertissement sur l’identité des patients reste sous les yeux.
    await expect(
      formulaire.getByText("Jamais l’identité d’un patient"),
    ).toBeVisible();

    // Envoi à vide : chaque champ dit ce qui manque.
    await formulaire.getByRole("button", { name: "Envoyer l’idée" }).click();
    await expect(
      formulaire.getByText("Le titre compte au moins 3 caractères."),
    ).toBeVisible();
    await expect(
      formulaire.getByText("Décrivez l’idée en 10 caractères au moins."),
    ).toBeVisible();
    await expect(
      formulaire.getByText("Choisissez une catégorie."),
    ).toBeVisible();
    await expect(formulaire.getByLabel("Titre")).toBeFocused();

    await formulaire.getByLabel("Titre").fill("Mesure d’angle");
    await formulaire
      .getByLabel("Description")
      .fill("Un outil de mesure d’angle pour la colonne, dans le visualiseur.");
    await formulaire
      .getByText("Lecture et visualiseur", { exact: true })
      .click();
    await formulaire.getByText("De la clarté", { exact: true }).click();
    await formulaire.getByRole("button", { name: "Envoyer l’idée" }).click();
    // En démonstration, rien ne part : l’écran le dit.
    await expect(
      page.getByText(
        "L’envoi d’une idée n’est pas disponible en démonstration",
        { exact: false },
      ),
    ).toBeVisible();
    await settle(page);
    await checkA11y();
  });

  test("retrouve ses idées, leur état et la réponse de l’équipe", async ({
    page,
  }) => {
    await page.goto("/idees");
    const mes = page.getByRole("region", { name: "Mes idées" });
    const etats = bar(page).getByRole("group", { name: "État" });
    const tous = etats.getByRole("link", { name: /^Tous les états/ });
    await expect(tous).toHaveAttribute("aria-current", "true");
    let somme = 0;
    for (const nom of [
      "Reçues",
      "À l’étude",
      "Prévues",
      "Livrées",
      "Non retenues",
    ])
      somme += await shown(
        etats.getByRole("link", { name: new RegExp(`^${nom}`) }),
      );
    expect(somme).toBe(await shown(tous));

    await etats.getByRole("link", { name: /^Prévues/ }).click();
    await expect(page).toHaveURL(/[?&]etat=prevues(&|$)/);
    await expect(mes.getByRole("article")).toHaveCount(1);
    await expect(mes.getByText("Fenêtrage au clavier")).toBeVisible();
    await expect(mes.getByText("Réponse de l’équipe IMAFRIK")).toBeVisible();
    // Les idées des autres ne sont jamais montrées.
    await page.goto("/idees");
    await expect(mes.getByText("Raccourcis pour les fenêtres")).toHaveCount(0);
  });

  test("ignore une clé d’écran inconnue ou une adresse", async ({ page }) => {
    await page.goto("/idees?ecran=%2Fexamens%3Fpatient%3DKOFFI");
    const formulaire = page.getByRole("form", { name: "Proposer une idée" });
    await expect(formulaire.getByText("Sans écran précis")).toBeVisible();
    await expect(formulaire.getByText("KOFFI")).toHaveCount(0);
  });
});

test.describe("responsable de clinique", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("propose depuis l’aide de l’écran et ne voit que ses idées", async ({
    page,
  }) => {
    await page.goto("/examens");
    await page.keyboard.press("?");
    const aide = page.getByRole("dialog", { name: "Aide" });
    const lien = aide.getByRole("link", {
      name: "Proposer une idée pour cet écran",
    });
    await expect(lien).toHaveAttribute("href", "/idees?ecran=studies");
    await lien.click();
    await expect(page).toHaveURL(/\/idees\?ecran=studies$/);
    await expect(page.getByText("Écran « Examens »")).toBeVisible();

    const mes = page.getByRole("region", { name: "Mes idées" });
    await expect(mes.getByText("Relevé mensuel en PDF")).toBeVisible();
    await expect(mes.getByText("Fenêtrage au clavier")).toHaveCount(0);
  });
});

test.describe("équipe IMAFRIK", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("le cockpit compte les idées nouvelles et mène aux reçues", async ({
    page,
  }) => {
    await page.goto("/admin");
    const ligne = page.getByRole("link", { name: /Idées nouvelles/ });
    await expect(ligne).toHaveAttribute("href", "/admin/idees?etat=recues");
    await ligne.click();
    await expect(page).toHaveURL(/\/admin\/idees\?etat=recues$/);
    const etats = bar(page).getByRole("group", { name: "État" });
    await expect(etats.getByRole("link", { name: /^Reçues/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    for (const article of await page.getByRole("article").all())
      await expect(
        article.locator('[data-idea-status="received"]'),
      ).toHaveCount(1);
  });

  test("filtre la boîte par rôle, chaque option comptée", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/admin/idees");
    const roles = bar(page).getByRole("group", { name: "Rôle" });
    const tous = roles.getByRole("link", { name: /^Tous les rôles/ });
    const radiologues = roles.getByRole("link", { name: /^Radiologue/ });
    const responsables = roles.getByRole("link", { name: /^Responsable/ });
    const nombre = await shown(radiologues);
    expect(nombre + (await shown(responsables))).toBe(await shown(tous));
    await radiologues.click();
    await expect(page).toHaveURL(/[?&]role=radiologue(&|$)/);
    await expect(page.getByRole("article")).toHaveCount(nombre);
    await expect(
      page.getByRole("heading", { name: "Relevé mensuel en PDF" }),
    ).toHaveCount(0);

    // Le regroupement se lit sur la carte de la regroupée.
    await expect(
      page.getByText("Même idée que « Fenêtrage au clavier »"),
    ).toBeVisible();
    await settle(page);
    await checkA11y();
  });

  test("cherche une idée sans l’écrire dans l’adresse", async ({ page }) => {
    await page.goto("/admin/idees");
    const champ = page.getByRole("searchbox", {
      name: "Rechercher une idée",
      exact: true,
    });
    await champ.fill("dictée");
    await champ.press("Enter");
    await expect(
      page.getByRole("heading", {
        name: "Ponctuation à la voix pendant la dictée",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Relevé mensuel en PDF" }),
    ).toHaveCount(0);
    expect(page.url()).not.toContain("dict");
  });
});

test.describe("en anglais", () => {
  test.use({ membership: "m-radio", langue: "en" });

  test("« Vos idées » se lit en anglais", async ({ page }) => {
    await page.goto("/idees?ecran=worklist");
    await expect(
      page.getByRole("heading", { name: "Your ideas", level: 1 }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("form", { name: "Suggest an idea" })
        .getByText("“To read” screen"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send the idea" }),
    ).toBeVisible();
  });
});
