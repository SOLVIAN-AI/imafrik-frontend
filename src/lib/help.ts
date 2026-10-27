/**
 * Aide contextuelle : quelle aide pour quel écran, et la recherche.
 *
 * Module pur : ni rendu ni requête, pour être testé seul. Les textes
 * vivent dans les messages (`help`), en français et en anglais ; ce
 * module ne fait que relier une adresse et un rôle à une page d'aide,
 * et chercher dans l'aide d'un rôle et dans le glossaire.
 *
 * **Une page d'aide par écran et par rôle.** La même adresse ne se lit
 * pas de la même façon selon le rôle : « À lire » est un poste de travail
 * pour un radiologue, une vue en consultation pour l'équipe IMAFRIK.
 */

import type { AppMessages } from "@/i18n";
import type { UserRole } from "@/lib/session/types";

type HelpMessages = AppMessages["help"];

/** Rôle tel que l'aide le nomme (`help.pages`). */
export type HelpRole = keyof HelpMessages["pages"];

/** Clé d'un terme du glossaire. */
export type GlossaryKey = keyof HelpMessages["glossary"];

/** Une page d'aide, telle que les messages la décrivent. */
export interface HelpPage {
  title: string;
  purpose: string;
  steps: readonly string[];
  terms: readonly string[];
}

/** Raccourcis propres à un écran, en plus des raccourcis communs. */
export type ScreenShortcuts = "table";

/** Un écran reconnu : sa page d'aide et ses raccourcis propres. */
export interface HelpScreen {
  role: HelpRole;
  key: string;
  shortcuts: readonly ScreenShortcuts[];
}

const ROLE: Record<UserRole, HelpRole> = {
  radiologist: "radiologist",
  clinic_staff: "clinic",
  platform_admin: "admin",
};

/** Rôle d'aide d'un rôle d'appartenance. */
export function helpRoleOf(role: UserRole): HelpRole {
  return ROLE[role];
}

/**
 * Écrans de chaque rôle. Un motif finissant par `/*` couvre les
 * sous-pages (une fiche, un compte-rendu) ; les motifs plus précis
 * passent avant, l'ordre de la liste fait foi.
 */
const SCREENS: Record<
  HelpRole,
  readonly (readonly [
    pattern: string,
    key: string,
    shortcuts?: readonly ScreenShortcuts[],
  ])[]
> = {
  radiologist: [
    ["/worklist", "worklist", ["table"]],
    ["/mes-examens", "myStudies", ["table"]],
    ["/formation/*", "trainingExercise"],
    ["/formation", "training"],
    ["/comptes-rendus/*", "report"],
    ["/comptes-rendus", "reports"],
    ["/modeles", "templates"],
    ["/parametres", "settings"],
    ["/lecture/*", "reading"],
  ],
  clinic: [
    ["/tableau-de-bord", "dashboard"],
    ["/envoyer", "send"],
    ["/examens/*", "study"],
    ["/examens", "studies"],
    ["/comptes-rendus/*", "report"],
    ["/comptes-rendus", "reports"],
    ["/equipe", "team"],
    ["/parametres", "settings"],
  ],
  admin: [
    ["/admin", "cockpit"],
    ["/admin/activite", "analytics"],
    ["/admin/flux", "flow"],
    ["/admin/organisations/*", "organisation"],
    ["/admin/organisations", "organisations"],
    ["/admin/passerelles/*", "gateway"],
    ["/admin/passerelles", "gateways"],
    ["/admin/utilisateurs", "accounts"],
    ["/admin/examens", "studies"],
    ["/admin/demandes", "requests"],
    ["/admin/facturation", "billing"],
    ["/admin/systeme", "system"],
    ["/admin/audit", "audit"],
    ["/admin/reglages", "controls"],
    ["/worklist", "worklist", ["table"]],
    ["/formation/*", "trainingExercise"],
    ["/formation", "training"],
    ["/comptes-rendus/*", "report"],
    ["/comptes-rendus", "reports"],
    ["/modeles", "templates"],
    ["/parametres", "settings"],
    ["/lecture/*", "reading"],
  ],
};

function matches(pattern: string, pathname: string): boolean {
  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2);
    return pathname.startsWith(`${base}/`) && pathname.length > base.length + 1;
  }
  return pathname === pattern || pathname === `${pattern}/`;
}

/**
 * L'écran d'aide d'une adresse, pour un rôle.
 *
 * @param role     Rôle de l'appartenance active.
 * @param pathname Adresse courante, sans paramètres.
 * @returns L'écran reconnu, ou `null` : le panneau propose alors la
 *          recherche et le glossaire.
 */
export function helpScreenFor(
  role: UserRole,
  pathname: string,
): HelpScreen | null {
  const helpRole = ROLE[role];
  for (const [pattern, key, shortcuts] of SCREENS[helpRole]) {
    if (matches(pattern, pathname)) {
      return { role: helpRole, key, shortcuts: shortcuts ?? [] };
    }
  }
  return null;
}

/** Tous les écrans d'un rôle, dans l'ordre de la navigation. */
export function helpScreensOf(role: UserRole): HelpScreen[] {
  const helpRole = ROLE[role];
  return SCREENS[helpRole].map(([, key, shortcuts]) => ({
    role: helpRole,
    key,
    shortcuts: shortcuts ?? [],
  }));
}

/** Adresse d'un écran sans paramètre, pour y mener depuis la recherche. */
export function hrefOf(role: UserRole, key: string): string | null {
  const found = SCREENS[ROLE[role]].find(
    ([pattern, candidate]) => candidate === key && !pattern.endsWith("/*"),
  );
  return found ? found[0] : null;
}

/**
 * Forme comparable d'un texte : minuscules, sans accents ni ponctuation
 * typographique, pour qu'« echeance » trouve « échéance ».
 */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’']/g, " ")
    .toLowerCase();
}

/** Un résultat de recherche : un écran ou un terme. */
export type HelpResult =
  | { kind: "page"; key: string; title: string; excerpt: string }
  | { kind: "term"; key: string; title: string; excerpt: string };

/**
 * Cherche dans l'aide des écrans d'un rôle et dans le glossaire.
 *
 * Tous les mots saisis doivent apparaître (dans n'importe quel ordre).
 * Un titre qui correspond passe avant un texte qui correspond.
 *
 * @param query    Saisie de l'utilisateur.
 * @param pages    Pages d'aide du rôle.
 * @param glossary Glossaire.
 * @param limit    Nombre maximal de résultats.
 */
export function searchHelp(
  query: string,
  pages: Record<string, HelpPage>,
  glossary: Record<string, { term: string; definition: string }>,
  limit = 12,
): HelpResult[] {
  const words = normalize(query)
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (words.length === 0) return [];
  const scored: { result: HelpResult; score: number }[] = [];
  const consider = (result: HelpResult, body: string) => {
    const title = normalize(result.title);
    const all = `${title} ${normalize(body)}`;
    if (!words.every((word) => all.includes(word))) return;
    const inTitle = words.filter((word) => title.includes(word)).length;
    scored.push({
      result,
      score: inTitle * 10 + (result.kind === "term" ? 1 : 0),
    });
  };
  for (const [key, page] of Object.entries(pages)) {
    consider(
      { kind: "page", key, title: page.title, excerpt: page.purpose },
      `${page.purpose} ${page.steps.join(" ")}`,
    );
  }
  for (const [key, entry] of Object.entries(glossary)) {
    consider(
      { kind: "term", key, title: entry.term, excerpt: entry.definition },
      entry.definition,
    );
  }
  return scored
    .sort(
      (a, b) =>
        b.score - a.score || a.result.title.localeCompare(b.result.title, "fr"),
    )
    .slice(0, limit)
    .map((entry) => entry.result);
}
