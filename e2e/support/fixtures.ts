import { test as base, expect, type Page } from "@playwright/test";

/**
 * Fixtures communes aux tests de bout en bout.
 *
 * Chaque test déclare, par `test.use`, le contexte dans lequel il tourne :
 * le portail de démonstration (`membership`), la langue (`langue`) et le
 * thème (`theme`). Les cookies et le stockage local sont posés **avant**
 * le premier chargement, comme les poserait un visiteur revenu sur le
 * site : aucun test ne dépend d'un clic préalable pour se placer.
 *
 * Une fixture automatique recueille les erreurs JavaScript de la page et
 * les `console.error`, et fait échouer le test qui en a produit. Un test
 * qui en attend une, par exemple le 404 d'une adresse inexistante, la
 * déclare explicitement dans `ignoredErrors`, avec sa justification.
 */

/** Appartenance de démonstration, donc portail : voir `lib/session/demo.ts`. */
export type DemoMembership = "m-radio" | "m-clinic" | "m-admin";

/** Langue de l'interface, telle que la lit le cookie `imafrik-langue`. */
export type Langue = "fr" | "en";

/** Thème de l'interface, tel que le lit `next-themes` dans `localStorage`. */
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
  /** Erreurs de console attendues, à justifier là où elles sont déclarées. */
  ignoredErrors: RegExp[];
}

/** Fixtures fournies aux tests. */
interface Fixtures {
  /** Erreurs recueillies jusqu'ici ; vérifiées automatiquement à la fin du test. */
  pageErrors: string[];
}

export const test = base.extend<Options & Fixtures>({
  membership: [null, { option: true }],
  langue: [null, { option: true }],
  theme: [null, { option: true }],
  ignoredErrors: [[], { option: true }],

  context: async ({ context, baseURL, membership, langue, theme }, use) => {
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
      // `next-themes` lit sa clé avant le premier rendu : la poser par un
      // script d'initialisation évite tout basculement visible.
      await context.addInitScript((value) => {
        window.localStorage.setItem("theme", value);
      }, theme);
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
});

export { expect };

/**
 * Attend que la page ait fini de se charger et de s'animer.
 *
 * - **Polices** : une mesure faite avec la police de secours serait fausse.
 * - **Animations** : les apparitions (`rise-in`…) déplacent les éléments
 *   pendant quelques centaines de millisecondes. On attend la fin de
 *   chaque animation finie, plutôt qu'une durée arbitraire ; les
 *   animations sans fin (indicateur de chargement) sont ignorées.
 *
 * @param page Page à stabiliser.
 */
export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("load");
  await page.evaluate(async () => {
    await document.fonts.ready;
    const finite = document
      .getAnimations()
      .filter(
        (animation) =>
          animation.effect?.getComputedTiming().endTime !== Infinity,
      );
    await Promise.all(
      finite.map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}
