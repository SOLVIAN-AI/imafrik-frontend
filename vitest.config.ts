import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Tests unitaires.
 *
 * Ils couvrent la logique pure dont dépend la sécurité ou la justesse de
 * l'interface — destinations de redirection, accès aux écrans par rôle,
 * politique de sécurité du contenu, contrat d'API, règles de mot de
 * passe — sans navigateur ni serveur. `server-only` est remplacé par un
 * module vide : il n'interdit que l'import depuis un bundle client, ce qui
 * n'a pas de sens ici.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/test/empty.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
