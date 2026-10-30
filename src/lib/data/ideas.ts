import "server-only";

import { z } from "zod";

import { apiGet } from "@/lib/api/client";
import {
  type ApiAdminIdea,
  type ApiIdea,
  ideaInboxSchema,
  ideaSchema,
} from "@/lib/api/contracts";
import { demoIdeaInbox, demoMyIdeas } from "@/lib/demo/ideas";
import { isDemoMode } from "@/lib/demo/mode";
import type { Idea, IdeaAuthorRole, IdeaInbox, InboxIdea } from "@/lib/ideas";

/**
 * Lectures de « Vos idées » : les idées de l’auteur, sous RLS, et la boîte
 * de l’équipe IMAFRIK. En démonstration, les idées d’exemple
 * (`lib/demo/ideas.ts`).
 */

const date = (value: string | null): Date | null =>
  value ? new Date(value) : null;

/** Une idée du service, dans le vocabulaire de l’interface. */
function toIdea(row: ApiIdea): Idea {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    benefit: row.benefit,
    screen: row.screen,
    appVersion: row.app_version,
    device: row.device,
    status: row.status,
    statusChangedAt: date(row.status_changed_at),
    response: row.response,
    respondedAt: date(row.responded_at),
    grouped: row.grouped,
    createdAt: new Date(row.created_at),
  };
}

/** Une idée de la boîte de l’équipe IMAFRIK. */
function toInboxIdea(row: ApiAdminIdea): InboxIdea {
  return {
    ...toIdea(row),
    authorId: row.author_id,
    authorName: row.author_name,
    authorRole: row.author_role,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    organizationKind: row.organization_kind,
    duplicateOf: row.duplicate_of,
    duplicateOfTitle: row.duplicate_of_title,
    duplicates: row.duplicates,
    respondedByName: row.responded_by_name,
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Les idées de l’utilisateur connecté, les plus récentes d’abord.
 *
 * @param role Rôle de l’appartenance active (démonstration : la
 *             radiologue ou la responsable).
 */
export async function listMyIdeas(role: IdeaAuthorRole): Promise<Idea[]> {
  if (isDemoMode()) return demoMyIdeas(role);
  const rows = await apiGet("/me/ideas", z.array(ideaSchema));
  return rows.map(toIdea);
}

/**
 * La boîte des idées de l’équipe IMAFRIK.
 *
 * Réservée à l’équipe : le service vérifie le rôle en base à chaque appel.
 */
export async function listIdeaInbox(): Promise<IdeaInbox> {
  if (isDemoMode()) return demoIdeaInbox();
  const inbox = await apiGet("/admin/ideas", ideaInboxSchema);
  return { items: inbox.items.map(toInboxIdea), total: inbox.total };
}
