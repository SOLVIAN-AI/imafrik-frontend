import { inspectLayout } from "./support/audit-mise-en-page";
import { expect, settle, test } from "./support/fixtures";

/**
 * Feuille blanche ou découpe proposée : le radiologue choisit, pour chaque
 * compte-rendu, la mise en page de son texte.
 *
 * Dans la démonstration, l'examen 2 (IRM de Kodjo MENSAH) a un brouillon
 * commencé en découpe proposée, l'examen 5 (échographie d'Afi DOSSEH) un
 * brouillon vierge, qui naît dans la mise en page des paramètres (cookie
 * de démonstration). Le compte-rendu signé de l'examen 15 a été rédigé sur
 * une feuille blanche.
 */

/** Cookie de la préférence de démonstration (`lib/demo/report-layout.ts`). */
const LAYOUT_COOKIE = "imafrik-demo-mise-en-page";

test.describe("radiologue", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("passer en feuille blanche réunit les rubriques, et y revenir les rétablit", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/lecture/2");
    const decoupe = page.getByRole("radio", { name: "Découpe proposée" });
    const feuille = page.getByRole("radio", { name: "Feuille blanche" });
    await expect(decoupe).toHaveAttribute("aria-checked", "true");

    await feuille.click();
    await expect(feuille).toHaveAttribute("aria-checked", "true");
    const texte = page.getByRole("textbox", { name: "Texte libre" });
    // Chaque rubrique rédigée devient un sous-titre de la feuille blanche.
    await expect(
      texte.getByRole("heading", { name: "Indication clinique" }),
    ).toBeVisible();
    await expect(
      texte.getByRole("heading", { name: "Résultats" }),
    ).toBeVisible();
    await expect(texte).toContainText("Céphalées inhabituelles évoluant");
    await expect(texte).toContainText("Pas d’argument pour un processus");
    // La conclusion reste à part, obligatoire.
    await expect(
      page.getByRole("textbox", { name: "Conclusion" }),
    ).toBeVisible();
    await expect(page.getByText("Obligatoire, à part")).toBeVisible();
    const sommaire = page.getByRole("navigation", {
      name: "Sections du compte-rendu",
    });
    await expect(sommaire.getByRole("link")).toHaveText([
      /Texte libre/,
      /Conclusion/,
    ]);
    // L'audit porte sur la notification une fois apparue, pas pendant son
    // fondu d'entrée.
    await expect(page.getByText("Rubriques réunies")).toBeVisible();
    await settle(page);
    await checkA11y();

    // Rien n'a été écrit depuis : la découpe revient à l'identique, sans
    // question.
    await decoupe.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Indication clinique" }),
    ).toContainText("Céphalées inhabituelles évoluant");
    await expect(
      page.getByRole("textbox", { name: "Comparatif" }),
    ).toContainText("Absence d’examen antérieur disponible.");
    await expect(
      page.getByRole("textbox", { name: "Texte libre" }),
    ).toHaveCount(0);
  });

  test("revenir à la découpe après avoir écrit place le texte dans « Résultats », après confirmation", async ({
    page,
  }) => {
    await page.goto("/lecture/2");
    await page.getByRole("radio", { name: "Feuille blanche" }).click();
    const texte = page.getByRole("textbox", { name: "Texte libre" });
    await texte.click();
    await page.keyboard.press("ControlOrMeta+End");
    await page.keyboard.type(" Contrôle dans trois mois.");

    await page.getByRole("radio", { name: "Découpe proposée" }).click();
    const confirmation = page.getByRole("dialog", {
      name: "Revenir à la découpe proposée ?",
    });
    await expect(confirmation).toContainText("Rien n’est effacé");

    // « Garder la feuille blanche » ne touche à rien.
    await confirmation
      .getByRole("button", { name: "Garder la feuille blanche" })
      .click();
    await expect(texte).toContainText("Contrôle dans trois mois.");

    await page.getByRole("radio", { name: "Découpe proposée" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Passer à la découpe proposée" })
      .click();
    const resultats = page.getByRole("textbox", { name: "Résultats" });
    await expect(resultats).toContainText("Contrôle dans trois mois.");
    await expect(resultats).toContainText("Céphalées inhabituelles évoluant");
    await expect(
      page.getByRole("radio", { name: "Découpe proposée" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  test("une feuille blanche vierge garde l'en-tête et exige sa conclusion pour signer", async ({
    page,
    context,
    baseURL,
    checkA11y,
  }) => {
    await context.addCookies([
      { name: LAYOUT_COOKIE, value: "free", url: baseURL ?? "" },
    ]);
    await page.goto("/lecture/5");
    await expect(
      page.getByRole("radio", { name: "Feuille blanche" }),
    ).toHaveAttribute("aria-checked", "true");

    // Ce qui n'est pas le texte est en place, verrouillé.
    const entete = page
      .getByRole("banner", { name: "Parties automatiques du document" })
      .or(
        page.locator("header[aria-label='Parties automatiques du document']"),
      );
    await expect(entete).toContainText("Polyclinique de Kara");
    await expect(entete).toContainText("Kara");
    await expect(entete).toContainText("DOSSEH Afi");
    await expect(entete).toContainText("PKA-01190");
    await expect(entete).toContainText("Automatique");
    const pied = page.locator(
      "footer[aria-label='Parties automatiques du document']",
    );
    await expect(pied).toContainText("QR de vérification");
    await expect(pied.getByRole("img", { name: "IMAFRIK" })).toBeVisible();
    await checkA11y();

    await page.getByRole("textbox", { name: "Texte libre" }).click();
    await page.keyboard.type("Utérus antéversé, de taille normale.");
    await page.getByRole("button", { name: "Signer" }).first().click();
    const signature = page.getByRole("dialog");
    await expect(signature).toContainText("Conclusion");
    await expect(
      signature.getByRole("button", { name: /Signer et transmettre/ }),
    ).toBeDisabled();
    await signature
      .getByRole("button", { name: "Continuer à rédiger" })
      .click();

    await page.getByRole("textbox", { name: "Conclusion" }).click();
    await page.keyboard.type("Échographie pelvienne normale.");
    await page.getByRole("button", { name: "Signer" }).first().click();
    await expect(page.getByRole("dialog")).not.toContainText(
      "section obligatoire",
    );
  });

  test("un modèle en feuille blanche ouvre une feuille blanche", async ({
    page,
  }) => {
    await page.goto("/lecture/5");
    await expect(
      page.getByRole("radio", { name: "Découpe proposée" }),
    ).toHaveAttribute("aria-checked", "true");
    await page.getByRole("button", { name: "Modèle", exact: true }).click();
    await page
      .getByRole("menuitem", { name: /Échographie pelvienne, feuille blanche/ })
      .click();
    await expect(
      page.getByRole("radio", { name: "Feuille blanche" }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      page.getByRole("textbox", { name: "Texte libre" }),
    ).toContainText("Ovaires de taille");
  });

  test("les paramètres règlent la mise en page des prochains comptes-rendus", async ({
    page,
  }) => {
    await page.goto("/parametres");
    const rubrique = page.locator("form", {
      has: page.getByRole("heading", { name: "Rédaction des comptes-rendus" }),
    });
    await expect(rubrique).toContainText("l’en-tête de la clinique");
    await rubrique.getByRole("radio", { name: /Feuille blanche/ }).check();
    await rubrique.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Mise en page enregistrée")).toBeVisible();

    await page.goto("/lecture/5");
    await expect(
      page.getByRole("radio", { name: "Feuille blanche" }),
    ).toHaveAttribute("aria-checked", "true");
    // Un brouillon déjà commencé garde sa mise en page.
    await page.goto("/lecture/2");
    await expect(
      page.getByRole("radio", { name: "Découpe proposée" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  test.describe("sur un téléphone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("la feuille blanche tient sans défilement en largeur", async ({
      page,
    }) => {
      await page.goto("/lecture/2");
      await page.getByRole("tab", { name: "Compte-rendu" }).click();
      await page.getByRole("radio", { name: "Feuille blanche" }).click();
      await expect(
        page.getByRole("textbox", { name: "Conclusion" }),
      ).toBeVisible();
      await settle(page);
      const issues = await page.evaluate(inspectLayout, { mobile: true });
      expect(
        issues
          .filter((issue) => issue.kind === "page-overflow-x")
          .map((issue) => issue.detail),
      ).toEqual([]);
    });
  });
});

test.describe("clinique", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("lit un compte-rendu rédigé sur une feuille blanche, conclusion à part", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/comptes-rendus/r-15");
    const document = page.locator("article[data-layout='free']");
    await expect(document).toContainText("Repères chirurgicaux");
    await expect(
      document.getByRole("heading", { name: "Conclusion" }),
    ).toBeVisible();
    await expect(document).toContainText("Pansinusite antérieure");
    // Aucun intitulé de la découpe n'est inventé.
    await expect(document.getByText("Indication clinique")).toHaveCount(0);
    await checkA11y();
  });
});
