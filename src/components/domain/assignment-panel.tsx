import { FileCheck2, History, Siren, UserCheck } from "lucide-react";

import { AssignDialog } from "@/components/domain/assign-dialog";
import { DateTime } from "@/components/domain/date-time";
import { Panel } from "@/components/layout/app-shell";
import type { AppMessages } from "@/i18n";
import type { AssignmentState } from "@/lib/actions/assignment";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Bloc « Attribution » de la fiche d'un examen, vu de la clinique.
 *
 * Il dit qui lit l'examen, depuis quand, et quelles antériorités lui sont
 * partagées ; la fenêtre d'attribution réattribue, retire l'attribution,
 * ajoute ou retire une antériorité. Tant que l'examen n'est attribué à
 * personne, aucun radiologue ne le voit : le bloc le dit, sauf pour une
 * urgence, que la liste d'urgence voit et peut prendre.
 *
 * @param studyId  Examen.
 * @param patient  Nom du patient, pour l'intitulé accessible du bouton.
 * @param state    Attribution lue par le service, `null` si indisponible.
 * @param signedBy Signataire, une fois le compte-rendu signé.
 * @param messages Textes de l'attribution.
 * @param locale   Langue de l'utilisateur.
 */
export function AssignmentPanel({
  studyId,
  patient,
  state,
  signedBy,
  messages,
  locale,
}: {
  studyId: string;
  patient: string;
  state: AssignmentState | null;
  signedBy: string | null;
  messages: AppMessages["assignment"];
  locale: Locale;
}) {
  const text = messages.sheet;
  const open =
    state !== null &&
    ["received", "assigned", "in_progress"].includes(state.status);
  return (
    <Panel className="flex flex-col overflow-hidden" tour="study-assignment">
      <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        <h2 className="label-eyebrow flex-1">{text.title}</h2>
        {open && (
          <AssignDialog
            portal="clinic"
            studyId={studyId}
            patient={patient}
            assigned={state.assignedTo !== null}
          />
        )}
      </div>
      <div className="flex flex-col gap-2 p-4 text-xs">
        {signedBy ? (
          <p className="flex items-center gap-2 text-secondary">
            <FileCheck2 className="size-3.5 text-done" aria-hidden />
            {text.signedBy(signedBy)}
          </p>
        ) : state?.assignedToName ? (
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <UserCheck className="size-3.5 text-accent" aria-hidden />
            <span className="font-medium text-primary">
              {text.holder(state.assignedToName)}
            </span>
            {state.assignedAt && (
              <span className="text-secondary">
                {text.since} <DateTime date={new Date(state.assignedAt)} />
              </span>
            )}
            {state.assignedByRule && (
              <span className="basis-full pl-5 text-tertiary">
                {messages.rules.assignedBy(
                  messages.rules.byRule[state.assignedByRule],
                )}
              </span>
            )}
          </p>
        ) : state ? (
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-2 font-medium text-progress">
              {state.urgent ? (
                <Siren className="size-3.5" aria-hidden />
              ) : (
                <UserCheck className="size-3.5" aria-hidden />
              )}
              {text.toAssign}
            </p>
            <p className="text-secondary">
              {state.urgent ? text.urgentWaiting : text.toAssignHint}
            </p>
          </div>
        ) : null}

        {state && open && state.assignedTo && (
          <div className="flex flex-col gap-1 border-t border-border-subtle pt-2">
            <p className="flex items-center gap-1.5 text-secondary">
              <History className="size-3.5 text-tertiary" aria-hidden />
              {text.priorsShared(state.priorShares.length)}
            </p>
            {state.priorShares.length > 0 && (
              <ul className="flex flex-col gap-0.5 pl-5 text-tertiary">
                {state.priorShares.map((share) => (
                  <li key={share.id}>
                    {formatDate(new Date(share.studyDate), locale)}
                    {" · "}
                    {[share.modality, share.bodyPart].filter(Boolean).join(" ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
