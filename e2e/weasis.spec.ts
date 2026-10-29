import { devices } from "@playwright/test";

import { expect, test } from "./support/fixtures";

/**
 * « Ouvrir dans Weasis », à côté du viewer de l'écran de lecture.
 *
 * Weasis s'installe sur un ordinateur : le bouton n'existe ni sur
 * tablette ni sur téléphone. Il est au radiologue et à l'équipe IMAFRIK
 * en consultation, pas au personnel des cliniques, qui garde le viewer.
 * En démonstration, aucun PACS n'existe : l'ouverture l'explique, et
 * l'aide d'installation reste lisible.
 */

const OFFICIAL_DOWNLOAD =
  "https://weasis.org/en/getting-started/download-dicom-viewer/";

/** Un appareil Playwright, sans le choix du navigateur (fixé par le projet). */
function device(name: keyof typeof devices) {
  const rest: Partial<(typeof devices)[string]> = { ...devices[name] };
  delete rest.defaultBrowserType;
  return rest;
}

test.describe("radiologue, sur ordinateur", () => {
  test.use({ membership: "m-radio" });

  test("ouvre l’examen dans Weasis, ou explique pourquoi pas", async ({
    page,
  }) => {
    await page.goto("/lecture/1");
    const ouvrir = page.getByRole("button", { name: "Ouvrir dans Weasis" });
    await expect(ouvrir).toBeVisible();
    // À côté du viewer, qui reste celui de l'écran.
    await expect(page.locator('[data-tour="viewer"]')).toContainText(
      "Ouvrir dans Weasis",
    );

    await ouvrir.click();
    await expect(
      page.getByText(
        "L’ouverture dans Weasis n’est pas disponible en démonstration",
      ),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/lecture\/1$/);
  });

  test("l’aide mène au téléchargement officiel et dit de fermer Weasis", async ({
    page,
  }) => {
    await page.goto("/lecture/1");
    await page.getByRole("button", { name: "Aide sur Weasis" }).click();

    const aide = page.getByRole("dialog", {
      name: "Ouvrir l’examen dans Weasis",
    });
    await expect(aide).toBeVisible();
    const lien = aide.getByRole("link", {
      name: "Télécharger Weasis (site officiel)",
    });
    await expect(lien).toHaveAttribute("href", OFFICIAL_DOWNLOAD);
    await expect(lien).toHaveAttribute("target", "_blank");
    await expect(lien).toHaveAttribute("rel", /noopener/);
    await expect(aide).toContainText("fermez-le après chaque lecture");
    await expect(aide.getByRole("listitem")).toHaveCount(3);

    await aide.getByRole("button", { name: "Fermer" }).last().click();
    await expect(aide).toBeHidden();
  });

  test("sur un écran de 1024 px, l’icône seule garde son nom", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto("/lecture/1");
    const ouvrir = page.getByRole("button", { name: "Ouvrir dans Weasis" });
    await expect(ouvrir).toBeVisible();
    await expect(ouvrir).toHaveAttribute(
      "title",
      "Ouvrir l’examen dans Weasis, installé sur cet ordinateur",
    );
  });
});

test.describe("en anglais", () => {
  test.use({ membership: "m-radio", langue: "en" });

  test("le bouton et l’aide parlent anglais", async ({ page }) => {
    await page.goto("/lecture/1");
    await expect(
      page.getByRole("button", { name: "Open in Weasis" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Weasis help" }).click();
    await expect(
      page
        .getByRole("dialog", { name: "Open the examination in Weasis" })
        .getByRole("link", { name: "Download Weasis (official site)" }),
    ).toHaveAttribute("href", OFFICIAL_DOWNLOAD);
  });
});

for (const [appareil, name] of [
  ["tablette", "iPad Pro 11 landscape"],
  ["tablette Android", "Galaxy Tab S9 landscape"],
  ["téléphone", "Pixel 7"],
] as const) {
  test.describe(`radiologue, sur ${appareil}`, () => {
    test.use({ membership: "m-radio", ...device(name) });

    test("Weasis n’est pas proposé", async ({ page }) => {
      await page.goto("/lecture/1");
      await expect(page.locator('[data-tour="viewer"]')).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Ouvrir dans Weasis" }),
      ).toHaveCount(0);
    });
  });
}

test.describe("équipe IMAFRIK, en consultation", () => {
  test.use({ membership: "m-admin" });

  test("Weasis est proposé", async ({ page }) => {
    await page.goto("/lecture/1");
    await expect(
      page.getByRole("button", { name: "Ouvrir dans Weasis" }),
    ).toBeVisible();
  });
});

test.describe("clinique", () => {
  test.use({ membership: "m-clinic" });

  test("Weasis n’est pas proposé au personnel de la clinique", async ({
    page,
  }) => {
    await page.goto("/lecture/1");
    await expect(page.locator('[data-tour="viewer"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ouvrir dans Weasis" }),
    ).toHaveCount(0);
  });
});
