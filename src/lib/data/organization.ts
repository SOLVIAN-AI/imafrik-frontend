import "server-only";

import { z } from "zod";

import { apiGet } from "@/lib/api/client";
import {
  memberSchema,
  organizationSchema,
  type ApiMember,
} from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { getSession } from "@/lib/session/server";
import type { OrgKind, UserRole } from "@/lib/session/types";

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
  };
}

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
      memberCount: 1,
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

/** Les membres de l'organisation active, triés par nom. */
export async function listMembers(): Promise<Member[]> {
  if (isDemoMode()) {
    const session = await getSession();
    return [
      {
        membershipId: session!.active!.id,
        profileId: session!.user.id,
        fullName: session!.user.fullName,
        title: session!.user.title || null,
        email: session!.user.email,
        role: session!.active!.role,
        joinedAt: new Date(),
        isMe: true,
      },
    ];
  }
  const rows = await apiGet("/organization/members", z.array(memberSchema));
  return rows.map(toMember);
}
