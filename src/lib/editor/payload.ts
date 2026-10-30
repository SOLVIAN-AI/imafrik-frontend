import {
  DEFAULT_LAYOUT,
  type ReportLayout,
  type ReportSections,
  sectionsOf,
} from "@/components/editor/sections";

/**
 * Contrôles d'un texte envoyé par le navigateur, avant de le relayer au
 * service : ceux d'un compte-rendu comme ceux d'un exercice de formation.
 *
 * Le service valide aussi ; ces contrôles évitent de lui relayer n'importe
 * quel objet. Ils vivent hors des modules d'actions serveur, qui ne
 * peuvent exporter que des fonctions asynchrones.
 */

/** Taille maximale d'une section, en caractères de HTML. */
export const SECTION_MAX_LENGTH = 200_000;

/** Longueur maximale d'un addendum : celle que le service impose. */
export const ADDENDUM_MAX_LENGTH = 10_000;

/**
 * Vrai si le brouillon reçu a la forme attendue : les sections de sa mise
 * en page, chacune du texte de taille raisonnable, et rien d'autre.
 *
 * @param layout Mise en page du texte ; un exercice de formation n'a que
 *               la découpe proposée.
 */
export function isSectionsPayload(
  value: unknown,
  layout: ReportLayout = DEFAULT_LAYOUT,
): value is Partial<ReportSections> {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return false;
  const known = new Set<string>(
    sectionsOf(layout).map((section) => section.key),
  );
  return Object.entries(value).every(
    ([key, html]) =>
      known.has(key) &&
      typeof html === "string" &&
      html.length <= SECTION_MAX_LENGTH,
  );
}
