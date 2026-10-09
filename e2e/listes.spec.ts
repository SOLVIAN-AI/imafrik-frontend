import { expect, test } from "./support/fixtures";

/**
 * Listes d'examens : ordre, total et pagination, en démonstration.
 *
 * Le jeu de démonstration se pagine comme le service (curseur lié à
 * l'ordre de tri, total exact) ; quinze examens tiennent en une page, les
 * pages suivantes s'ouvrent donc par leur curseur.
 */

test.describe("radiologue", () => {
  test.use({ membership: "m-radio" });

  /**
   * « Examen suivant » suit l'ordre de la file, par échéance. La routine
   * reçue il y a plus de cinq heures (délai de deux heures dépassé) passe
   * devant les urgences arrivées depuis : l'écran proposait auparavant
   * l'urgence la plus ancienne, quelle que soit son échéance.
   */
  test("l'examen suivant est la tête de la file, retards en tête", async ({
    page,
  }) => {
    await page.goto("/lecture/10");
    const suivant = page.getByRole("link", { name: "Examen suivant" });
    await expect(suivant).toHaveAttribute("href", "/lecture/3");
  });

  test("l'en-tête donne le total exact, le pied mène à la suite", async ({
    page,
  }) => {
    await page.goto("/examens");
    await expect(
      page.getByText("15 examens · IMAFRIK Radiologie"),
    ).toBeVisible();
    // Tout tient en une page : pas de pied de pagination.
    await expect(
      page.getByRole("navigation", { name: "Pages de la liste" }),
    ).toHaveCount(0);

    await page.goto("/examens?apres=demo-recent-10");
    await expect(
      page.getByText("15 examens · IMAFRIK Radiologie"),
    ).toBeVisible();
    const pied = page.getByRole("navigation", { name: "Pages de la liste" });
    await expect(pied.getByText("5 affichés sur 15")).toBeVisible();
    await expect(pied.getByRole("link", { name: "Page suivante" })).toHaveCount(
      0,
    );
    const debut = pied.getByRole("link", { name: "Revenir au début" });
    await expect(debut).toHaveAttribute("href", "/examens");
    await debut.click();
    await expect(page).toHaveURL(/\/examens$/);
  });

  test("un curseur d'un autre ordre ramène au début de la liste", async ({
    page,
  }) => {
    await page.goto("/examens?apres=demo-deadline-3");
    await expect(page).toHaveURL(/\/examens$/);
    await expect(
      page.getByText("15 examens · IMAFRIK Radiologie"),
    ).toBeVisible();
  });

  /**
   * La recherche des comptes-rendus est faite par le service, sur tout le
   * périmètre : elle ne filtrait que la page affichée.
   */
  test("la recherche des comptes-rendus passe par le service", async ({
    page,
  }) => {
    await page.goto("/comptes-rendus");
    await expect(page.getByText("ADJOVI Mawuli")).toBeVisible();
    const champ = page.getByRole("searchbox", {
      name: "Rechercher un patient ou une modalité",
    });
    await champ.fill("kpodar");
    await champ.press("Enter");
    await expect(page.getByText("KPODAR Akossiwa")).toBeVisible();
    await expect(page.getByText("ADJOVI Mawuli")).toHaveCount(0);
    // Rien dans l'adresse : la recherche porte un nom de patient.
    expect(page.url()).not.toContain("kpodar");
  });
});

test.describe("administration", () => {
  test.use({ membership: "m-admin" });

  test("la vue des urgences en cours est filtrée et comptée par le service", async ({
    page,
  }) => {
    await page.goto("/admin/examens?urgent=1");
    await expect(page.getByText("2 urgences pas encore rendues")).toBeVisible();
    await page.goto("/admin/examens");
    await expect(
      page.getByText("15 examens, toutes organisations confondues"),
    ).toBeVisible();
  });
});
