import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

import { expect, test } from "../support/fixtures";
import {
  creerCompte,
  habiliterRadiologue,
  ingererExamen,
  ORGANISATIONS,
  rattacher,
  sql,
} from "./support/pile";
import { enrolerSecondFacteur, seConnecter } from "./support/session";

/**
 * Le circuit complet d'un examen, de la passerelle à la vérification.
 *
 * 1. L'examen arrive par le webhook d'ingestion de l'API, avec le secret
 *    partagé, comme l'enverrait le script Lua d'Orthanc.
 * 2. Le radiologue (second facteur réel) le trouve dans sa file, le prend
 *    en charge, rédige et signe : l'API rend le PDF avec WeasyPrint (Pango
 *    et Cairo de l'image de production) et le dépose sur le stockage
 *    compatible S3 de la pile, qui tient lieu de R2.
 * 3. La clinique télécharge le PDF signé.
 * 4. La page publique de vérification reconnaît le code du QR code, et
 *    l'empreinte du fichier téléchargé.
 */

test.use({ langue: "fr" });

// Enrôlement, rendu du PDF et deux sessions : plus long qu'un écran seul.
test.setTimeout(120_000);

test("un examen ingéré est lu, signé, téléchargé par la clinique et vérifiable", async ({
  page,
  browser,
}, testInfo) => {
  const radiologue = await creerCompte("lecteur", "Komla Adjovi");
  rattacher(radiologue, ORGANISATIONS.groupe, "radiologist");
  const licence = habiliterRadiologue(radiologue);
  const clinicien = await creerCompte("clinicien", "Mawuli Dossou");
  rattacher(clinicien, ORGANISATIONS.clinique, "clinic_staff");

  const examen = await test.step("ingestion par le webhook", () =>
    ingererExamen(ORGANISATIONS.clinique));

  await test.step("le radiologue trouve l’examen dans sa file", async () => {
    await seConnecter(page, radiologue);
    await enrolerSecondFacteur(page);
    await expect(page).toHaveURL("/worklist");
    const ligne = page
      .locator("table a[data-row-link]")
      .filter({ hasText: examen.displayName });
    await expect(ligne).toBeVisible();
    await ligne.click();
    await expect(page).toHaveURL(`/lecture/${examen.studyId}`);
    await expect(
      page.getByRole("heading", { level: 1, name: examen.displayName }),
    ).toBeVisible();
  });

  await test.step("prise en charge et rédaction", async () => {
    await page.getByRole("button", { name: "Prendre en charge" }).click();
    const sections = {
      "Indication clinique": "Toux persistante depuis trois semaines.",
      Résultats: "Parenchyme pulmonaire sans anomalie décelable.",
      Conclusion: "Examen thoracique normal.",
    };
    for (const [titre, texte] of Object.entries(sections)) {
      const section = page.getByRole("textbox", { name: titre, exact: true });
      await expect(section).toBeVisible();
      await section.fill(texte);
    }
  });

  await test.step("signature", async () => {
    await page.getByRole("button", { name: "Signer", exact: true }).click();
    const dialogue = page.getByRole("dialog", {
      name: "Signer le compte-rendu",
    });
    await expect(dialogue).toBeVisible();
    await dialogue
      .getByRole("button", { name: /^Signer (et transmettre|quand même)$/ })
      .click();
    await expect(
      page.getByText("Compte-rendu signé et transmis à la clinique."),
    ).toBeVisible({ timeout: 30_000 });
  });

  // Ce que la signature a inscrit en base : le jeton du QR code, et
  // l'empreinte du PDF déposé.
  const [verifyToken, empreinte, statut] = sql(
    `select r.verify_token, r.pdf_sha256, s.status
       from public.reports r join public.studies s on s.id = r.study_id
      where r.study_id = :'examen' and r.status = 'signed';`,
    { examen: examen.studyId },
  ).split("|");
  expect(verifyToken, "jeton de vérification enregistré").toBeTruthy();
  expect(statut).toBe("reported");

  const fichier = testInfo.outputPath("compte-rendu.pdf");
  await test.step("la clinique télécharge le PDF signé", async () => {
    const contexte = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
    });
    const clinique = await contexte.newPage();
    await seConnecter(clinique, clinicien);
    await expect(clinique).toHaveURL("/tableau-de-bord");
    await clinique.goto(`/examens/${examen.studyId}`);
    const telechargement = clinique.waitForEvent("download");
    await clinique.getByRole("button", { name: "Télécharger le PDF" }).click();
    await (await telechargement).saveAs(fichier);
    await contexte.close();

    const pdf = await readFile(fichier);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(createHash("sha256").update(pdf).digest("hex")).toBe(empreinte);
  });

  await test.step("la page publique vérifie le code et le fichier", async () => {
    await page.goto(`/verifier/${verifyToken}`);
    await expect(
      page.getByRole("heading", { name: "Document authentique" }),
    ).toBeVisible();
    await expect(page.getByText(licence)).toBeVisible();
    await page.getByLabel("Choisir le fichier PDF…").setInputFiles(fichier);
    await expect(
      page.getByText("Fichier intact : identique à celui signé."),
    ).toBeVisible();
  });
});
