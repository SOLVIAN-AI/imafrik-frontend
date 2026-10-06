import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/app-shell";
import {
  PasswordForm,
  PoolForm,
  ProfileForm,
} from "@/components/settings/settings-forms";
import { getOrganization } from "@/lib/data/organization";
import { getProfile } from "@/lib/data/profile";
import { requireSession } from "@/lib/session/server";
import { ROLE_LABELS } from "@/lib/session/types";

export const metadata: Metadata = { title: "Paramètres" };

/**
 * Paramètres.
 *
 * Organisés par **objet** — moi, mon organisation, mon accès — et non par
 * écran d'origine : c'est la seule classification que l'utilisateur
 * puisse deviner.
 *
 * Chaque bloc enregistre réellement, auprès du service. Les réglages que
 * la plateforme ne sait pas encore appliquer ne sont pas affichés : un
 * interrupteur qui ne fait rien est pire que pas d'interrupteur.
 */
export default async function SettingsPage() {
  const session = await requireSession();
  const isClinic = session.active.role === "clinic_staff";
  const [profile, organization] = await Promise.all([
    getProfile(),
    isClinic ? getOrganization() : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader
        title="Paramètres"
        description={`${session.active.organizationName} · ${ROLE_LABELS[session.active.role]}`}
      />

      <div className="min-h-0 flex-1 overflow-auto px-4 pb-6 sm:px-6">
        <div className="flex max-w-2xl flex-col gap-4">
          <ProfileForm
            profile={profile}
            isRadiologist={session.active.role === "radiologist"}
          />
          {organization && <PoolForm openToPool={organization.openToPool} />}
          <PasswordForm />
        </div>
      </div>
    </>
  );
}
