import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { StatusScreen } from "@/components/layout/status-screen";
import { LocaleProvider } from "@/i18n/client";
import { getMessages } from "@/i18n/server";
import { homeFor } from "@/lib/navigation";
import { getAuthState } from "@/lib/session/server";

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
 * réussi — renvoyer vers l'écran de connexion produisait une boucle,
 * celui-ci renvoyant aussitôt vers un portail qui refusait l'entrée.
 *
 * L'écran dit donc ce qui se passe, et offre la seule sortie utile : se
 * déconnecter, pour se reconnecter sous un autre compte.
 *
 * Sans appartenance, la langue est celle de la requête ; le bouton de
 * déconnexion, composant client hors de tout `SessionProvider`, la reçoit
 * par son propre `LocaleProvider`.
 */
export default async function PendingAccountPage() {
  const state = await getAuthState();
  if (state === "anonymous") redirect("/connexion");
  if (state === "mfa-required") redirect("/double-authentification");
  if (state !== "no-membership") redirect(homeFor(state.active.role));

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
          <SignOutButton />
        </LocaleProvider>
      }
    />
  );
}
