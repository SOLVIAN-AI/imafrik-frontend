import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PendingActions } from "@/components/auth/pending-actions";
import { StatusScreen } from "@/components/layout/status-screen";
import { LocaleProvider } from "@/i18n/client";
import { getMessages } from "@/i18n/server";
import { isDemoMode } from "@/lib/demo/mode";
import { homeFor } from "@/lib/navigation";
import { getAuthState, getAvailableMemberships } from "@/lib/session/server";

/** Titre de l'onglet, dans la langue de l'utilisateur ; page non indexée. */
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getMessages();
  return {
    title: t.session.pending.metaTitle,
    robots: { index: false, follow: false },
  };
}

/** Adresse de l'équipe IMAFRIK, donnée telle quelle dans les deux langues. */
const CONTACT_EMAIL = "contact@imafrik.tech";

/**
 * Compte valide, rattaché à aucune organisation active.
 *
 * Deux situations y mènent : un radiologue dont le dossier attend sa
 * validation par l'équipe IMAFRIK, ou le membre d'une organisation
 * suspendue ou dont il a été retiré. Dans les deux cas, la connexion a
 * réussi : renvoyer vers l'écran de connexion produisait une boucle,
 * celui-ci renvoyant aussitôt vers un portail qui refusait l'entrée.
 *
 * L'écran dit donc ce qui se passe, et offre les sorties utiles : passer
 * dans une autre organisation active, s'il en a une, ou se déconnecter.
 *
 * **Il ne redirige jamais vers un portail.** Le proxy y envoie tout jeton
 * sans rôle ; rediriger d'ici vers un portail que ce jeton n'ouvre pas
 * produisait une boucle infinie (organisation active suspendue, jeton en
 * retard sur la base), et les boutons ne s'affichaient jamais. Quand la
 * base donne un accès que le jeton n'a pas encore, c'est le composant
 * client qui renouvelle le jeton et ne part que si le nouveau ouvre
 * effectivement un portail. Une panne du service lève une erreur
 * (`SessionUnavailableError`) : l'écran d'erreur propose de réessayer.
 *
 * Sans appartenance, la langue est celle de la requête ; les boutons,
 * composants clients hors de tout `SessionProvider`, la reçoivent par
 * leur propre `LocaleProvider`.
 */
export default async function PendingAccountPage() {
  const state = await getAuthState();
  if (state === "anonymous") redirect("/connexion");
  // Démonstration : pas de jeton, donc pas de boucle possible ; le jeu de
  // démonstration ouvre toujours un portail.
  if (isDemoMode() && typeof state !== "string")
    redirect(homeFor(state.active.role));
  // La base ouvre un accès (session, ou second facteur à vérifier) : le
  // jeton est en retard sur elle, et sera renouvelé côté client.
  const resume = state !== "no-membership";
  const memberships = resume ? [] : await getAvailableMemberships();

  const { t, locale } = await getMessages();
  return (
    <StatusScreen
      code="pending"
      eyebrow={t.session.pending.eyebrow}
      locale={locale}
      title={t.session.pending.title}
      detail={
        <>
          <p>{t.session.pending.notLinked}</p>
          <p className="mt-3">{t.session.pending.nextSteps(CONTACT_EMAIL)}</p>
        </>
      }
      actions={
        <LocaleProvider locale={locale}>
          <PendingActions memberships={memberships} resume={resume} />
        </LocaleProvider>
      }
    />
  );
}
