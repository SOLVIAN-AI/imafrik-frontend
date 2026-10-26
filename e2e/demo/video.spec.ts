import {
  DEMO_MEMBERSHIP_COOKIE,
  expect,
  test,
  type DemoMembership,
} from "../support/fixtures";
import { writeFile } from "node:fs/promises";

import { installOverlays, Scene } from "./mise-en-scene";

/**
 * Vidéo de démonstration d'IMAFRIK, filmée sur le jeu de démonstration.
 *
 * Un seul test, une seule page, donc une seule vidéo : le parcours d'un
 * examen de bout en bout, raconté en quatre parties pour des cliniques
 * et des radiologues togolais.
 *
 * 1. **La clinique** envoie un examen et suit son état.
 * 2. **Le radiologue** voit sa file, ouvre un examen urgent, lit les
 *    images, rédige avec un modèle et signe.
 * 3. **La clinique** retrouve le compte-rendu signé et en vérifie
 *    l'authenticité sur la page publique.
 * 4. **L'équipe IMAFRIK** suit l'activité dans la tour de contrôle.
 *
 * **Rien n'est inventé.** Seuls les écrans et les gestes de l'application
 * apparaissent. Un geste que la démonstration n'exécute pas (dépôt de
 * fichiers, signature, téléchargement du PDF, prise en charge) est
 * désigné à l'écran sans être fait, et le sous-titre le dit.
 *
 * Lancement et assemblage : voir `docs/video-demo.md`. Ce fichier n'est
 * pas un test de la suite : `playwright.config.ts` l'écarte, et seule
 * `playwright.demo.config.ts` le lance.
 */

test.use({ membership: "m-clinic", langue: "fr", theme: "light" });

/** Examens du jeu de démonstration (`src/lib/demo/studies.ts`). */
const STUDIES = {
  /** KOFFI Ama, scanner thoracique urgent, en attente. */
  urgent: { id: "1", patient: "KOFFI Ama" },
  /** MENSAH Kodjo, IRM cérébrale déjà prise en charge par la radiologue. */
  claimed: { id: "2", patient: "MENSAH Kodjo" },
} as const;

/** Compte-rendu signé de la clinique, et son code de vérification. */
const SIGNED_REPORT = { id: "r-4", patient: "AGBEKO Selom" } as const;

/**
 * Écrans filmés, par portail : rendus une première fois avant la prise,
 * pour que le serveur, tout juste démarré, ne fasse pas attendre la
 * caméra (squelettes de chargement à l'image).
 */
const WARM_UP: Record<DemoMembership, string[]> = {
  "m-clinic": [
    "/tableau-de-bord",
    "/envoyer",
    "/examens",
    `/examens/${STUDIES.urgent.id}`,
    `/comptes-rendus/${SIGNED_REPORT.id}`,
  ],
  "m-radio": [
    "/worklist",
    "/worklist?urgent=1",
    `/lecture/${STUDIES.urgent.id}`,
    `/lecture/${STUDIES.claimed.id}`,
  ],
  "m-admin": ["/admin", "/admin/activite", "/admin/flux"],
};

test("vidéo de démonstration", async ({
  page,
  context,
  baseURL,
  request,
}, testInfo) => {
  // Quatre parties, trois portails : bien plus long qu'un test.
  test.setTimeout(8 * 60_000);
  if (!baseURL) throw new Error("baseURL manquant dans la configuration");
  // La vidéo commence avec la page, créée juste avant ce test : les
  // repères de montage se comptent depuis cet instant.
  const startedAt = Date.now();
  for (const [membership, paths] of Object.entries(WARM_UP))
    for (const path of paths) {
      const response = await request.get(path, {
        headers: { cookie: `${DEMO_MEMBERSHIP_COOKIE}=${membership}` },
      });
      expect(response.ok(), `préchauffage de ${path}`).toBe(true);
    }
  await installOverlays(context);
  const scene = new Scene(page, baseURL);

  /** Capture clé, jointe au rapport et déposée avec la vidéo. */
  const keyframe = async (name: string) => {
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
  };

  /** Change de portail : le cookie de démonstration décide du portail servi. */
  const switchPortal = async (membership: DemoMembership) => {
    await context.addCookies([
      { name: DEMO_MEMBERSHIP_COOKIE, value: membership, url: baseURL },
    ]);
  };

  // ── Ouverture ─────────────────────────────────────────────────────────
  await scene.gotoBehindCard(
    "/tableau-de-bord",
    "Vos examens lus à distance, par des radiologues vérifiés",
    "Démonstration sur des données fictives : aucun patient réel.",
    4200,
  );
  // Début du montage : le carton d'ouverture, sans la page vide qui le
  // précède le temps du premier chargement.
  const openingAt = (scene.lastCardShownAt ?? startedAt) - startedAt;

  // ── 1. La clinique envoie un examen et suit son état ──────────────────
  await expect(
    page.getByRole("heading", { level: 1, name: "Tableau de bord" }),
  ).toBeVisible();
  await scene.caption(
    "Clinique Saint-Joseph, Lomé. Le tableau de bord répond à la question du matin.",
  );
  await scene.pointTo(page.getByText("En cours de lecture").first());
  await scene.caption("Envoyés, en cours de lecture, prêts à télécharger.");
  await keyframe("01-clinique-tableau-de-bord");

  await scene.click(
    page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: "Envoyer un examen" }),
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Envoyer un examen" }),
  ).toBeVisible();
  await scene.caption(
    "La passerelle de la clinique envoie chaque examen automatiquement, chiffré.",
  );
  await scene.designate(
    page.getByRole("button", { name: "Choisir des fichiers" }),
  );
  await scene.caption(
    "Sans passerelle, on dépose les fichiers ici, même depuis un CD. Dépôt désactivé en démonstration.",
  );
  await scene.clearDesignation();

  await scene.click(
    page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: /^Examens/ }),
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Examens" }),
  ).toBeVisible();
  await scene.caption("Chaque examen envoyé, avec son état d’avancement.");
  await scene.click(page.getByRole("link", { name: STUDIES.urgent.patient }));
  await expect(
    page.getByRole("heading", { level: 1, name: STUDIES.urgent.patient }),
  ).toBeVisible();
  await scene.caption(
    "Un scanner thoracique urgent, suspicion d’embolie pulmonaire, reçu il y a quelques minutes.",
  );
  await scene.pointTo(page.getByText("Avancement", { exact: true }));
  await scene.caption(
    "La clinique suit chaque étape : reçu, attribué, en lecture, signé, remis.",
  );

  // ── 2. Le radiologue lit, rédige et signe ─────────────────────────────
  await switchPortal("m-radio");
  await scene.gotoBehindCard(
    "/worklist",
    "Côté radiologue",
    "Dr Adjo Kponton lit les examens de son groupe, où qu’elle soit.",
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "À lire" }),
  ).toBeVisible();
  await scene.caption(
    "Sa file de travail : les examens des cliniques, triés par échéance.",
  );
  await scene.click(page.getByRole("button", { name: "Urgences seulement" }));
  await expect(page).toHaveURL(/urgent=1/);
  await scene.caption("Les urgences d’abord, avec le temps qui reste.");
  await keyframe("02-radiologue-file");

  await scene.click(page.getByRole("link", { name: STUDIES.urgent.patient }));
  await expect(
    page.getByRole("heading", { level: 1, name: STUDIES.urgent.patient }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  await scene.caption(
    "L’écran de lecture : les images à gauche, le compte-rendu à droite.",
    { zone: "images" },
  );
  const scan = page.getByRole("img", { name: /Coupe simulée/ });
  await scene.pointTo(scan);
  await scene.caption(
    "Elle fait défiler les coupes à la molette. Images simulées en démonstration.",
    { hold: 1200, zone: "images", keep: true },
  );
  for (let notch = 0; notch < 30; notch += 1) {
    await page.mouse.wheel(0, 100);
    await scene.pause(80);
  }
  await scene.pause(800);
  await scene.clearCaption();
  await keyframe("03-radiologue-lecture");
  await scene.designate(
    page.getByRole("button", { name: "Prendre en charge" }),
  );
  await scene.caption(
    "« Prendre en charge » lui réserve l’examen jusqu’à la signature. Non enregistré en démonstration.",
    { zone: "images" },
  );
  await scene.clearDesignation();

  // Sous-titre de liaison : il couvre le retour à la file, sans temps mort.
  await scene.caption("Passons à un examen qu’elle a déjà pris en charge.", {
    hold: 900,
    keep: true,
  });
  await scene.click(page.getByRole("link", { name: "Retour" }));
  await expect(
    page.getByRole("heading", { level: 1, name: "À lire" }),
  ).toBeVisible();
  // Le retour garde le filtre des urgences, qui masquerait cet examen.
  const urgentFilter = page.getByRole("button", {
    name: "Urgences seulement",
    pressed: true,
  });
  if (await urgentFilter.isVisible()) {
    await scene.click(urgentFilter);
    await expect(page).not.toHaveURL(/urgent=1/);
  }
  await scene.click(page.getByRole("link", { name: STUDIES.claimed.patient }));
  await expect(
    page.getByRole("heading", { level: 1, name: STUDIES.claimed.patient }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  await scene.clearCaption();
  await scene.caption(
    "IRM cérébrale : le brouillon est écrit, la conclusion manque encore.",
    { zone: "images" },
  );
  await scene.click(page.getByRole("button", { name: "Modèle", exact: true }));
  await scene.caption(
    "Les modèles complètent les sections vides, sans toucher au texte déjà écrit.",
    { zone: "images" },
  );
  await scene.click(
    page.getByRole("menuitem", { name: "IRM encéphalique normale" }),
  );
  await expect(
    page.getByText("Modèle appliqué : 1 section complétée."),
  ).toBeVisible();
  // Le compte-rendu défile sous le pointeur : la conclusion monte au-dessus
  // de la notification.
  await scene.pointTo(page.getByRole("textbox", { name: "Conclusion" }));
  await scene.scroll(320);
  await scene.caption("La conclusion est complétée, prête à relire.", {
    zone: "images",
  });
  await keyframe("04-radiologue-modele");

  await scene.click(page.getByRole("button", { name: "Signer", exact: true }));
  const signing = page.getByRole("dialog", { name: "Signer le compte-rendu" });
  await expect(signing).toBeVisible();
  await scene.designate(
    signing.getByRole("button", { name: "Signer et transmettre" }),
  );
  await scene.caption(
    "Signé, il n’est plus modifiable et part aussitôt à la clinique. Signature désactivée en démonstration.",
  );
  await scene.clearDesignation();
  await scene.click(
    signing.getByRole("button", { name: "Continuer à rédiger" }),
  );
  await expect(signing).toBeHidden();

  // ── 3. La clinique récupère et vérifie le compte-rendu ─────────────────
  await switchPortal("m-clinic");
  await scene.gotoBehindCard(
    "/tableau-de-bord",
    "Retour à la clinique",
    "Les comptes-rendus signés arrivent sur son tableau de bord.",
  );
  await scene.pointTo(
    page.getByRole("heading", { name: "Comptes-rendus à télécharger" }),
  );
  await scene.caption(
    "Les comptes-rendus signés attendent sur le tableau de bord.",
  );
  await scene.click(
    page.getByRole("link", {
      name: new RegExp(`^${SIGNED_REPORT.patient} .*signé par`),
    }),
  );
  await expect(
    page.getByRole("heading", { level: 1, name: SIGNED_REPORT.patient }),
  ).toBeVisible();
  await expect(page).toHaveURL(
    new RegExp(`/comptes-rendus/${SIGNED_REPORT.id}$`),
  );
  await scene.caption(
    "Signataire, numéro d’ordre, date de signature : tout est sur la fiche.",
  );
  await keyframe("05-clinique-compte-rendu");
  await scene.designate(
    page.getByRole("button", { name: "Télécharger le PDF" }),
  );
  await scene.caption(
    "Le PDF signé porte un QR code de vérification. Téléchargement désactivé en démonstration.",
  );
  await scene.clearDesignation();
  await scene.caption(
    "Scanner ce QR code ouvre la page publique de vérification. Suivons son lien.",
  );
  await scene.click(page.getByRole("link", { name: /\/verifier\// }));
  await expect(
    page.getByRole("heading", { level: 1, name: "Document authentique" }),
  ).toBeVisible();
  await scene.caption(
    "Sans compte : le document est authentique, signé par un radiologue identifié.",
  );
  await scene.pointTo(page.getByText("Patient A."));
  await scene.caption(
    "Du patient, seule l’initiale apparaît. Ni son nom, ni le compte-rendu.",
  );

  // ── 4. L'équipe IMAFRIK suit l'activité ────────────────────────────────
  await switchPortal("m-admin");
  await scene.gotoBehindCard(
    "/admin",
    "Côté équipe IMAFRIK",
    "La tour de contrôle suit tout le réseau. L’équipe consulte, elle ne signe jamais.",
    3600,
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Tour de contrôle" }),
  ).toBeVisible();
  await scene.caption(
    "Alertes du moment : examens hors délai, passerelle muette, radiologues à valider.",
  );
  await keyframe("06-equipe-tour-de-controle");
  await scene.pointTo(page.getByRole("heading", { name: "Délais promis" }));
  await scene.caption(
    "Délais promis : trente minutes pour une urgence, deux heures en routine.",
  );
  await scene.click(
    page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: "Activité" }),
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Activité" }),
  ).toBeVisible();
  await scene.caption(
    "Volumes, délais de lecture, chaque étape du parcours d’un examen.",
  );
  await scene.scroll(420);
  await scene.pause(900);
  await scene.click(
    page
      .getByRole("navigation", { name: "Navigation principale" })
      .getByRole("link", { name: "Flux d’images" }),
  );
  await expect(
    page.getByRole("heading", { level: 1, name: "Flux d’images" }),
  ).toBeVisible();
  await scene.caption(
    "Le flux d’images, examen par examen : de l’acquisition à la remise du compte-rendu.",
  );

  // ── Fin ───────────────────────────────────────────────────────────────
  await scene.titleCard(
    "IMAFRIK, la téléradiologie au Togo",
    "Pour une démonstration dans votre établissement : contact@imafrik.tech",
    5000,
  );

  // Repères de montage, lus par `tools/demo-video/assembler.sh`.
  await writeFile(
    testInfo.outputPath("montage.json"),
    JSON.stringify(
      { debutMs: openingAt, finMs: Date.now() - startedAt },
      null,
      2,
    ),
  );
});
