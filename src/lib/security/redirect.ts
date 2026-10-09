/**
 * Destinations de retour sûres.
 *
 * Un paramètre d'URL contrôlé par l'appelant ne doit jamais servir de
 * cible de redirection sans contrôle : `?suite=https://exemple.test`
 * transformerait la page de connexion en tremplin d'hameçonnage : on
 * arrive sur le vrai domaine, on se connecte, et on repart sur un faux.
 *
 * Le contrôle précédent ne refusait que `//` en tête. Il laissait passer
 * `/\exemple.test` : les navigateurs traitent la barre oblique inverse
 * comme une barre oblique, et l'adresse devient absolue. Il laissait aussi
 * passer les caractères de contrôle, qu'un navigateur retire avant
 * d'interpréter l'adresse (`/\t/exemple.test`).
 *
 * La règle retenue est donc positive plutôt qu'une liste de cas interdits :
 * l'adresse est résolue contre une origine fictive, et acceptée seulement
 * si elle y reste.
 *
 * Résoudre ne suffit pas : `/.//exemple.test`, `/%2e//exemple.test` ou
 * `/a/..//exemple.test` restent sur l'origine fictive, mais leur chemin
 * normalisé devient `//exemple.test`, qu'un navigateur lit comme une
 * adresse relative au protocole, donc hors du site. Le résultat normalisé
 * est contrôlé à son tour.
 */

/** Origine fictive, jamais contactée : sert uniquement à résoudre l'adresse. */
const PROBE_ORIGIN = "https://imafrik.invalid";

/**
 * Valide une destination de retour.
 *
 * @param target Valeur reçue (paramètre d'URL ou champ de formulaire).
 * @returns Le chemin interne normalisé (chemin, requête, ancre), ou `null`
 *          si la valeur est absente, absolue, ou sort de l'application.
 */
export function safeRedirect(target: string | null | undefined): string | null {
  if (!target) return null;
  // Un chemin interne commence par une barre unique, sans barre inverse
  // ni caractère de contrôle nulle part.
  if (!target.startsWith("/") || target.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(target)) return null;

  let resolved: URL;
  try {
    resolved = new URL(target, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (resolved.origin !== PROBE_ORIGIN) return null;
  // Le chemin normalisé est celui qui partira dans l'en-tête `Location` :
  // il doit, lui aussi, commencer par une barre unique.
  if (resolved.pathname.startsWith("//")) return null;
  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
