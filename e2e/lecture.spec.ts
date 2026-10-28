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

/**
 * Un compte-rendu signé ne se modifie plus : l'écran de lecture mène à
 * son addendum. Retour d'un radiologue, octobre 2026 : sans ce lien, il
 * cherchait comment corriger un texte qu'il venait de signer.
 */
test("un compte-rendu signé se corrige par un addendum", async ({ page }) => {
  await page.goto("/lecture/10");
  await expect(page.getByText(/se fait par un addendum/)).toBeVisible();
  const corriger = page.getByRole("link", {
    name: "Corriger par un addendum",
  });
  await expect(corriger).toHaveAttribute(
    "href",
    /^\/comptes-rendus\/[^/]+#addenda$/,
  );
  await corriger.click();
  await expect(page.locator("#addenda")).toBeVisible();
  await expect(page.getByLabel("Nouvel addendum")).toBeVisible();
});

/**
 * Plein écran refusé par le navigateur (messagerie, Safari sur iPhone) :
 * le volet d'images couvre quand même toute la fenêtre. Signalé le
 * 17 octobre 2026 : le bouton ne faisait rien.
 */
test("le plein écran couvre la fenêtre quand le navigateur le refuse", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Element.prototype.requestFullscreen = () =>
      Promise.reject(new Error("refusé"));
  });
  await page.goto("/lecture/1");
  await page
    .getByRole("button", { name: "Ouvrir les images en plein écran" })
    .click();
  const pane = page.locator('[data-fullscreen="window"]');
  await expect(pane).toBeVisible();
  const box = await pane.boundingBox();
  const viewport = page.viewportSize();
  expect(box?.width).toBe(viewport?.width);
  expect(box?.height).toBe(viewport?.height);
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-fullscreen]")).toHaveCount(0);
});

/**
 * Un glissé horizontal du pavé tactile ne quitte pas l'écran de lecture.
 *
 * Signalé le 28 octobre 2026 : glisser à deux doigts vers la droite
 * faisait glisser toute la page vers l'écran précédent, au risque de
 * quitter un compte-rendu en cours. Le navigateur de test n'a pas de pavé
 * tactile : on vérifie ce qui empêche le geste (la racine ne le propage
 * pas, la molette horizontale est annulée sur chaque volet), et qu'il n'a
 * rien déplacé. La molette verticale, elle, reste à la page.
 */
test("un glissé horizontal ne fait pas revenir à la page précédente", async ({
  page,
}) => {
  await page.goto("/worklist");
  await page.goto("/lecture/1");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const adresse = page.url();

  const racine = await page.evaluate(() => ({
    html: getComputedStyle(document.documentElement).overscrollBehaviorX,
    body: getComputedStyle(document.body).overscrollBehaviorX,
  }));
  expect(racine).toEqual({ html: "none", body: "none" });

  await page.evaluate(() => {
    const fenetre = window as unknown as { annulees: boolean[] };
    fenetre.annulees = [];
    window.addEventListener("wheel", (event) =>
      fenetre.annulees.push(event.defaultPrevented),
    );
  });
  // Relevé sans le vider : un sondage qui lirait à mi-geste ne perd rien.
  const annulees = () =>
    page.evaluate(() => [
      ...(window as unknown as { annulees: boolean[] }).annulees,
    ]);
  const oublier = () =>
    page.evaluate(() => {
      (window as unknown as { annulees: boolean[] }).annulees.length = 0;
    });

  for (const volet of ["#viewer", "#report", "header"]) {
    const boite = await page.locator(volet).first().boundingBox();
    expect(boite, volet).not.toBeNull();
    if (!boite) continue;
    await page.mouse.move(
      boite.x + boite.width / 2,
      boite.y + boite.height / 2,
    );
    await oublier();
    await page.mouse.wheel(-240, 0);
    await page.mouse.wheel(240, 0);
    await expect.poll(annulees, { message: volet }).toEqual([true, true]);
  }

  // La molette verticale sur le compte-rendu n'est pas retenue.
  const compteRendu = await page.locator("#report").boundingBox();
  if (compteRendu) {
    await page.mouse.move(
      compteRendu.x + compteRendu.width / 2,
      compteRendu.y + compteRendu.height / 2,
    );
  }
  await oublier();
  await page.mouse.wheel(0, 240);
  await expect.poll(annulees).toEqual([false]);

  await expect(page).toHaveURL(adresse);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});

/** Ailleurs, le geste du navigateur reste : rien n'est posé hors de la lecture. */
test("hors de l'écran de lecture, le glissé reste celui du navigateur", async ({
  page,
}) => {
  await page.goto("/worklist");
  await expect(page.locator("table a[data-row-link]").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).overscrollBehaviorX,
    ),
  ).toBe("auto");
});
