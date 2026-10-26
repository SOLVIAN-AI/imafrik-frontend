import type { Page } from "@playwright/test";

import { inspectLayout } from "./support/audit-mise-en-page";
import { expect, settle, test, type Theme } from "./support/fixtures";

/**
 * Page d'accueil : ce que ses tests génériques (accessibilité, mise en
 * page, langues) ne voient pas.
 *
 * - **Le ciné de l'accroche** : l'affiche d'abord, la vidéo ensuite, une
 *   commande pour l'arrêter ; rien ne bouge ni ne se télécharge avec
 *   « moins de mouvement ».
 * - **Les captures du produit** : des onglets au clavier, selon le motif de
 *   l'ARIA.
 * - **L'apparition au défilement** : tout le contenu finit visible, et
 *   l'audit d'accessibilité est repris page entière parcourue, là où
 *   l'audit générique ne voit que le haut de la page.
 * - **Les extrêmes de largeur** : de 320 à 2560 pixels, sans débordement.
 * - **Les crédits des images**, exigés par leur licence, à un clic du pied
 *   de page.
 */

/** Libellés attendus, écrits ici plutôt qu'importés de `src/`. */
const COPY = {
  fr: {
    path: "/",
    pause: "Mettre en pause le défilement des coupes",
    play: "Lire le défilement des coupes",
    tabs: ["File de lecture", "Compte-rendu signé", "Tableau de bord"],
    credits: "Crédits des images",
  },
  en: {
    path: "/en",
    pause: "Pause the slice scroll",
    play: "Play the slice scroll",
    tabs: ["Reading worklist", "Signed report", "Dashboard"],
    credits: "Image credits",
  },
} as const;

/** Parcourt la page jusqu'en bas, par demi-écrans, puis revient en haut. */
async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
}

test.describe("ciné de l'accroche", () => {
  test.use({ langue: "fr" });

  test("l'affiche s'affiche d'abord, puis la vidéo joue et se met en pause", async ({
    page,
  }) => {
    await page.goto("/");
    const viewer = page.getByRole("toolbar", { name: "Outils du visualiseur" });
    // L'affiche est une vraie image, décrite, chargée en priorité.
    const poster = page.getByRole("img", {
      name: /coupes sagittales d’une véritable IRM cérébrale/,
    });
    await expect(poster).toBeVisible();
    await expect(poster).toHaveAttribute("fetchpriority", "high");
    await expect(poster).toHaveJSProperty("complete", true);

    // La vidéo n'est demandée qu'après le chargement, puis prend le relais.
    const video = page.locator("video.cine-video");
    await expect(video).toHaveAttribute("data-playing", "", {
      timeout: 15_000,
    });
    await expect(video).toHaveJSProperty("paused", false);
    await expect(video).toHaveJSProperty("muted", true);

    // Le numéro de coupe suit l'image.
    const slice = page.getByText(/^Im \d+ \/ 256$/);
    const first = await slice.textContent();
    await expect(slice).not.toHaveText(first ?? "", { timeout: 5_000 });

    const pause = viewer.getByRole("button", { name: COPY.fr.pause });
    await expect(pause).toHaveAttribute("aria-pressed", "true");
    await pause.click();
    await expect(video).toHaveJSProperty("paused", true);
    const play = viewer.getByRole("button", { name: COPY.fr.play });
    await expect(play).toHaveAttribute("aria-pressed", "false");
    await play.click();
    await expect(video).toHaveJSProperty("paused", false);
  });

  test.describe("avec « moins de mouvement »", () => {
    test.use({ reducedMotion: "reduce" });

    test("rien ne démarre ni ne se télécharge, sauf à la demande", async ({
      page,
    }) => {
      const videos: string[] = [];
      page.on("request", (request) => {
        if (request.url().endsWith(".mp4")) videos.push(request.url());
      });
      await page.goto("/");
      await settle(page);
      await page.waitForTimeout(3_000);
      await expect(page.locator("video")).toHaveCount(0);
      expect(videos).toEqual([]);

      // Le visiteur peut tout de même lancer le ciné.
      await page.getByRole("button", { name: COPY.fr.play }).click();
      await expect(page.locator("video.cine-video")).toHaveAttribute(
        "data-playing",
        "",
      );
    });

    test("tout le contenu est visible sans défiler", async ({ page }) => {
      await page.goto("/");
      await settle(page);
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-reveal-ready",
      );
      const hidden = await page
        .locator("[data-reveal]")
        .evaluateAll(
          (nodes) =>
            nodes.filter((node) => getComputedStyle(node).opacity !== "1")
              .length,
        );
      expect(hidden).toBe(0);
    });
  });
});

for (const langue of ["fr", "en"] as const) {
  test(`captures du produit (${langue}) : onglets au clavier`, async ({
    page,
  }) => {
    const copy = COPY[langue];
    await page.goto(copy.path);
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveText([...copy.tabs]);
    const [first, second, third] = copy.tabs;
    const panel = page.getByRole("tabpanel");
    await expect(panel).toHaveAccessibleName(first);

    await page.getByRole("tab", { name: first }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: second })).toBeFocused();
    await expect(page.getByRole("tab", { name: second })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(panel).toHaveAccessibleName(second);
    // Une seule capture décrite à la fois : celle de l'onglet choisi.
    await expect(panel.locator("img:not([alt=''])")).toHaveCount(1);

    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: third })).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: first })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByRole("tab", { name: third })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // Un seul arrêt de tabulation sur la liste.
    await expect(page.locator("[role=tab][tabindex='0']")).toHaveCount(1);
  });
}

const THEMES: Theme[] = ["dark", "light"];

for (const langue of ["fr", "en"] as const) {
  for (const theme of THEMES) {
    test.describe(`page parcourue (${langue}, ${theme})`, () => {
      test.use({ langue, theme, colorScheme: theme });

      test("tout apparaît, sans violation d'accessibilité", async ({
        page,
        checkA11y,
      }) => {
        await page.goto(COPY[langue].path);
        await expect(page.locator("html")).toHaveClass(
          new RegExp(`\\b${theme}\\b`),
        );
        await scrollThrough(page);
        await expect(
          page.locator("[data-reveal]:not([data-revealed])"),
        ).toHaveCount(0);
        await settle(page);
        await checkA11y();
      });
    });
  }
}

for (const width of [320, 2560]) {
  test.describe(`largeur ${width} px`, () => {
    test.use({ viewport: { width, height: 900 }, langue: "fr" });

    test("sans anomalie de mise en page", async ({ page }) => {
      await page.goto("/");
      await scrollThrough(page);
      await settle(page);
      const issues = await page.evaluate(inspectLayout, {
        mobile: width < 768,
      });
      expect(issues.map((issue) => `${issue.kind} : ${issue.detail}`)).toEqual(
        [],
      );
    });
  });
}

for (const langue of ["fr", "en"] as const) {
  test(`crédits des images (${langue}) : liés du pied de page, sources citées`, async ({
    page,
  }) => {
    await page.goto(COPY[langue].path);
    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: COPY[langue].credits })
      .click();
    await expect(page).toHaveURL(langue === "fr" ? "/credits" : "/en/credits");
    await expect(page.locator("h1")).toHaveText(COPY[langue].credits);
    for (const doi of [
      "10.7937/3RAG-D070",
      "10.7937/C5KE-YX42",
      "10.7937/K9/TCIA.2015.LO9QL9SX",
    ])
      await expect(
        page.getByRole("link", { name: `doi:${doi}` }),
      ).toHaveAttribute("href", `https://doi.org/${doi}`);
    await expect(
      page.getByRole("link", { name: "CC BY 4.0" }).first(),
    ).toHaveAttribute("href", "https://creativecommons.org/licenses/by/4.0/");
  });
}
