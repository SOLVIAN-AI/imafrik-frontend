import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/app-shell";
import {
  LanguageForm,
  PasswordForm,
  PoolForm,
  ProfileForm,
} from "@/components/settings/settings-forms";
import { MfaCard } from "@/components/settings/mfa-card";
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
 * puisse deviner.
 *
 * Chaque bloc enregistre réellement, auprès du service. Les réglages que
 * la plateforme ne sait pas encore appliquer ne sont pas affichés : un
 * interrupteur qui ne fait rien est pire que pas d'interrupteur.
 */
export default async function SettingsPage() {
  const session = await requireSession();
  const { t } = await getMessages();
  const isClinic = session.active.role === "clinic_staff";
  const [profile, organization, mfaEnrolled] = await Promise.all([
    getProfile(),
    isClinic ? getOrganization() : Promise.resolve(null),
    hasVerifiedFactor(session.active.role),
  ]);

  return (
    <>
      <PageHeader
        title={t.settings.title}
        description={`${session.active.organizationName} · ${t.common.roles[session.active.role]}`}
      />

      <div className="min-h-0 flex-1 overflow-auto px-4 pb-6 sm:px-6">
        <div className="flex max-w-2xl flex-col gap-4">
          <ProfileForm
            profile={profile}
            isRadiologist={session.active.role === "radiologist"}
          />
          <LanguageForm />
          {organization && <PoolForm openToPool={organization.openToPool} />}
          <PasswordForm />
          <MfaCard
            enrolled={mfaEnrolled}
            required={roleRequiresMfa(session.active.role)}
          />
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
