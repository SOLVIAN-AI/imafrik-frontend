import { cookies } from "next/headers";

import { demoSession } from "@/lib/session/demo";
import type { Membership, Session } from "@/lib/session/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/** Cookie retenant l'appartenance choisie en mode démonstration. */
const DEMO_MEMBERSHIP_COOKIE = "imafrik-demo-membership";

/**
 * Forme d'une ligne d'appartenance telle que la requête la renvoie.
 *
 * Supabase imbrique la table jointe ; le type le reflète pour éviter un
 * `any` qui masquerait un changement de schéma.
 */
interface MembershipRow {
  id: string;
  role: Membership["role"];
  organizations: {
    id: string;
    name: string;
    kind: Membership["organizationKind"];
    city: string | null;
  } | null;
}

/**
 * Session de l'utilisateur courant.
 *
 * **À n'appeler que depuis le serveur.** La requête s'exécute sous le
 * jeton de l'utilisateur : les politiques RLS ne renvoient que ses
 * propres appartenances, ce qui rend impossible de lire celles d'un
 * autre même en modifiant la requête.
 *
 * `getUser()` plutôt que `getSession()` : le second lit le cookie sans
 * le vérifier. Ici, la réponse décide d'un accès à des images médicales.
 *
 * @returns La session, ou `null` si personne n'est connecté.
 */
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) {
    const store = await cookies();
    return demoSession(store.get(DEMO_MEMBERSHIP_COOKIE)?.value);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, title, active_membership_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("memberships")
      .select("id, role, organizations(id, name, kind, city)")
      .eq("profile_id", user.id)
      .overrideTypes<MembershipRow[]>(),
  ]);

  const memberships: Membership[] = (rows ?? [])
    .filter((row): row is MembershipRow & { organizations: NonNullable<MembershipRow["organizations"]> } =>
      row.organizations !== null,
    )
    .map((row) => ({
      id: row.id,
      organizationId: row.organizations.id,
      organizationName: row.organizations.name,
      organizationKind: row.organizations.kind,
      role: row.role,
      city: row.organizations.city ?? "",
    }));

  // Un compte sans appartenance existe : c'est celui d'un radiologue dont
  // le dossier est en cours de validation. Il ne doit pas provoquer
  // d'erreur, mais il n'ouvre aucun portail.
  if (memberships.length === 0) return null;

  const active =
    memberships.find(
      (membership) => membership.id === profile?.active_membership_id,
    ) ?? memberships[0];

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: profile?.full_name ?? user.email ?? "",
      title: profile?.title ?? "",
    },
    memberships,
    active,
    isDemo: false,
  };
}
