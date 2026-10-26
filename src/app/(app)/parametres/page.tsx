import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/app-shell";
import {
  LanguageForm,
  PasswordForm,
  PoolForm,
  ProfileForm,
} from "@/components/settings/settings-forms";
import { CredentialFileCard } from "@/components/credentials/credential-file-card";
import { MfaCard } from "@/components/settings/mfa-card";
import { getMyCredentialDocuments } from "@/lib/data/credentials";
import { getOrganization } from "@/lib/data/organization";
import { getProfile } from "@/lib/data/profile";
import { isDemoMode } from "@/lib/demo/mode";
import { roleRequiresMfa } from "@/lib/session/mfa";
import { requireSession } from "@/lib/session/server";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.settings.title };
}

/**
 * Paramètres.
 *
 * Organisés par **objet** — moi, mon organisation, mon accès — et non par
 * écran d'origine : c'est la seule classification que l'utilisateur
 * puisse deviner. Sur grand écran, « moi » à gauche, organisation et
 * accès à droite.
 *
 * Chaque bloc enregistre réellement, auprès du service. Les réglages que
 * la plateforme ne sait pas encore appliquer ne sont pas affichés : un
 * interrupteur qui ne fait rien est pire que pas d'interrupteur.
 */
export default async function SettingsPage() {
  const session = await requireSession();
  const { t } = await getMessages();
  const isClinic = session.active.role === "clinic_staff";
  const isRadiologist = session.active.role === "radiologist";
  const [profile, organization, mfaEnrolled, documents] = await Promise.all([
    getProfile(),
    isClinic ? getOrganization() : Promise.resolve(null),
    hasVerifiedFactor(session.active.role),
    isRadiologist ? getMyCredentialDocuments() : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title={t.settings.title}
        description={`${session.active.organizationName} · ${t.common.roles[session.active.role]}`}
      />

      <div className="min-h-0 flex-1 overflow-auto px-4 pb-6 sm:px-6">
        {/* Deux colonnes à partir de 1280 px : à gauche ce qui vous décrit,
            à droite votre organisation et votre accès. En dessous, une
            seule colonne à largeur de lecture. Une colonne unique calée à
            gauche laissait, sur un grand écran, la moitié de la page vide. */}
        <div className="grid max-w-2xl gap-4 xl:max-w-none xl:grid-cols-2 xl:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            {isRadiologist && (
              <CredentialFileCard profile={profile} documents={documents} />
            )}
            <ProfileForm profile={profile} isRadiologist={isRadiologist} />
            {/* Le dossier d'un radiologue occupe déjà la colonne de gauche :
                sa langue passe à droite, et les deux colonnes s'équilibrent. */}
            {!isRadiologist && <LanguageForm />}
            {organization && <PoolForm openToPool={organization.openToPool} />}
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            {isRadiologist && <LanguageForm />}
            <PasswordForm />
            <MfaCard enrolled={mfaEnrolled} />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Un facteur vérifié existe-t-il pour l'utilisateur ? En démonstration,
 * on suppose que les rôles qui l'exigent l'ont configuré.
 */
async function hasVerifiedFactor(
  role: Parameters<typeof roleRequiresMfa>[0],
): Promise<boolean> {
  if (isDemoMode()) return roleRequiresMfa(role);
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  return Boolean(data?.totp.some((factor) => factor.status === "verified"));
}
