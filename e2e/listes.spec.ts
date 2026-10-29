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
   * « Examen suivant » suit l'ordre de la file, par échéance, parmi ce qui
   * est confié au radiologue : l'urgence de Kara, à neuf minutes de son
   * terme, passe devant l'urgence arrivée depuis et devant l'examen qui
   * lui est attribué. La routine de Kara, en retard mais attribuée à
   * personne, ne lui est pas proposée : il ne la voit pas.
   */
  test("l'examen suivant est la tête de la file, par échéance", async ({
    page,
  }) => {
    await page.goto("/lecture/10");
    const suivant = page.getByRole("link", { name: "Examen suivant" });
    await expect(suivant).toHaveAttribute("href", "/lecture/7");
  });

  test("la liste des examens de la clinique ne lui est pas ouverte", async ({
    page,
  }) => {
    await page.goto("/examens");
    await expect(page).toHaveURL(/\/worklist$/);
    await page.goto("/examens/8");
    await expect(page).toHaveURL(/\/lecture\/8$/);
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

test.describe("clinique", () => {
  test.use({ membership: "m-clinic" });

  test("l'en-tête donne le total exact, le pied mène à la suite", async ({
    page,
  }) => {
    await page.goto("/examens");
    await expect(
      page.getByText("9 examens · Clinique Saint-Joseph"),
    ).toBeVisible();
    // Tout tient en une page : pas de pied de pagination.
    await expect(
      page.getByRole("navigation", { name: "Pages de la liste" }),
    ).toHaveCount(0);

    await page.goto("/examens?apres=demo-recent-5");
    await expect(
      page.getByText("9 examens · Clinique Saint-Joseph"),
    ).toBeVisible();
    const pied = page.getByRole("navigation", { name: "Pages de la liste" });
    await expect(pied.getByText("4 affichés sur 9")).toBeVisible();
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
      page.getByText("9 examens · Clinique Saint-Joseph"),
    ).toBeVisible();
  });

  /**
   * L'état « À attribuer » ne garde que ce qu'aucun radiologue ne voit
   * encore : l'urgence de Saint-Joseph, sans titulaire. Sa puce le compte.
   */
  test("l’état « À attribuer » ne garde que ce qui attend un radiologue", async ({
    page,
  }) => {
    await page.goto("/examens");
    const etats = page.getByRole("group", { name: "État" });
    const aAttribuer = etats.getByRole("link", { name: /^À attribuer/ });
    await expect(aAttribuer.locator("span[aria-hidden]")).toHaveText("1");
    await aAttribuer.click();
    await expect(page).toHaveURL(/[?&]etat=a-attribuer(&|$)/);
    await expect(aAttribuer).toHaveAttribute("aria-current", "true");
    await expect(
      page.getByText("1 examen · Clinique Saint-Joseph"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Attribuer l’examen de / }),
    ).toHaveCount(1);
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
