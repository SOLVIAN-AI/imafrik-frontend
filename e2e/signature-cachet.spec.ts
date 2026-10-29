import type { Page } from "@playwright/test";

import { expect, test } from "./support/fixtures";

/**
 * Signature manuscrite, cachet et code personnel du radiologue.
 *
 * - paramètres : la carte montre la signature et le cachet acceptés et
 *   l'état du code ; un tracé trop rapide est refusé, un vrai tracé part
 *   avec le code ; un SVG ou un fichier trop lourd sont refusés sans
 *   envoi ; un code trop simple est refusé avant l'envoi ;
 * - écran de lecture : la fenêtre de signature montre ce qui sera apposé
 *   et demande le code ; « Signer » reste inactif sous six chiffres ;
 * - tour de contrôle : l'information du cockpit mène aux images à
 *   vérifier, la fenêtre montre l'image déposée à côté de celle qui
 *   s'imprime, un refus exige un motif.
 *
 * La démonstration n'enregistre rien : un geste valide aboutit au message
 * « indisponible en démonstration », preuve qu'il a franchi les contrôles
 * de l'écran. Le code, le PDF et les droits sont éprouvés côté service
 * (`tests/test_signing.py`).
 */

/** Une image PNG d'un pixel, assez pour passer les contrôles de l'écran. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** La carte « Signature et cachet » des paramètres. */
function carte(page: Page) {
  return page.locator("section#signature");
}

/** Instant de départ des tracés, sur l'horloge figée de la page. */
const DEBUT = new Date("2026-10-26T09:00:00Z").getTime();

/**
 * Trace une signature dans le cadre. L'horloge de la page est figée et
 * avancée à la main entre les points : la durée du tracé est celle que le
 * test fixe, sans attente réelle et quelle que soit la machine.
 */
async function tracer(page: Page, dureeMs: number) {
  const cadre = page.getByRole("img", { name: /Cadre de signature/ });
  const box = await cadre.boundingBox();
  if (!box) throw new Error("cadre de signature introuvable");
  const points = 12;
  await page.clock.setFixedTime(DEBUT);
  await page.mouse.move(box.x + 20, box.y + box.height / 2);
  await page.mouse.down();
  for (let index = 1; index <= points; index += 1) {
    await page.clock.setFixedTime(DEBUT + (dureeMs * index) / points);
    await page.mouse.move(
      box.x + 20 + ((box.width - 40) * index) / points,
      box.y + box.height / 2 + (index % 2 ? -30 : 30),
    );
  }
  await page.mouse.up();
}

test.describe("paramètres du radiologue", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("la carte montre signature, cachet et code personnel", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/parametres");
    const section = carte(page);
    await expect(
      section.getByRole("heading", { name: "Signature et cachet" }),
    ).toBeVisible();
    await expect(
      section.getByRole("img", { name: "Votre signature" }),
    ).toBeVisible();
    await expect(
      section.getByRole("img", { name: "Votre cachet" }),
    ).toBeVisible();
    await expect(section.getByText("Code personnel · Défini")).toBeVisible();
    await expect(
      section.getByText("Demandé à chaque signature et à chaque addendum."),
    ).toBeVisible();
    await checkA11y();
  });

  test("un tracé trop rapide est refusé, un vrai tracé part avec le code", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/parametres");
    await carte(page).getByRole("button", { name: "Tracer" }).click();
    const fenetre = page.getByRole("dialog", {
      name: "Tracer votre signature",
    });
    await expect(fenetre).toBeVisible();
    const envoyer = fenetre.getByRole("button", {
      name: "Envoyer à la vérification",
    });
    // Cadre vide : nom accessible du canevas, alternative d'import dite.
    await checkA11y();

    await tracer(page, 200);
    await expect(
      fenetre.getByText(/trop rapide pour une signature/),
    ).toBeVisible();
    await fenetre.getByRole("button", { name: "Effacer" }).click();

    await tracer(page, 1_200);
    await expect(fenetre.getByText(/trop rapide/)).toHaveCount(0);
    // Le code est défini : il est exigé, six chiffres.
    await expect(envoyer).toBeDisabled();
    await fenetre.getByLabel("Code personnel").fill("48291");
    await expect(envoyer).toBeDisabled();
    await fenetre.getByLabel("Code personnel").fill("482913");
    await envoyer.click();
    await expect(fenetre.getByRole("alert")).toContainText(
      "pas disponible en démonstration",
    );
  });

  test("un SVG ou un fichier trop lourd sont refusés sans envoi", async ({
    page,
  }) => {
    await page.goto("/parametres");
    const fichier = page.getByTestId("signing-file-stamp");
    await fichier.setInputFiles({
      name: "cachet.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"),
    });
    await expect(
      page.getByText("Déposez une image PNG ou JPEG."),
    ).toBeVisible();
    await fichier.setInputFiles({
      name: "cachet.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
    });
    await expect(page.getByText("Ce fichier dépasse 2 Mo.")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await fichier.setInputFiles({
      name: "cachet.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    const fenetre = page.getByRole("dialog", { name: "Importer votre cachet" });
    await expect(
      fenetre.getByRole("img", { name: "Image choisie" }),
    ).toBeVisible();
    await expect(fenetre.getByText("cachet.png")).toBeVisible();
  });

  test("un code trop simple est refusé avant l’envoi", async ({ page }) => {
    await page.goto("/parametres");
    await carte(page).getByRole("button", { name: "Changer le code" }).click();
    const fenetre = page.getByRole("dialog", {
      name: "Changer votre code personnel",
    });
    await fenetre.getByLabel("Code actuel").fill("482913");
    await fenetre.getByLabel("Nouveau code").fill("123456");
    await expect(fenetre.getByRole("alert")).toHaveText(
      "Ce code est trop simple à deviner : choisissez-en un autre.",
    );
    const changer = fenetre.getByRole("button", { name: "Changer le code" });
    await expect(changer).toBeDisabled();
    await fenetre.getByLabel("Nouveau code").fill("739104");
    await fenetre.getByLabel("Confirmation").fill("739105");
    await expect(fenetre.getByRole("alert")).toHaveText(
      "Les deux saisies du code ne concordent pas.",
    );
    await fenetre.getByLabel("Confirmation").fill("739104");
    await expect(changer).toBeEnabled();
    await changer.click();
    await expect(fenetre.getByRole("alert")).toContainText(
      "pas disponible en démonstration",
    );
  });

  test.describe("téléphone", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("la carte tient dans l’écran, sans défilement horizontal", async ({
      page,
    }) => {
      await page.goto("/parametres");
      await carte(page).scrollIntoViewIfNeeded();
      await expect(
        carte(page).getByRole("button", { name: "Tracer" }),
      ).toBeVisible();
      const debord = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(debord).toBeLessThanOrEqual(0);
    });
  });
});

test.describe("fenêtre de signature", () => {
  test.use({ membership: "m-radio", langue: "fr" });

  test("montre ce qui sera apposé et exige le code", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/lecture/2");
    const conclusion = page.getByRole("textbox", {
      name: "Conclusion",
      exact: true,
    });
    await conclusion.click();
    await page.keyboard.type("Examen sans particularité.");
    await page.getByRole("button", { name: "Signer", exact: true }).click();

    const fenetre = page.getByRole("dialog", {
      name: "Signer le compte-rendu",
    });
    await expect(fenetre.getByText("Apposés sur le PDF")).toBeVisible();
    await expect(
      fenetre.getByRole("img", { name: "Votre signature, apposée sur le PDF" }),
    ).toBeVisible();
    await expect(
      fenetre.getByRole("img", { name: "Votre cachet, apposé sur le PDF" }),
    ).toBeVisible();

    const signer = fenetre.getByRole("button", {
      name: /^Signer (et transmettre|quand même)$/,
    });
    await expect(signer).toBeDisabled();
    // Audit le bouton encore inactif : sa transition vers l'état actif
    // donnerait des contrastes de passage.
    await checkA11y();
    await fenetre.getByLabel("Code personnel").fill("48291");
    await expect(signer).toBeDisabled();
    await fenetre.getByLabel("Code personnel").fill("482913");
    await expect(signer).toBeEnabled();
    await signer.click();
    await expect(fenetre.getByRole("alert")).toContainText(
      "pas disponible en démonstration",
    );
  });
});

test.describe("tour de contrôle", () => {
  test.use({ membership: "m-admin", langue: "fr" });

  test("le cockpit mène aux images à vérifier, un refus exige un motif", async ({
    page,
    checkA11y,
  }) => {
    await page.goto("/admin");
    await page
      .getByRole("link", {
        name: /1 image de signature ou de cachet attend votre vérification/,
      })
      .click();
    await expect(page).toHaveURL("/admin/utilisateurs?signature=attente");
    const signatures = page
      .getByRole("group", { name: "Compte" })
      .getByRole("link", { name: /^Signature à vérifier/ });
    await expect(signatures).toHaveAttribute("aria-current", "true");
    await expect(signatures.locator("span[aria-hidden]")).toHaveText("1");

    await page.getByRole("button", { name: /Signature à vérifier/ }).click();
    const fenetre = page.getByRole("dialog", {
      name: "Signature et cachet de Pr Mawuli Agbeko",
    });
    await expect(
      fenetre.getByRole("img", { name: "Cachet imprimé aujourd’hui" }),
    ).toBeVisible();
    await expect(
      fenetre.getByRole("img", { name: "Cachet déposé, à vérifier" }),
    ).toBeVisible();
    await checkA11y();

    const cachet = fenetre.locator('[data-signing-review="stamp"]');
    await cachet.getByRole("button", { name: "Refuser", exact: true }).click();
    const refuser = cachet.getByRole("button", { name: "Refuser l’image" });
    await expect(refuser).toBeDisabled();
    await cachet
      .getByLabel("Motif du refus")
      .fill("Le numéro d’ordre est illisible.");
    await refuser.click();
    await expect(cachet.getByRole("alert")).toContainText(
      "pas disponible en démonstration",
    );
  });
});

test.describe("anglais", () => {
  test.use({ membership: "m-radio", langue: "en" });

  test("la carte se lit en anglais", async ({ page }) => {
    await page.goto("/parametres");
    const section = carte(page);
    await expect(
      section.getByRole("heading", { name: "Signature and stamp" }),
    ).toBeVisible();
    await expect(section.getByText("Personal code · Set")).toBeVisible();
    await expect(section.getByRole("button", { name: "Draw" })).toBeVisible();
  });
});
