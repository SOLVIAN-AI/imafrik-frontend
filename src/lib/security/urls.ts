/**
 * Adresses reçues du service et ouvertes par le navigateur.
 *
 * Le viewer d'imagerie et le lien du PDF signé arrivent du service sous
 * forme d'adresses, puis sont ouverts tels quels — dans un cadre, ou par
 * un téléchargement. `z.string().url()` ne suffit pas à les valider : il
 * accepte toute adresse que `new URL()` sait lire, `javascript:` compris.
 * Un service compromis, ou un intermédiaire, pourrait ainsi faire
 * exécuter du code dans la page. Ces adresses doivent donc être en
 * `https`, sauf sur la machine locale, où le laboratoire tourne en
 * `http`.
 */

/** Hôtes de la machine locale, seuls admis en `http`. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Vrai si l'adresse peut être ouverte par le navigateur sans risque.
 *
 * @param value Adresse reçue.
 */
export function isSafeBrowserUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && LOCAL_HOSTS.has(url.hostname);
}

/**
 * Vrai si l'adresse du viewer pointe bien le viewer configuré.
 *
 * La politique de sécurité du contenu n'autorise de toute façon que cette
 * origine dans un cadre ; le contrôle évite d'afficher un cadre vide, et
 * de remettre un jeton de visualisation à une autre origine.
 *
 * @param value      Adresse renvoyée par le service.
 * @param configured Adresse du viewer configurée (`NEXT_PUBLIC_VIEWER_URL`).
 */
export function isConfiguredViewer(
  value: string,
  configured: string | undefined,
): boolean {
  if (!configured || !isSafeBrowserUrl(value)) return false;
  try {
    return new URL(value).origin === new URL(configured).origin;
  } catch {
    return false;
  }
}
