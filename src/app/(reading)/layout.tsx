import { MaintenanceBanner } from "@/components/layout/app-shell";
import { SessionProvider } from "@/components/providers/session-provider";
import { InactivityLock } from "@/components/session/inactivity-lock";
import { getPlatformSettings } from "@/lib/data/control";
import { requireSession } from "@/lib/session/server";

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
 * Seule exception à la sobriété : le bandeau de maintenance, s'il y en a
 * un.
 */
export default async function ReadingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, settings] = await Promise.all([
    requireSession(),
    getPlatformSettings(),
  ]);

  return (
    <SessionProvider session={session}>
      <div className="flex h-dvh flex-col overflow-hidden bg-surface-base">
        {/* Écran de lecture compris : c'est là qu'on laisse un examen
            ouvert en partant. */}
        {!session.isDemo && <InactivityLock />}
        {settings?.maintenanceMessage && (
          <MaintenanceBanner message={settings.maintenanceMessage} />
        )}
        {children}
      </div>
    </SessionProvider>
  );
}
