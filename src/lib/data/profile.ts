import "server-only";

import type { ReportLayout } from "@/components/editor/sections";
import { apiGet } from "@/lib/api/client";
import { sessionInfoSchema } from "@/lib/api/contracts";
import type { CredentialState, PracticeStatus } from "@/lib/credentials";
import { isDemoMode } from "@/lib/demo/mode";
import { demoLayoutPreference } from "@/lib/demo/report-layout";
import { DEMO_LICENSE_NUMBER } from "@/lib/session/demo";
import { getSession } from "@/lib/session/server";

/** Le profil de l'utilisateur, tel qu'il sera imprimé sur ses prochains comptes-rendus. */
export interface Profile {
  fullName: string;
  title: string;
  licenseNumber: string;
  /** Exercice déclaré ; `null` tant qu'il ne l'est pas. */
  practiceStatus: PracticeStatus | null;
  /** Résident : dernier jour de validité de l'attestation acceptée. */
  credentialsValidUntil: string | null;
  /**
   * État d'habilitation calculé par la base. Changer de nom, de titre, de
   * numéro ou d'exercice défait l'habilitation : le service renvoie
   * alors le nouvel état.
   */
  credentialState: CredentialState;
  /**
   * Mise en page des comptes-rendus qu'ouvre ce radiologue : découpe
   * proposée ou feuille blanche. Il en change pour chacun dans l'éditeur.
   */
  reportLayout: ReportLayout;
}

/**
 * Profil de l'utilisateur connecté.
 *
 * Lu sur le service (`GET /me`) plutôt que dans la session : le numéro
 * d'ordre n'y figure pas, et c'est lui qu'un radiologue vient vérifier
 * avant de signer.
 */
export async function getProfile(): Promise<Profile> {
  if (isDemoMode()) {
    const session = await getSession();
    const radiologist = session!.active.role === "radiologist";
    return {
      fullName: session!.user.fullName,
      title: session!.user.title,
      licenseNumber: radiologist ? DEMO_LICENSE_NUMBER : "",
      practiceStatus: radiologist ? "registered" : null,
      credentialsValidUntil: null,
      credentialState: session!.user.credentialState,
      reportLayout: await demoLayoutPreference(),
    };
  }
  const info = await apiGet("/me", sessionInfoSchema);
  return {
    fullName: info.profile?.full_name ?? "",
    title: info.profile?.title ?? "",
    licenseNumber: info.profile?.license_number ?? "",
    practiceStatus: info.profile?.practice_status ?? null,
    credentialsValidUntil: info.profile?.credentials_valid_until ?? null,
    credentialState: info.profile?.credential_state ?? "undeclared",
    reportLayout: info.profile?.report_layout ?? "structured",
  };
}
