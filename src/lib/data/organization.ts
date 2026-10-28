import "server-only";

import { z } from "zod";

import { apiGet } from "@/lib/api/client";
import {
  memberSchema,
  organizationSchema,
  type ApiMember,
  type ModalityGroup,
} from "@/lib/api/contracts";
import { clinicViewApi } from "@/lib/clinic-view";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_MEMBERSHIPS, demoSession } from "@/lib/session/demo";
import { getSession } from "@/lib/session/server";
import type { OrgKind, Session, UserRole } from "@/lib/session/types";

/** L'organisation active et ses réglages. */
export interface Organization {
  id: string;
  name: string;
  kind: OrgKind;
  city: string | null;
  /** Clinique : ses examens sont-ils proposés aux radiologues du pool ? */
  openToPool: boolean;
  memberCount: number;
}

/** Un membre de l'organisation active. */
export interface Member {
  membershipId: string;
  profileId: string;
  fullName: string;
  title: string | null;
  email: string | null;
  role: UserRole;
  joinedAt: Date;
  isMe: boolean;
  /** Radiologue : groupes de modalités qu'il lit ; `null` pour toutes. */
  readModalities: ModalityGroup[] | null;
  /** Radiologue : sur la liste d'urgence de la clinique. */
  urgentReader: boolean;
}

/** Traduit un membre depuis la forme de l'API. */
export function toMember(row: ApiMember): Member {
  return {
    membershipId: row.membership_id,
    profileId: row.profile_id,
    fullName: row.full_name,
    title: row.title,
    email: row.email,
    role: row.role,
    joinedAt: new Date(row.joined_at),
    isMe: row.is_me,
    readModalities: row.read_modalities ?? null,
    urgentReader: row.urgent_reader,
  };
}

/** Fabrique un collègue de démonstration. */
function colleague(
  id: string,
  fullName: string,
  title: string | null,
  email: string,
  role: UserRole,
  joined: string,
  reading: Pick<Member, "readModalities" | "urgentReader"> = {
    readModalities: null,
    urgentReader: false,
  },
): Member {
  return {
    membershipId: `m-${id}`,
    profileId: `p-${id}`,
    fullName,
    title,
    email,
    role,
    joinedAt: new Date(joined),
    isMe: false,
    ...reading,
  };
}

/**
 * Collègues de démonstration, par appartenance active.
 *
 * Une équipe d'une seule personne ne montre rien de l'écran : ni la
 * liste, ni les rôles, ni le retrait d'un membre.
 */
const DEMO_COLLEAGUES: Record<string, Member[]> = {
  "m-clinic": [
    colleague(
      "kamouzou",
      "Kossi Amouzou",
      "Dr",
      "k.amouzou@cliniquesaintjoseph.tg",
      "clinic_staff",
      "2026-06-02T09:00:00Z",
    ),
    colleague(
      "ydoe",
      "Yawa Doe",
      null,
      "y.doe@cliniquesaintjoseph.tg",
      "clinic_staff",
      "2026-06-15T09:00:00Z",
    ),
    colleague(
      "klawson",
      "Komi Lawson",
      null,
      "secretariat@cliniquesaintjoseph.tg",
      "clinic_staff",
      "2026-08-20T09:00:00Z",
    ),
    // Radiologue de la clinique : ses modalités et la liste d'urgence se
    // règlent depuis l'écran « Équipe ».
    colleague(
      "amensah",
      "Afi Mensah",
      "Dr",
      "a.mensah@cliniquesaintjoseph.tg",
      "radiologist",
      "2026-07-01T09:00:00Z",
      { readModalities: ["radiography", "ultrasound"], urgentReader: true },
    ),
  ],
  "m-radio": [
    colleague(
      "ibakari",
      "Ibrahim Bakari",
      "Dr",
      "i.bakari@imafrik.tech",
      "radiologist",
      "2026-05-12T09:00:00Z",
    ),
    colleague(
      "etchalla",
      "Essi Tchalla",
      "Pr",
      "e.tchalla@imafrik.tech",
      "radiologist",
      "2026-07-01T09:00:00Z",
    ),
  ],
  "m-admin": [
    colleague(
      "sagbeko",
      "Sena Agbeko",
      null,
      "support@imafrik.tech",
      "platform_admin",
      "2026-05-01T09:00:00Z",
    ),
  ],
};

/** L'organisation active. */
export async function getOrganization(): Promise<Organization> {
  if (isDemoMode()) {
    const session = await getSession();
    const active = session!.active!;
    return {
      id: active.organizationId,
      name: active.organizationName,
      kind: active.organizationKind,
      city: active.city,
      openToPool: true,
      memberCount: 1 + (DEMO_COLLEAGUES[active.id]?.length ?? 0),
    };
  }
  const row = await apiGet("/organization", organizationSchema);
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    city: row.city,
    openToPool: row.open_to_pool,
    memberCount: row.member_count,
  };
}

/**
 * Les membres de l'organisation active, triés par nom.
 *
 * @param clinicId Clinique consultée par l'équipe IMAFRIK (vue des
 *                 cliniques) : son équipe, telle que la voit son
 *                 responsable ; personne n'y est l'utilisateur.
 */
export async function listMembers(clinicId?: string): Promise<Member[]> {
  if (isDemoMode()) {
    if (clinicId) return demoClinicMembers(clinicId);
    const session = await getSession();
    return demoMembers(session!, true);
  }
  const path = clinicId
    ? `${clinicViewApi(clinicId)}/members`
    : "/organization/members";
  const rows = await apiGet(path, z.array(memberSchema));
  return rows.map(toMember);
}

/** L'équipe de démonstration d'une session : son titulaire et ses collègues. */
function demoMembers(session: Session, isMe: boolean): Member[] {
  const me: Member = {
    membershipId: session.active.id,
    profileId: session.user.id,
    fullName: session.user.fullName,
    title: session.user.title || null,
    email: session.user.email,
    role: session.active.role,
    joinedAt: new Date("2026-06-02T09:00:00Z"),
    isMe,
    readModalities: null,
    urgentReader: false,
  };
  return [me, ...(DEMO_COLLEAGUES[session.active.id] ?? [])].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "fr"),
  );
}

/**
 * L'équipe d'une clinique de démonstration : celle de la Clinique
 * Saint-Joseph, que voit sa responsable ; les autres n'ont encore aucun
 * membre, comme une clinique tout juste raccordée.
 */
function demoClinicMembers(clinicId: string): Member[] {
  const clinic = DEMO_MEMBERSHIPS.find(
    (membership) => membership.role === "clinic_staff",
  )!;
  if (clinicId !== clinic.organizationId) return [];
  return demoMembers(demoSession(clinic.id), false);
}
