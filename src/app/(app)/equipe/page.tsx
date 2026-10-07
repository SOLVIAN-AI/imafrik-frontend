import type { Metadata } from "next";

import {
  InviteMemberButton,
  MemberActions,
} from "@/components/domain/team-actions";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { listMembers } from "@/lib/data/organization";
import { formatDate, formatPersonName } from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import { ROLE_LABELS } from "@/lib/session/types";

export const metadata: Metadata = { title: "Équipe" };

/** Initiales d'un nom, pour la pastille. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => /^[\p{Lu}]/u.test(part))
    .slice(-2)
    .map((part) => part[0])
    .join("");
}

/**
 * Membres de l'établissement.
 *
 * L'invitation ne crée pas de mot de passe : elle envoie un lien, et
 * c'est le destinataire qui choisit le sien. Créer le compte à sa place
 * obligerait à lui transmettre un mot de passe par un canal qui n'est
 * jamais sûr — et, dans un service qui trace chaque accès aux images, un
 * compte doit appartenir à une personne, pas à un poste.
 *
 * La liste vient du service, qui revérifie en base que l'utilisateur est
 * toujours membre avant de la lui montrer.
 */
export default async function TeamPage() {
  const session = await requireSession(["clinic_staff"]);
  const members = await listMembers();

  return (
    <>
      <PageHeader
        title="Équipe"
        description={`${members.length} membre${members.length > 1 ? "s" : ""} · ${session.active.organizationName}`}
        actions={
          <InviteMemberButton
            organizationName={session.active.organizationName}
          />
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="flex min-h-0 flex-col overflow-hidden">
          <ul className="divide-y divide-border-subtle overflow-auto">
            {members.map((member) => (
              <li
                key={member.membershipId}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent-500 to-accent-700 text-2xs font-semibold text-white"
                  aria-hidden
                >
                  {initials(member.fullName)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {formatPersonName(member.title, member.fullName)}
                    {member.isMe && (
                      <span className="ml-2 text-2xs text-tertiary">
                        (vous)
                      </span>
                    )}
                  </p>
                  <p className="truncate text-2xs text-tertiary">
                    {member.email ?? "—"}
                  </p>
                  {/* Téléphone : rôle et date passent sous le nom, qui
                      sinon se réduisait à son initiale. */}
                  <p className="mt-0.5 truncate text-2xs text-tertiary sm:hidden">
                    {ROLE_LABELS[member.role]} depuis le{" "}
                    {formatDate(member.joinedAt)}
                  </p>
                </div>

                <span className="hidden shrink-0 text-xs text-secondary sm:inline">
                  {ROLE_LABELS[member.role]}
                </span>
                <span className="hidden w-36 shrink-0 text-right text-2xs text-tertiary md:inline">
                  Depuis le {formatDate(member.joinedAt)}
                </span>

                <div className="w-8 shrink-0">
                  {!member.isMe && (
                    <MemberActions
                      membershipId={member.membershipId}
                      fullName={member.fullName}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
