/**
 * Fin de contrat d'une clinique : règles partagées par l'écran et
 * l'action serveur.
 *
 * Module pur : ni rendu ni requête, pour être testé seul.
 */

/**
 * Forme comparable d'un nom saisi : espaces de bord retirés, casse
 * repliée.
 *
 * Même règle que le service (`strip().casefold()` en Python). Le passage
 * par les majuscules avant les minuscules rapproche `toLowerCase` du
 * `casefold` de Python : « ß » devient « ss » des deux côtés.
 *
 * @param value Texte saisi ou nom de référence.
 */
export function foldName(value: string): string {
  return value.trim().toUpperCase().toLowerCase();
}

/**
 * Le nom saisi confirme-t-il la clinique visée ?
 *
 * Tant que ce n'est pas le cas, le bouton de confirmation reste inactif :
 * taper le nom oblige à lire **quelle** clinique on s'apprête à couper.
 *
 * @param typed Nom saisi par l'administrateur.
 * @param name  Nom de la clinique.
 */
export function confirmsClinicName(typed: string, name: string): boolean {
  const folded = foldName(typed);
  return folded.length > 0 && folded === foldName(name);
}

/**
 * Nombre d'examens non rendus annoncé par un refus du service (409).
 *
 * Le service refuse la fin de contrat pour deux raisons, toutes deux en
 * 409 : contrat déjà terminé, ou examens pas encore rendus. Seul le
 * second message, rédigé dans la langue de l'utilisateur, porte un
 * nombre : « Examens non rendus : 3. … », « Examinations not yet
 * reported: 3. … ».
 *
 * @param detail Message du service.
 * @returns Le nombre d'examens, ou `null` si le message n'en porte pas.
 */
export function unreportedCount(detail: string): number | null {
  const match = /\d+/.exec(detail);
  if (!match) return null;
  const count = Number(match[0]);
  return Number.isSafeInteger(count) && count > 0 ? count : null;
}
