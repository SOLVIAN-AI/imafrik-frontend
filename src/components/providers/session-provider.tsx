"use client";

import * as React from "react";

import type { Session } from "@/lib/session/types";

/**
 * Session mise à disposition de l'arbre client.
 *
 * `null` n'est jamais servi : la disposition qui fournit le contexte
 * redirige vers la connexion avant de rendre quoi que ce soit. Le type
 * le reflète, ce qui évite un test défensif dans chaque composant.
 */
const SessionContext = React.createContext<Session | null>(null);

/**
 * Fournit la session résolue côté serveur.
 *
 * **La session est lue une seule fois, au rendu serveur, et descendue
 * telle quelle.** L'alternative — chaque composant interroge Supabase —
 * multiplierait les allers-retours vers le serveur d'authentification et
 * exposerait le jeton au navigateur. Ici, le jeton reste dans un cookie
 * `httpOnly` que seul le serveur lit.
 */
export function SessionProvider({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Session de l'utilisateur courant.
 *
 * @returns L'utilisateur, ses appartenances et celle qui est active.
 * @throws Si appelé hors d'un `SessionProvider` — le cas signale une
 *         erreur de structure, pas un état à gérer.
 *
 * @example
 * ```tsx
 * const { active } = useSession();
 * if (active.role === "clinic_staff") return <PortailClinique />;
 * ```
 */
export function useSession(): Session {
  const session = React.useContext(SessionContext);
  if (!session) {
    throw new Error(
      "useSession doit être appelé dans un SessionProvider. Vérifiez que " +
        "l’écran vit sous une disposition qui résout la session.",
    );
  }
  return session;
}
