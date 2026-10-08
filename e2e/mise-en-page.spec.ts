import { inspectLayout } from "./support/audit-mise-en-page";
import {
  expect,
  settle,
  test,
  type DemoMembership,
  type Theme,
} from "./support/fixtures";

/**
 * Audit de mise en page : chevauchements, débordements, texte rogné,
 * cibles tactiles trop petites.
 *
 * Un échantillon représentatif plutôt que tout le site : une page de
 * chaque famille (site public, connexion, liste, fiche, écran de lecture,
 * tableaux de bord), sur un grand écran et un téléphone, en clair et en
 * sombre. Le détail de chaque anomalie figure dans le message d'échec.
 */

/** Pages auditées, par portail ; `null` pour le site public. */
const PAGES: { membership: DemoMembership | null; paths: string[] }[] = [
  {
    membership: null,
    paths: [
      "/",
      "/en/security",
      "/connexion",
      "/contact?profil=radiologue",
      // Accueil d'un invité : invitation de démonstration.
      "/invitation",
    ],
  },
  {
    membership: "m-radio",
    paths: ["/worklist", "/lecture/1", "/comptes-rendus", "/parametres"],
  },
  { membership: "m-clinic", paths: ["/tableau-de-bord", "/examens/1"] },
  {
    membership: "m-admin",
    paths: [
      "/admin",
      "/admin/activite",
      "/admin/facturation",
      "/admin/utilisateurs?validation=attente",
      "/admin/demandes?etat=all",
      // Fiche d'une clinique, zone de danger de la fin de contrat comprise.
      "/admin/organisations/org-stj",
    ],
  },
];

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

const THEMES: Theme[] = ["light", "dark"];

for (const theme of THEMES) {
  for (const viewport of VIEWPORTS) {
    for (const { membership, paths } of PAGES) {
      test.describe(`${theme} ${viewport.width}px ${membership ?? "public"}`, () => {
        test.use({
          theme,
          viewport,
          membership,
          langue: "fr",
          colorScheme: theme,
        });

        for (const path of paths) {
          test(`${path} sans anomalie de mise en page`, async ({ page }) => {
            await page.goto(path);
            await expect(page.locator("html")).toHaveClass(
              new RegExp(`\\b${theme}\\b`),
            );
            await settle(page);
            const issues = await page.evaluate(inspectLayout, {
              mobile: viewport.width < 768,
            });
            expect(
              issues.map((issue) => `${issue.kind} : ${issue.detail}`),
              `Anomalies sur ${path}`,
            ).toEqual([]);
          });
        }
      });
    }
  }
}

/**
 * Contre-épreuve : l'audit relève bien ce qu'il prétend relever. Sans
 * elle, un audit cassé (sélecteur faux, mesure toujours nulle) passerait
 * pour une mise en page parfaite.
 */
test("l'audit relève débordement, texte rogné, chevauchement et petite cible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(`
    <body style="margin:0;font:16px sans-serif">
      <div style="width:2000px">large</div>
      <p style="width:40px;white-space:nowrap;overflow:hidden">texte beaucoup trop long</p>
      <div style="position:relative;height:40px">
        <span style="position:absolute;left:0;top:0">premier texte</span>
        <span style="position:absolute;left:10px;top:4px">second texte</span>
      </div>
      <button style="width:16px;height:16px;padding:0">x</button>
      <span class="sr-only" style="position:absolute;width:1px;height:1px;overflow:hidden">masqué</span>
    </body>`);
  const kinds = new Set(
    (await page.evaluate(inspectLayout, { mobile: true })).map(
      (issue) => issue.kind,
    ),
  );
  expect([...kinds].sort()).toEqual([
    "overlap",
    "page-overflow-x",
    "small-target",
    "text-overflow",
  ]);
});
