"use client";

import { NewPasswordForm } from "@/components/auth/new-password-form";
import { useMessages } from "@/i18n/client";

/**
 * Choix d'un mot de passe, après réception d'un lien par courriel.
 *
 * Le chemin principal est la réinitialisation d'un mot de passe oublié.
 * Une personne invitée arrive désormais sur `/invitation`, qui présente
 * d'abord l'organisation qui l'accueille ; cet écran reste la destination
 * des invitations envoyées avant ce changement. Dans tous les cas, le
 * lien a ouvert la session (voir `/auth/callback`).
 *
 * Une fois le mot de passe enregistré, la connexion : le proxy y renvoie
 * un utilisateur connecté vers l'accueil de son portail.
 */
export default function NewPasswordPage() {
  const t = useMessages();
  return (
    <div className="w-full max-w-sm animate-[rise-in_400ms_var(--ease-out-quart)]">
      <h2 className="text-2xl font-semibold">{t.session.newPassword.title}</h2>
      <p className="mt-1.5 text-sm text-tertiary">
        {t.session.newPassword.description}
      </p>
      <div className="mt-8">
        <NewPasswordForm next="/connexion" />
      </div>
    </div>
  );
}
