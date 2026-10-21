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
 * L'équipe IMAFRIK attribue un examen à un radiologue libéral.
 *
 * Demandé le 21 octobre 2026. Tout est réel : sessions à second facteur,
 * liste des examens de l'équipe, radiologues éligibles calculés par la
 * base, attribution par l'API, réservation lue par le radiologue.
 *
 * 1. L'équipe ouvre la fenêtre d'attribution depuis la liste des examens,
 *    et y trouve le libéral parmi les radiologues qui verraient l'examen.
 * 2. L'attribution réserve l'examen : statut, titulaire, auteur et instant
 *    en base, trace au journal.
 * 3. Le libéral le trouve dans « Mes examens » et le prend en charge.
 */

test.use({ langue: "fr" });
test.setTimeout(120_000);

test("un examen attribué par l’équipe est réservé au libéral, qui le prend en charge", async ({
  page,
  browser,
}, testInfo) => {
  const equipe = await creerCompte("equipe", "Yawa Amegah");
  rattacher(equipe, ORGANISATIONS.groupe, "platform_admin");
  const liberal = await creerCompte("liberal", "Kossi Agbeko");
  rattacher(liberal, ORGANISATIONS.groupe, "radiologist");
  habiliterRadiologue(liberal);
  const examen = await ingererExamen(ORGANISATIONS.clinique);

  await test.step("l’équipe attribue l’examen au libéral", async () => {
    await ouvrirSession(page, equipe);
    await page.goto("/admin/examens");
    await page
      .getByRole("button", {
        name: `Attribuer l’examen de ${examen.displayName}`,
      })
      .click();
    const dialogue = page.getByRole("dialog", { name: "Attribuer l’examen" });
    await expect(dialogue).toBeVisible();
    await expect(
      dialogue.getByText("Personne : l’examen est dans la file commune."),
    ).toBeVisible();
    const choix = dialogue.getByRole("radio", {
      name: /Dr Kossi Agbeko.*Libéral · IMAFRIK Radiologie/,
    });
    await choix.check();
    await dialogue
      .getByRole("button", { name: "Attribuer", exact: true })
      .click();
    // La pile n'a pas de clé Resend : l'attribution le dit.
    await expect(
      page.getByText(/^Examen attribué à Dr Kossi Agbeko\./),
    ).toBeVisible();
    await expect(dialogue).toBeHidden();
  });

  const [statut, titulaire, auteur, instant] = sql(
    `select status, assigned_to, assigned_by, assigned_at is not null
       from public.studies where id = :'examen';`,
    { examen: examen.studyId },
  ).split("|");
  expect(statut).toBe("assigned");
  expect(titulaire).toBe(liberal.id);
  expect(auteur).toBe(equipe.id);
  expect(instant).toBe("t");
  expect(
    sql(
      `select count(*) from public.audit_log
        where action = 'study.assigned' and resource_id = :'examen'
          and actor_id = :'equipe';`,
      { examen: examen.studyId, equipe: equipe.id },
    ),
  ).toBe("1");

  await test.step("le libéral le trouve dans « Mes examens » et le prend en charge", async () => {
    const contexte = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
    });
    const lecteur = await contexte.newPage();
    await ouvrirSession(lecteur, liberal);
    await lecteur.goto("/mes-examens");
    const ligne = lecteur
      .locator("table a[data-row-link]")
      .filter({ hasText: examen.displayName });
    await expect(ligne).toBeVisible();
    await ligne.click();
    await expect(lecteur).toHaveURL(`/lecture/${examen.studyId}`);
    await lecteur.getByRole("button", { name: "Prendre en charge" }).click();
    await expect(
      lecteur.getByRole("textbox", { name: "Conclusion", exact: true }),
    ).toHaveAttribute("contenteditable", "true");
    await contexte.close();
  });

  expect(
    sql(`select status from public.studies where id = :'examen';`, {
      examen: examen.studyId,
    }),
  ).toBe("in_progress");
});
