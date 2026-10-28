import { CalendarClock, Siren } from "lucide-react";
import Link from "next/link";

import { ReadingDialog } from "@/components/domain/reading-dialog";
import {
  InviteMemberButton,
  MemberActions,
} from "@/components/domain/team-actions";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { type ClinicConsultation, clinicHref } from "@/lib/clinic-view";
import { listMembers } from "@/lib/data/organization";
import { describeModalities } from "@/lib/modalities";
import { formatDate, formatPersonName } from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

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
 * jamais sûr ; et, dans un service qui trace chaque accès aux images, un
 * compte doit appartenir à une personne, pas à un poste.
 *
 * La liste vient du service, qui revérifie en base que l'utilisateur est
 * toujours membre avant de la lui montrer.
 *
 * Chaque responsable invite et retire responsables et radiologues ; le
 * dernier responsable ne se retire pas (le service le refuse, et un
 * responsable seul en est averti ici).
 *
 * Pour chaque radiologue de la clinique, le responsable règle les
 * modalités qu'il lit (elles bornent ce qu'on peut lui attribuer) et sa
 * place sur la liste d'urgence (il peut alors prendre une urgence sans
 * attribution). Les règles d'attribution (radiologue par modalité,
 * planning de la semaine) ont leur écran, « Équipe › Règles
 * d'attribution ».
 *
 * Dans la vue des cliniques, l'équipe IMAFRIK voit la même équipe, avec
 * les modalités et la liste d'urgence de chacun, sans aucun geste du
 * responsable (inviter, retirer, régler un radiologue). Elle règle la
 * liste d'urgence de la clinique depuis sa fiche, son propre geste.
 *
 * @param consultation Clinique consultée par l'équipe IMAFRIK ; `null`
 *                     pour son responsable.
 */
export async function TeamScreen({
  consultation,
}: {
  consultation: ClinicConsultation | null;
}) {
  const session = await requireSession();
  const members = await listMembers(consultation?.clinicId);
  const { t, locale } = await getMessages();
  const messages = t.clinic.team;
  const clinicName = consultation?.name ?? session.active.organizationName;
  const managers = members.filter(
    (member) => member.role === "clinic_staff",
  ).length;
  // Seul responsable : la clinique ne peut pas le perdre (le service
  // refuse son retrait), mais elle resterait sans relais en son absence.
  const note =
    managers === 1
      ? consultation
        ? t.clinicView.team.soleManager
        : messages.soleManager
      : managers === 0 && consultation
        ? t.clinicView.team.noManager
        : null;

  return (
    <>
      <PageHeader
        title={messages.title}
        description={`${messages.count(members.length)} · ${clinicName}`}
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href={clinicHref(consultation, "/equipe/regles")}>
                <CalendarClock aria-hidden />
                {t.assignment.rules.trigger}
              </Link>
            </Button>
            {consultation ? (
              <Button asChild variant="secondary" size="sm">
                <Link
                  href={`/admin/organisations/${consultation.clinicId}#liste-urgence`}
                >
                  <Siren aria-hidden />
                  {t.clinicView.team.urgentList}
                </Link>
              </Button>
            ) : (
              <InviteMemberButton organizationName={clinicName} />
            )}
          </>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        {note && (
          <p className="mb-3 rounded-lg bg-progress-muted px-3 py-2.5 text-xs leading-relaxed text-progress">
            {note}
          </p>
        )}
        {/* Une clinique sans membre (vue des cliniques) : l'avis suffit. */}
        {members.length > 0 && (
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
                          {messages.you}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-2xs text-tertiary">
                      {member.email ?? "—"}
                    </p>
                    {member.role === "radiologist" && (
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-secondary">
                        <span className="truncate">
                          {describeModalities(
                            member.readModalities,
                            t.assignment.modalities,
                          )}
                        </span>
                        {member.urgentReader && (
                          <span className="inline-flex items-center gap-1 font-medium text-urgent">
                            <Siren className="size-3" aria-hidden />
                            {t.assignment.reading.urgentBadge}
                          </span>
                        )}
                      </p>
                    )}
                    {/* Téléphone : rôle et date passent sous le nom, qui
                      sinon se réduisait à son initiale. */}
                    <p className="mt-0.5 truncate text-2xs text-tertiary sm:hidden">
                      {messages.roleSince(
                        t.common.roles[member.role],
                        formatDate(member.joinedAt, locale),
                      )}
                    </p>
                  </div>

                  <span className="hidden shrink-0 text-xs text-secondary sm:inline">
                    {t.common.roles[member.role]}
                  </span>
                  <span className="hidden w-36 shrink-0 text-right text-2xs text-tertiary md:inline">
                    {messages.since(formatDate(member.joinedAt, locale))}
                  </span>

                  {!consultation && member.role === "radiologist" && (
                    <ReadingDialog
                      membershipId={member.membershipId}
                      name={formatPersonName(member.title, member.fullName)}
                      readModalities={member.readModalities}
                      urgentReader={member.urgentReader}
                    />
                  )}

                  {!consultation && (
                    <div className="w-8 shrink-0">
                      {!member.isMe && (
                        <MemberActions
                          membershipId={member.membershipId}
                          fullName={member.fullName}
                        />
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </>
  );
}
