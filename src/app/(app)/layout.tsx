import { HtmlLang } from "@/components/i18n/html-lang";
import { AppShell } from "@/components/layout/app-shell";
import { SessionProvider } from "@/components/providers/session-provider";
import { getPlatformSettings } from "@/lib/data/control";
import { getMetrics } from "@/lib/data/metrics";
import type { NavCounts } from "@/lib/navigation";
import { requireSession } from "@/lib/session/server";

/**
 * Compteurs de navigation, tirés des indicateurs du service.
 *
 * Un service momentanément injoignable ne doit pas rendre toute
 * l'application inutilisable : la navigation s'affiche alors sans
 * chiffres, et l'écran concerné dit lui-même ce qui ne va pas.
 */
async function navCounts(): Promise<NavCounts | null> {
  try {
    const metrics = await getMetrics();
    return {
      // Même définition que l'indicateur « En attente de lecture » de la file.
      toRead: metrics.byStatus.received,
      urgentToRead: metrics.urgentOpen,
      mine: metrics.assignedToMe,
      clinicOpen:
        metrics.byStatus.received +
        metrics.byStatus.assigned +
        metrics.byStatus.in_progress,
      reportsToDownload: metrics.reportsToDownload,
    };
  } catch {
    return null;
  }
}

/**
 * Disposition commune aux portails clinique, radiologue et administration.
 *
 * **La session est résolue ici, une fois, avant tout rendu.** Aucun écran
 * ne s'affiche à quelqu'un qui n'est pas connecté, le jeton reste dans un
 * cookie que seul le serveur lit, et les composants clients reçoivent une
 * session déjà connue — sans état « en cours de chargement ».
 *
 * Chaque page vérifie en plus que le rôle actif lui correspond
 * (`requireSession(roles)`) : une disposition ne connaît pas l'adresse
 * qu'elle enveloppe, et le proxy, qui la connaît, n'est pas rejoué quand
 * une action serveur rafraîchit la page après un changement
 * d'organisation.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await requireSession();
  // En parallèle : le bandeau ne doit pas retarder la navigation, ni
  // l'inverse. Les deux lectures tolèrent un service muet.
  const [counts, settings] = await Promise.all([
    navCounts(),
    getPlatformSettings(),
  ]);

  return (
    <SessionProvider session={session}>
      {/* L'application est en français, quelle que soit la langue du site
          d'où l'on vient. */}
      <HtmlLang lang="fr" />
      <AppShell counts={counts} banner={settings?.maintenanceMessage ?? null}>
        {children}
      </AppShell>
    </SessionProvider>
  );
}
