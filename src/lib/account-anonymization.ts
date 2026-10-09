/**
 * Anonymisation d'un compte (droit à l'effacement) : règles partagées par
 * l'écran et l'action serveur.
 *
 * Module pur : ni rendu ni requête, pour être testé seul. Le service
 * revérifie tout ; ces règles évitent seulement un aller-retour voué au
 * refus.
 */

import { foldName } from "@/lib/contract-end";

/**
 * Le nom saisi confirme-t-il le compte visé ?
 *
 * Même règle que le service (`strip().casefold()`), et que la fin de
 * contrat d'une clinique : taper le nom oblige à lire **quel** compte on
 * s'apprête à anonymiser. Le nom comparé est le nom du profil, sans le
 * titre (« Dr ») que l'écran affiche devant.
 *
 * @param typed Nom saisi par l'administrateur.
 * @param name  Nom du profil (`full_name`).
 */
export function confirmsAccountName(typed: string, name: string): boolean {
  const folded = foldName(typed);
  return folded.length > 0 && folded === foldName(name);
}

/**
 * Faut-il confirmer le retrait des appartenances avant d'anonymiser ?
 *
 * Le service refuse d'anonymiser un compte encore membre d'une
 * organisation active sans cette confirmation explicite. Une date de fin
 * de relation absente signifie qu'il reste une appartenance active ; un
 * service antérieur qui ne la renvoie pas tombe du même côté, le plus sûr.
 *
 * @param account Date de fin de relation du compte, `null` s'il garde une
 *                appartenance active.
 */
export function needsMembershipRemoval(account: {
  inactiveSince: Date | null;
}): boolean {
  return account.inactiveSince === null;
}
