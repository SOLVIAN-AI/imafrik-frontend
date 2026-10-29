import type { BrowserContext } from "@playwright/test";

/**
 * Une page n'existe qu'une fois dans le document.
 *
 * Une page chargée en entier arrive en flux : `loading.tsx` s'affiche
 * d'abord, et React écrit la page, quand elle est prête, dans un
 * `<div hidden id="S:…">` en fin de document, puis la met à sa place.
 * Si React renonce à hydrater cette page (un contexte placé au-dessus a
 * changé de valeur avant son dévoilement), il la reconstruit côté client
 * pendant que la copie du serveur attend encore dans son `<div hidden>`.
 * La page existe alors deux fois, l'une dans `#contenu`, l'autre cachée
 * hors de `#contenu` : invisible, mais un sélecteur strict de Playwright
 * trouve deux éléments, au hasard de la course. C'est arrivé avec
 * next-themes (`hooks/use-theme.ts`).
 *
 * Le guet observe chaque mutation du document plutôt que de l'interroger
 * de temps en temps : une copie qui ne dure que quelques millisecondes ne
 * lui échappe pas.
 */

/** Nom de la liaison par laquelle la page signale une copie. */
const BINDING = "__imafrikContenuDouble";

/**
 * Script de page : signale, une fois par document, le premier instant où
 * il compte plus d'un `<main>`, d'un `#contenu` ou d'un `<h1>`.
 *
 * Le `<h1>` est le titre de l'écran (`PageHeader`) : il appartient au
 * contenu de la page, que `<main>` et `#contenu`, posés par la
 * disposition, ne suffisent pas à repérer.
 */
function watch(binding: string) {
  const mains = document.getElementsByTagName("main");
  const titles = document.getElementsByTagName("h1");
  let reported = false;
  const check = () => {
    if (reported) return;
    const contents = document.querySelectorAll("#contenu").length;
    if (mains.length <= 1 && contents <= 1 && titles.length <= 1) return;
    reported = true;
    const where = Array.from(titles, (title) => {
      const hidden = title.closest("[hidden]");
      return `« ${(title.textContent ?? "").trim()} »${
        hidden
          ? ` caché dans <${hidden.tagName.toLowerCase()} id="${hidden.id}">`
          : ""
      }`;
    });
    const report = (
      window as unknown as Record<
        string,
        ((detail: string) => void) | undefined
      >
    )[binding];
    report?.(
      `${mains.length} <main>, ${contents} #contenu, ${titles.length} <h1> : ${where.join(", ")}`,
    );
  };
  new MutationObserver(check).observe(document, {
    childList: true,
    subtree: true,
  });
}

/**
 * Guette les pages en double dans chaque page du contexte.
 *
 * @param context     Contexte du test.
 * @param onDuplicate Reçoit l'adresse et la description de la copie.
 */
export async function watchDuplicates(
  context: BrowserContext,
  onDuplicate: (url: string, detail: string) => void,
): Promise<void> {
  await context.exposeBinding(BINDING, ({ page }, detail: string) =>
    onDuplicate(page.url(), detail),
  );
  await context.addInitScript(watch, BINDING);
}
