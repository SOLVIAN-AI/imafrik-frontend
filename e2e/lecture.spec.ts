import { expect, test } from "./support/fixtures";

/**
 * Écran de lecture, ouvert depuis la file.
 *
 * Les cliniques de démonstration reçoivent leurs comptes-rendus en
 * français. Une pastille le signale au radiologue dont l'interface est
 * dans une autre langue, et seulement à lui : en français, elle n'a rien
 * à dire et n'apparaît pas.
 */

test.use({ membership: "m-radio" });

for (const { langue, pastille, absente } of [
  { langue: "fr", pastille: null, absente: /Compte-rendu en/ },
  { langue: "en", pastille: "Report in French", absente: null },
] as const) {
  test.describe(`interface en ${langue}`, () => {
    test.use({ langue });

    test(`la lecture s'ouvre depuis la file${pastille ? ", avec la langue du compte-rendu" : ""}`, async ({
      page,
    }) => {
      await page.goto("/worklist");
      const premier = page.locator("table a[data-row-link]").first();
      const patient = (await premier.innerText()).trim();
      const href = await premier.getAttribute("href");
      expect(href).toMatch(/^\/lecture\/[^/]+$/);

      await premier.click();
      await expect(page).toHaveURL(href ?? "");
      // La barre de contexte nomme le patient : c'est le titre de l'écran.
      const titre = page.getByRole("heading", { level: 1, name: patient });
      await expect(titre).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", langue);

      const barre = page.locator("header", { has: titre });
      // La pastille porte aussi une explication réservée aux lecteurs
      // d'écran : son texte commence par le libellé visible.
      if (pastille) await expect(barre.getByText(pastille)).toBeVisible();
      if (absente) await expect(barre.getByText(absente)).toHaveCount(0);
    });
  });
}

/**
 * Les surimpressions du viewer, aux quatre coins, ne se chevauchent jamais.
 *
 * Régression : chaque coin était limité à 45 % de la largeur, ce qui ne
 * tenait qu'au-delà de 240 px. Sur un téléphone, pendant la mise en place
 * du volet, le nom du patient recouvrait celui de la clinique. La zone est
 * ici réduite à 160 px, bien en deçà de l'ancien seuil.
 */
test("les surimpressions du viewer ne se chevauchent pas, même étroites", async ({
  page,
}) => {
  await page.goto("/lecture/1");
  const corners = page.locator("div.pointer-events-none.absolute.font-mono");
  await expect(corners).toHaveCount(4);

  const overlaps = await corners.first().evaluate((corner) => {
    const scan = corner.parentElement as HTMLElement;
    scan.style.width = "160px";
    const boxes = [
      ...scan.querySelectorAll<HTMLElement>(":scope > div.pointer-events-none"),
    ].map((element) => element.getBoundingClientRect());
    const [topLeft, topRight, bottomLeft, bottomRight] = boxes;
    const collide = (a: DOMRect, b: DOMRect) =>
      a.right > b.left && a.left < b.right;
    return [collide(topLeft, topRight), collide(bottomLeft, bottomRight)];
  });
  expect(overlaps).toEqual([false, false]);
});
