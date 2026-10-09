import { expect, test } from "./support/fixtures";

/**
 * Parcours clinique d'un examen, côté clinique.
 *
 * - la fiche d'un examen pas encore rendu propose de signaler une urgence
 *   et de compléter le renseignement clinique ; en démonstration,
 *   l'enregistrement est refusé avec un message clair, sans rien changer ;
 * - le volet disparaît une fois le compte-rendu signé, et n'est jamais
 *   proposé au radiologue ;
 * - un nom de patient se cherche tel qu'il s'affiche (« KOFFI Ama »), et
 *   non tel que DICOM le stocke (« KOFFI^Ama »).
 */

test.describe("clinique, en français", () => {
  test.use({ membership: "m-clinic", langue: "fr" });

  test("la fiche d’un examen en cours propose l’urgence et le renseignement", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/examens/2");
    const volet = page.getByRole("form", {
      name: "Urgence et renseignement clinique",
    });
    await expect(volet).toBeVisible();

    const urgent = volet.getByRole("checkbox", { name: /Examen urgent/ });
    const renseignement = volet.getByRole("textbox", {
      name: "Renseignement clinique",
    });
    const enregistrer = volet.getByRole("button", { name: "Enregistrer" });
    await expect(urgent).not.toBeChecked();
    await expect(renseignement).toHaveValue(
      "Céphalées inhabituelles depuis trois semaines.",
    );
    // Rien à enregistrer tant que rien n'a changé.
    await expect(enregistrer).toBeDisabled();
    await checkA11y();

    await urgent.check();
    await renseignement.fill("Céphalées brutales, suspicion d’AVC.");
    await expect(enregistrer).toBeEnabled();
    await enregistrer.click();
    await expect(
      page.getByText(
        "L’enregistrement de l’urgence et du renseignement clinique n’est pas disponible en démonstration",
        { exact: false },
      ),
    ).toBeVisible();
  });

  test("un examen rendu n’est plus modifiable", async ({ page }) => {
    await page.goto("/examens/4");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(
      page.getByRole("form", { name: "Urgence et renseignement clinique" }),
    ).toHaveCount(0);
  });

  test("un nom se cherche tel qu’il s’affiche", async ({ page }) => {
    await page.goto("/examens");
    const recherche = page.getByRole("searchbox", {
      name: "Rechercher un patient ou une modalité",
    });
    await recherche.fill("koffi  ama");
    await recherche.press("Enter");
    // La liste existe en tableau et en cartes (téléphone) : seule la vue
    // affichée compte.
    await expect(page.getByText("MENSAH Kodjo")).toHaveCount(0);
    await expect(
      page.getByText("KOFFI Ama").filter({ visible: true }).first(),
    ).toBeVisible();
  });
});

test.describe("clinique, en anglais", () => {
  test.use({ membership: "m-clinic", langue: "en" });

  test("the clinical panel is translated", async ({ page }) => {
    await page.goto("/examens/2");
    const volet = page.getByRole("form", {
      name: "Urgency and clinical information",
    });
    await expect(volet).toBeVisible();
    await expect(
      volet.getByRole("checkbox", { name: /Urgent examination/ }),
    ).toBeVisible();
    await expect(volet.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});

test.describe("radiologue", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("le radiologue ne modifie ni l’urgence ni le renseignement", async ({
    page,
  }) => {
    await page.goto("/examens/2");
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(
      page.getByRole("form", { name: "Urgence et renseignement clinique" }),
    ).toHaveCount(0);
  });
});
