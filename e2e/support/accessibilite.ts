import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";
import type { ImpactValue, Result } from "axe-core";

/**
 * Audit d'accessibilité automatisé, par axe-core.
 *
 * L'audit applique les règles WCAG 2.1 de niveaux A et AA
 * (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) à la page courante, telle
 * qu'elle est affichée : thème, langue et état compris. Un test qui veut
 * auditer un état particulier (formulaire en erreur, menu ouvert) l'amène
 * d'abord à cet état, puis appelle l'audit.
 *
 * Seules les violations **graves** ou **critiques** font échouer le test :
 * ce sont celles qui bloquent réellement un utilisateur (champ sans nom,
 * contraste insuffisant, rôle ARIA invalide). Les violations modérées ou
 * mineures sont jointes au rapport du test, en annotation, pour être
 * traitées sans bloquer.
 *
 * Aucune règle n'est désactivée globalement. Les exclusions, limitées à un
 * élément précis et justifiées une à une, sont toutes dans `EXCLUSIONS`.
 */

/** Étiquettes axe des critères WCAG 2.1 A et AA. */
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/** Impacts qui font échouer le test. */
const BLOCKING_IMPACTS: ImpactValue[] = ["serious", "critical"];

/** Une exclusion d'élément, avec sa justification. */
interface Exclusion {
  /** Sélecteur CSS de l'élément exclu de l'audit, et de ses descendants. */
  selector: string;
  /** Pourquoi l'élément ne peut pas être audité utilement. */
  reason: string;
}

/**
 * Éléments exclus de l'audit.
 *
 * Une entrée ici est une dette à justifier, jamais un moyen de faire
 * passer un test : un défaut réel se corrige dans l'application.
 */
export const EXCLUSIONS: Exclusion[] = [];

/** Options d'un audit. */
export interface AuditOptions {
  /** Restreint l'audit à une partie de la page (sélecteur CSS). */
  include?: string;
}

/**
 * Met en forme une violation, lisible dans un message d'échec.
 *
 * @param violation Violation renvoyée par axe-core.
 * @returns Règle, impact, aide en ligne, puis un élément fautif par ligne.
 */
export function formatViolation(violation: Result): string {
  const nodes = violation.nodes.map((node) => {
    const target = node.target.map(String).join(" > ");
    // Le résumé d'axe dit ce qui manque (« Element has insufficient
    // color contrast of 3.2 »…) ; sa première ligne suffit.
    const summary = (node.failureSummary ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(1, 2)
      .join(" ");
    return `    - ${target}${summary ? ` : ${summary}` : ""}`;
  });
  return [
    `[${violation.impact ?? "?"}] ${violation.id} : ${violation.help}`,
    `    ${violation.helpUrl}`,
    ...nodes,
  ].join("\n");
}

/**
 * Lance axe-core sur la page courante.
 *
 * @param page     Page à auditer, déjà dans l'état voulu.
 * @param testInfo Test en cours : reçoit en annotation les violations
 *                 non bloquantes.
 * @param options  Restriction éventuelle à une partie de la page.
 * @returns Les violations bloquantes, mises en forme ; vide si la page est
 *          conforme.
 */
export async function auditAccessibility(
  page: Page,
  testInfo: TestInfo,
  options: AuditOptions = {},
): Promise<string[]> {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  if (options.include) builder = builder.include(options.include);
  for (const { selector } of EXCLUSIONS) builder = builder.exclude(selector);
  const { violations } = await builder.analyze();

  const blocking = violations.filter((v) =>
    BLOCKING_IMPACTS.includes(v.impact ?? null),
  );
  for (const violation of violations.filter((v) => !blocking.includes(v)))
    testInfo.annotations.push({
      type: "accessibilité (non bloquant)",
      description: `${page.url()}\n${formatViolation(violation)}`,
    });
  return blocking.map(formatViolation);
}
