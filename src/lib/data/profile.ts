import "server-only";

import { apiGet } from "@/lib/api/client";
import { sessionInfoSchema } from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { getSession } from "@/lib/session/server";

/** Le profil de l'utilisateur, tel qu'il sera imprimé sur ses prochains comptes-rendus. */
export interface Profile {
  fullName: string;
  title: string;
  licenseNumber: string;
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
    return {
      fullName: session!.user.fullName,
      title: session!.user.title,
      licenseNumber: "",
    };
  }
  const info = await apiGet("/me", sessionInfoSchema);
  return {
    fullName: info.profile?.full_name ?? "",
    title: info.profile?.title ?? "",
    licenseNumber: info.profile?.license_number ?? "",
  };
}
