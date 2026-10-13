import { expect, test } from "../support/fixtures";
import {
  creerCompte,
  habiliterRadiologue,
  ingererExamen,
  ORGANISATIONS,
  rattacher,
  sql,
} from "./support/pile";
import { ouvrirSession } from "./support/session";

/**
 * La relecture avancée par IA, de l'éditeur à la base.
 *
 * Aucun modèle n'est appelé : l'API de la pile tourne avec la connexion
 * `fake`, qui « répond » trois signalements (`AI_FAKE_REPLY`, dans
 * `tools/parcours-reels/pile.sh`) écrits pour le brouillon ci-dessous.
 * Tout le reste est réel : session à second facteur, enregistrement du
 * brouillon, contrôles de l'API, vérification des citations, relevé en
 * base, journal d'audit.
 *
 * Ce que le parcours établit :
 *
 * 1. sans activation de l'organisation, l'éditeur ne propose rien ;
 * 2. une citation inventée par le modèle n'atteint jamais l'écran ;
 * 3. écarter un signalement, ou corriger le passage, s'enregistre en
 *    base sans aucun texte ;
 * 4. la relecture se relance seule à l'ouverture de la signature, et ne
 *    l'empêche pas.
 */

test.use({ langue: "fr" });
test.setTimeout(120_000);

const CONTRADICTION =
  "La conclusion écarte un épanchement que les résultats décrivent.";
const OUBLI = "L’abondance décrite ne figure pas dans la conclusion.";
const INVENTE = "Citation inventée par le modèle.";

/** Active ou coupe la relecture pour le groupe de radiologie du jeu de départ. */
function activerRelecture(active: boolean): void {
  sql(
    `update public.organizations set ai_review_enabled = :'actif'::boolean
      where id = :'organisation';`,
    { actif: String(active), organisation: ORGANISATIONS.groupe },
  );
}

test.afterAll(() => activerRelecture(false));

test("un brouillon est relu par l’IA, ses signalements écartés ou corrigés, puis signé", async ({
  page,
}) => {
  const radiologue = await creerCompte("relecteur", "Afi Mensah");
  rattacher(radiologue, ORGANISATIONS.groupe, "radiologist");
  habiliterRadiologue(radiologue);
  const examen = await ingererExamen(ORGANISATIONS.clinique);

  const section = (titre: string) =>
    page.getByRole("textbox", { name: titre, exact: true });
  const ouvrirRelecture = () =>
    page.getByRole("button", { name: /^Relecture/ }).click();
  const relecture = page.getByRole("dialog", { name: "Relecture" });

  await test.step("sans activation, l’éditeur ne propose pas la relecture avancée", async () => {
    activerRelecture(false);
    await ouvrirSession(page, radiologue);
    await page.goto(`/lecture/${examen.studyId}`);
    await page.getByRole("button", { name: "Prendre en charge" }).click();
    await expect(section("Résultats")).toHaveAttribute(
      "contenteditable",
      "true",
    );
    await ouvrirRelecture();
    await expect(relecture).toBeVisible();
    await expect(relecture.getByText("Relecture avancée")).toHaveCount(0);
    await page.keyboard.press("Escape");
  });

  await test.step("rédaction d’un brouillon incohérent", async () => {
    activerRelecture(true);
    await page.reload();
    const textes = {
      "Indication clinique": "Dyspnée. Recherche d’un épanchement.",
      Résultats: "Épanchement pleural droit de faible abondance.",
      Conclusion: "Absence de tout épanchement pleural.",
    };
    for (const [titre, texte] of Object.entries(textes)) {
      await expect(section(titre)).toHaveAttribute("contenteditable", "true");
      await section(titre).fill(texte);
    }
  });

  await test.step("la relecture montre les signalements vérifiés, jamais la citation inventée", async () => {
    await ouvrirRelecture();
    await expect(relecture.getByText("Relecture avancée")).toBeVisible();
    await expect(relecture.getByText("IA", { exact: true })).toBeVisible();
    await relecture.getByRole("button", { name: "Relire" }).click();
    await expect(relecture.getByText(CONTRADICTION)).toBeVisible();
    await expect(relecture.getByText(OUBLI)).toBeVisible();
    await expect(relecture.getByText(INVENTE)).toHaveCount(0);
    await expect(
      relecture.getByText("« Absence de tout épanchement pleural »"),
    ).toBeVisible();
  });

  /** Ce que la base a relevé pour cet examen : types et décisions seulement. */
  const releve = () =>
    sql(
      `select string_agg(r.findings::text, ' ; ' order by r.started_at)
         from public.ai_runs r
         join public.reports p on p.id = r.report_id
        where p.study_id = :'examen';`,
      { examen: examen.studyId },
    );

  await test.step("écarter un signalement s’enregistre, sans texte", async () => {
    await relecture
      .getByRole("listitem")
      .filter({ hasText: CONTRADICTION })
      .getByRole("button", { name: "Écarter" })
      .click();
    await expect(relecture.getByText(CONTRADICTION)).toHaveCount(0);
    await expect
      .poll(releve)
      .toBe(
        '[{"kind": "contradiction", "decision": "dismissed"}, {"kind": "omission", "decision": "pending"}]',
      );
    await page.keyboard.press("Escape");
  });

  await test.step("corriger le passage fait disparaître le signalement", async () => {
    await section("Résultats").fill("Épanchement pleural droit.");
    await ouvrirRelecture();
    await expect(relecture.getByText(OUBLI)).toHaveCount(0);
    await expect(
      relecture.getByText("Le texte a changé depuis cette relecture."),
    ).toBeVisible();
    await expect
      .poll(releve)
      .toBe(
        '[{"kind": "contradiction", "decision": "dismissed"}, {"kind": "omission", "decision": "corrected"}]',
      );
    await page.keyboard.press("Escape");
  });

  await test.step("la signature relance la relecture et ne l’attend pas", async () => {
    await page.getByRole("button", { name: "Signer", exact: true }).click();
    const signature = page.getByRole("dialog", {
      name: "Signer le compte-rendu",
    });
    await expect(signature).toBeVisible();
    // Le texte a changé : la relecture repart seule. La contradiction,
    // toujours dans le texte, revient ; l'oubli, dont le passage a
    // disparu, est jeté par l'API.
    await expect(signature.getByText(CONTRADICTION)).toBeVisible();
    await expect(signature.getByText(OUBLI)).toHaveCount(0);
    await signature.getByRole("button", { name: "Signer quand même" }).click();
    await expect(
      page.getByText("Compte-rendu signé et transmis à la clinique."),
    ).toBeVisible({ timeout: 30_000 });
  });

  await test.step("la base a relevé deux relectures et le journal les nomme", async () => {
    const [executions, audits, statut] = sql(
      `select (select count(*) from public.ai_runs r
                 join public.reports p on p.id = r.report_id
                where p.study_id = :'examen' and r.kind = 'review'
                  and r.outcome = 'ok' and r.prompt_version = 'review.v1'),
              (select count(*) from public.audit_log a
                 join public.reports p on p.id::text = a.resource_id
                where p.study_id = :'examen' and a.action = 'report.ai_reviewed'),
              (select status from public.reports where study_id = :'examen');`,
      { examen: examen.studyId },
    ).split("|");
    expect(executions).toBe("2");
    expect(audits).toBe("2");
    expect(statut).toBe("signed");
  });
});
