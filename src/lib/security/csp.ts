/**
 * Politique de sécurité du contenu (CSP).
 *
 * C'est la dernière barrière contre une injection de script : même si un
 * jour une valeur affichée échappait au rendu de React, le navigateur
 * refuserait d'exécuter un script qui ne porte pas le nonce de la
 * requête. Elle complète les cookies `httpOnly` — un script injecté ne
 * pourrait ni lire le jeton, ni s'exécuter.
 *
 * Choix directive par directive :
 *
 * - `script-src` : nonce par requête et `strict-dynamic`, selon la
 *   recommandation de Next (voir le guide « Content Security Policy »
 *   livré avec la version installée). Aucun `unsafe-inline` pour les
 *   scripts. `unsafe-eval` seulement en développement, où React en a
 *   besoin pour reconstruire les piles d'erreur.
 * - `style-src` : `unsafe-inline` est conservé, et c'est un compromis
 *   assumé. L'éditeur de compte-rendu (alignement du texte) et les
 *   panneaux redimensionnables posent des attributs `style` en ligne,
 *   qu'aucun nonce ne peut couvrir. Une injection de style ne permet pas
 *   d'exécuter du code.
 * - `frame-src` : le seul cadre autorisé est le viewer d'imagerie.
 * - `connect-src` : cette application, et l'API pour le seul dépôt
 *   d'examens — trop volumineux pour transiter par l'application. Tout le
 *   reste, Supabase compris, est appelé côté serveur.
 * - `frame-ancestors 'none'` : personne ne peut encadrer l'application —
 *   pas de détournement de clic sur un bouton « Signer ».
 */

/** Origine du viewer d'imagerie, seul cadre autorisé. */
function viewerOrigin(): string | null {
  const url = process.env.NEXT_PUBLIC_VIEWER_URL;
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Origine de l'API, seule destination réseau du navigateur hors de
 * l'application : le dépôt d'examens y envoie ses fichiers directement.
 */
function apiOrigin(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Génère un nonce pour une requête.
 *
 * 128 bits d'aléa : imprévisible, et différent à chaque page servie.
 */
export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Construit l'en-tête CSP d'une requête.
 *
 * `upgrade-insecure-requests` n'est posé que sur une page servie en
 * HTTPS : sur `http://localhost`, il ferait réécrire chaque requête en
 * HTTPS vers un serveur qui n'en parle pas, et l'application cesserait
 * de charger ses propres ressources.
 *
 * @param nonce  Nonce de la requête, que Next reporte sur ses propres
 *               scripts en le lisant dans cet en-tête.
 * @param secure La page est servie en HTTPS.
 */
export function contentSecurityPolicy(nonce: string, secure: boolean): string {
  const development = process.env.NODE_ENV === "development";
  const viewer = viewerOrigin();
  const api = apiOrigin();

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(development ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'"],
    "connect-src": [
      "'self'",
      ...(api ? [api] : []),
      ...(development ? ["ws:"] : []),
    ],
    "frame-src": viewer ? [viewer] : ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const policy = Object.entries(directives).map(
    ([name, values]) => `${name} ${values.join(" ")}`,
  );
  if (secure) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}
