import { redirect } from "next/navigation";

import { HtmlLang } from "@/components/i18n/html-lang";
import { AppShell } from "@/components/layout/app-shell";
import { SessionProvider } from "@/components/providers/session-provider";
import { HelpProvider } from "@/components/help/help-panel";
import { TourProvider } from "@/components/tour/tour-provider";
import { getPendingAgreements } from "@/lib/data/agreements";
import { listViewableClinics } from "@/lib/data/clinic-view";
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
      // La file « À lire » : ce qui est attribué au radiologue et pas
      // encore commencé, plus les urgences de sa liste d'urgence.
      toRead: metrics.assignedNew + metrics.urgentToTake,
      urgentToRead: metrics.urgentToTake,
      mine: metrics.assignedToMe,
      // La clinique, et l'équipe IMAFRIK : ce qu'aucun radiologue ne voit
      // encore, dont les urgences.
      clinicOpen: metrics.toAssign,
      urgentToAssign: metrics.urgentToTake,
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
 *
 * **Un engagement en vigueur non accepté renvoie vers `/engagements`** :
 * contrat d'exercice d'un radiologue, convention d'un établissement,
 * nouvelle version de l'un ou de l'autre. Le service refuserait de toute
 * façon les opérations du portail ; la garde évite d'ouvrir des écrans
 * qui échoueraient. Elle tolère une panne (voir `getPendingAgreements`) :
 * la protection reste celle du service.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await requireSession();
  // En parallèle : le bandeau ne doit pas retarder la navigation, ni
  // l'inverse. Les quatre lectures tolèrent un service muet. Les
  // cliniques ne servent qu'à l'équipe IMAFRIK, pour sa vue des cliniques.
  const [counts, settings, pendingAgreements, clinics] = await Promise.all([
    navCounts(),
    getPlatformSettings(),
    getPendingAgreements(),
    session.active.role === "platform_admin" ? listViewableClinics() : [],
  ]);
  if (pendingAgreements.length > 0) redirect("/engagements");

  return (
    <SessionProvider session={session}>
      {/* La langue de l'utilisateur, celle de son profil. */}
      <HtmlLang lang={session.locale} />
      {/* Visites guidées : la prise en main de chaque écran, à la
          première ouverture. */}
      <TourProvider>
        {/* Aide de l'écran : bouton « ? » ou touche `?`. */}
        <HelpProvider>
          <AppShell
            counts={counts}
            clinics={clinics}
            banner={settings?.maintenanceMessage ?? null}
          >
            {children}
          </AppShell>
        </HelpProvider>
      </TourProvider>
    </SessionProvider>
  );
}
