import { test as base, expect, type Page } from "@playwright/test";

import { auditAccessibility, type AuditOptions } from "./accessibilite";
import { watchDuplicates } from "./contenu-unique";
import { DEMO_USER_ID, TOUR_IDS, TOURS_STORAGE_PREFIX } from "./donnees";

/**
 * Fixtures communes aux tests de bout en bout.
 *
 * Chaque test déclare, par `test.use`, le contexte dans lequel il tourne :
 * le portail de démonstration (`membership`), la langue (`langue`), le
 * thème (`theme`) et les visites guidées (`visites`). Les cookies et le
 * stockage local sont posés **avant**
 * le premier chargement, comme les poserait un visiteur revenu sur le
 * site : aucun test ne dépend d'un clic préalable pour se placer.
 *
 * Une fixture automatique recueille les erreurs JavaScript de la page et
 * les `console.error`, et fait échouer le test qui en a produit. Un test
 * qui en attend une, par exemple le 404 d'une adresse inexistante, la
 * déclare explicitement dans `ignoredErrors`, avec sa justification.
 *
 * Une autre guette, à chaque mutation du document, une page présente deux
 * fois : plus d'un `<main>`, d'un `#contenu` ou d'un `<h1>`, même un
 * instant, même caché (`support/contenu-unique.ts`). Elle fait échouer le
 * test qui l'a vue, en disant où était la copie.
 *
 * La fixture `checkA11y` audite l'accessibilité de la page dans son état
 * courant (`support/accessibilite.ts`) et fait échouer le test sur toute
 * violation grave ou critique des WCAG 2.1 A et AA.
 */

/** Appartenance de démonstration, donc portail : voir `lib/session/demo.ts`. */
export type DemoMembership = "m-radio" | "m-clinic" | "m-admin";

/** Langue de l'interface, telle que la lit le cookie `imafrik-langue`. */
export type Langue = "fr" | "en";

/** Thème de l'interface, tel que le lit `lib/theme.ts` dans `localStorage`. */
export type Theme = "dark" | "light";

/** Cookie de l'appartenance choisie en démonstration (`lib/session/server.ts`). */
export const DEMO_MEMBERSHIP_COOKIE = "imafrik-demo-membership";

/** Cookie de la langue choisie (`lib/i18n/routes.ts`). */
export const LANGUAGE_COOKIE = "imafrik-langue";

/** Écran d'accueil de chaque portail (`lib/navigation.ts`). */
export const HOME_BY_MEMBERSHIP: Record<DemoMembership, string> = {
  "m-radio": "/worklist",
  "m-clinic": "/tableau-de-bord",
  "m-admin": "/admin",
};

/** Options déclarées par `test.use`. */
interface Options {
  /** Portail de démonstration ; `null` laisse le portail par défaut (radiologue). */
  membership: DemoMembership | null;
  /** Langue ; `null` laisse le serveur décider (français par défaut). */
  langue: Langue | null;
  /** Thème de l'application ; `null` laisse le thème par défaut (sombre). */
  theme: Theme | null;
  /**
   * Visites guidées : `faites` (par défaut) pour un utilisateur qui a déjà
   * pris l'application en main, `a-faire` pour un premier venu. Une
   * visite ouverte couvre la page : seuls les tests qui la concernent la
   * voient.
   */
  visites: "faites" | "a-faire";
  /** Erreurs de console attendues, à justifier là où elles sont déclarées. */
  ignoredErrors: RegExp[];
}

/** Fixtures fournies aux tests. */
interface Fixtures {
  /** Erreurs recueillies jusqu'ici ; vérifiées automatiquement à la fin du test. */
  pageErrors: string[];
  /** Pages vues en double jusqu'ici ; vérifiées automatiquement à la fin du test. */
  pageDuplicates: string[];
  /**
   * Audite l'accessibilité de la page dans son état courant ; échoue, avec
   * le détail de chaque violation, si l'audit en relève une bloquante.
   */
  checkA11y: (options?: AuditOptions) => Promise<void>;
}

export const test = base.extend<Options & Fixtures>({
  membership: [null, { option: true }],
  langue: [null, { option: true }],
  theme: [null, { option: true }],
  visites: ["faites", { option: true }],
  ignoredErrors: [[], { option: true }],

  context: async (
    { context, baseURL, membership, langue, theme, visites },
    use,
  ) => {
    if (!baseURL) throw new Error("baseURL manquant dans playwright.config.ts");
    const cookies = [];
    if (membership)
      cookies.push({
        name: DEMO_MEMBERSHIP_COOKIE,
        value: membership,
        url: baseURL,
      });
    if (langue)
      cookies.push({ name: LANGUAGE_COOKIE, value: langue, url: baseURL });
    if (cookies.length > 0) await context.addCookies(cookies);
    if (theme) {
      // Le script du thème lit sa clé avant le premier affichage : la poser
      // par un script d'initialisation évite tout basculement visible.
      await context.addInitScript((value) => {
        window.localStorage.setItem("theme", value);
      }, theme);
    }
    if (visites === "faites") {
      await context.addInitScript(
        ({ key, tours }) => {
          window.localStorage.setItem(key, JSON.stringify(tours));
        },
        { key: `${TOURS_STORAGE_PREFIX}${DEMO_USER_ID}`, tours: TOUR_IDS },
      );
    }
    await use(context);
  },

  pageErrors: [
    async ({ page, ignoredErrors }, use, testInfo) => {
      const errors: string[] = [];
      const record = (message: string) => {
        if (!ignoredErrors.some((pattern) => pattern.test(message)))
          errors.push(`${page.url()} : ${message}`);
      };
      page.on("pageerror", (error) => record(String(error)));
      page.on("console", (message) => {
        if (message.type() === "error") record(message.text());
      });
      await use(errors);
      // Un test déjà en échec garde son erreur d'origine, plus parlante.
      if (testInfo.status === testInfo.expectedStatus)
        expect(
          errors,
          "Erreurs JavaScript ou console.error pendant le test",
        ).toEqual([]);
    },
    { auto: true },
  ],

  pageDuplicates: [
    async ({ context }, use, testInfo) => {
      const duplicates: string[] = [];
      await watchDuplicates(context, (url, detail) =>
        duplicates.push(`${url} : ${detail}`),
      );
      await use(duplicates);
      if (testInfo.status === testInfo.expectedStatus)
        expect(
          duplicates,
          "Contenu principal présent deux fois dans le document",
        ).toEqual([]);
    },
    { auto: true },
  ],

  checkA11y: async ({ page }, use, testInfo) => {
    await use(async (options) => {
      const violations = await auditAccessibility(page, testInfo, options);
      expect(
        violations,
        `Violations d’accessibilité sur ${page.url()} :\n${violations.join("\n")}`,
      ).toEqual([]);
    });
  },
});

export { expect };

/**
 * Attend que la page ait fini de se charger et de s'animer.
 *
 * - **Polices** : une mesure faite avec la police de secours serait fausse.
 * - **Animations** : les apparitions (`rise-in`…) déplacent les éléments
 *   pendant quelques centaines de millisecondes. On attend la fin de
 *   chaque animation finie, plutôt qu'une durée arbitraire ; les
 *   animations sans fin (indicateur de chargement) sont ignorées, comme
 *   celles que pilote le défilement (`animation-timeline`, vitrine) : elles
 *   n'ont pas de fin dans le temps, seulement une position.
 * - **Forme définitive** : un écran dont la disposition dépend de la
 *   largeur (l'espace de lecture) rend une forme neutre jusqu'à
 *   l'hydratation, marquée `data-pending-layout`. Mesurer avant, c'est
 *   mesurer l'attente, pas l'écran.
 *
 * @param page Page à stabiliser.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("load");
  await expect(page.locator("[data-pending-layout]")).toHaveCount(0);
  await page.evaluate(async () => {
    await document.fonts.ready;
    const finite = document
      .getAnimations()
      .filter(
        (animation) =>
          animation.timeline instanceof DocumentTimeline &&
          animation.effect?.getComputedTiming().endTime !== Infinity,
      );
    await Promise.all(
      finite.map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}
