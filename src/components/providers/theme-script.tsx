import { THEME_SCRIPT } from "@/lib/theme";

/**
 * Pose le thème choisi sur `<html>` avant le premier affichage.
 *
 * Premier enfant de `<body>` : le navigateur l'exécute en analysant le
 * document, avant d'en peindre la suite. Il porte le nonce de la politique
 * de sécurité du contenu, sans lequel un script en ligne est refusé
 * (`lib/security/csp.ts`).
 *
 * Rendu par le serveur et jamais par le client : React ne fait que
 * l'hydrater. `suppressHydrationWarning` parce que le navigateur masque
 * l'attribut `nonce` une fois lu, et React verrait une divergence là où il
 * n'y en a pas.
 *
 * @param nonce Nonce CSP de la requête.
 */
export function ThemeScript({ nonce }: { nonce?: string }) {
  return (
    <script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  );
}
