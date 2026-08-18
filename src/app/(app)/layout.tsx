import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { SessionProvider } from "@/components/providers/session-provider";
import { getSession } from "@/lib/session/server";

/**
 * Disposition commune aux portails clinique et radiologue.
 *
 * **La session est résolue ici, une fois, avant tout rendu.** Trois
 * conséquences : aucun écran ne s'affiche à quelqu'un qui n'est pas
 * connecté, le jeton reste dans un cookie que seul le serveur lit, et
 * les composants clients reçoivent une session déjà connue — donc sans
 * l'état « en cours de chargement » qui parsème habituellement ce genre
 * d'application.
 *
 * Un seul châssis pour les deux portails : ce qui les distingue —
 * navigation, écrans, droits — découle du rôle dans l'organisation
 * active.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  return (
    <SessionProvider session={session}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
