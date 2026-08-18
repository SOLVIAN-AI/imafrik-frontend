import { redirect } from "next/navigation";

import { SessionProvider } from "@/components/providers/session-provider";
import { getSession } from "@/lib/session/server";

/**
 * Ossature de l'écran de lecture.
 *
 * Volontairement dépouillée : ni navigation latérale, ni barre de
 * recherche globale. Deux raisons, dans cet ordre.
 *
 * **La place.** Le châssis du portail occupe environ 300 px en largeur et
 * 55 en hauteur. Rendus au volet d'images, ce sont des coupes qu'on lit
 * sans zoomer — c'est la disposition des consoles de lecture, et elle
 * n'est pas négociable pour un usage diagnostique.
 *
 * **L'attention.** Lire un examen est une tâche qui ne souffre pas
 * l'interruption. Un compteur d'examens en attente ou une pastille de
 * notification dans le champ de vision est exactement ce qu'on ne veut
 * pas pendant qu'on rédige une conclusion.
 *
 * Le retour à la liste reste à un clic, en tête de l'écran de lecture.
 */
export default async function ReadingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  return (
    <SessionProvider session={session}>
      <div className="flex h-dvh flex-col overflow-hidden bg-surface-base">
        {children}
      </div>
    </SessionProvider>
  );
}
