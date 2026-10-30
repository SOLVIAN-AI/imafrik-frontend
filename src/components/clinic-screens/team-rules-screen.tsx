import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AssignmentPlanView } from "@/components/domain/assignment-plan-view";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getAssignmentPlan } from "@/lib/actions/assignment-plan";
import { type ClinicConsultation, clinicHref } from "@/lib/clinic-view";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

/**
 * Planning d'attribution de la clinique, réglé par son responsable.
 *
 * À l'arrivée d'un examen, le service l'attribue d'office au radiologue de
 * la ligne la plus précise qui le couvre ; ce que le planning ne couvre
 * pas reste à attribuer, et l'attribution directe sur l'examen corrige.
 * Le responsable n'y place que ses propres radiologues ; ceux du réseau
 * que l'équipe IMAFRIK y a placés restent visibles, et il peut retirer
 * leurs lignes.
 *
 * Dans la vue des cliniques, l'équipe IMAFRIK lit le même planning et le
 * règle par sa propre route, comme depuis la fiche de la clinique :
 * radiologues du réseau compris.
 *
 * @param consultation Clinique consultée par l'équipe IMAFRIK ; `null`
 *                     pour son responsable.
 */
export async function TeamRulesScreen({
  consultation,
}: {
  consultation: ClinicConsultation | null;
}) {
  const session = await requireSession();
  const { t } = await getMessages();
  const text = t.assignment.plan;
  const clinicId = consultation?.clinicId ?? null;
  const plan = await getAssignmentPlan(clinicId);
  const clinicName = consultation?.name ?? session.active.organizationName;
  const nobody =
    plan.ok &&
    plan.data.radiologists.length === 0 &&
    plan.data.lines.length === 0;

  return (
    <>
      <PageHeader
        title={text.title}
        description={`${consultation ? text.adminDescription : text.description} · ${clinicName}`}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href={clinicHref(consultation, "/equipe")}>
              <ArrowLeft aria-hidden />
              {text.back}
            </Link>
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 sm:px-6">
        <Panel className="p-4 sm:p-5">
          {!plan.ok ? (
            <p role="alert" className="text-xs text-urgent">
              {plan.error}
            </p>
          ) : nobody ? (
            <p className="text-xs text-secondary">
              {clinicId === null
                ? text.noRadiologists
                : text.noRadiologistsAdmin}
            </p>
          ) : (
            <AssignmentPlanView clinicId={clinicId} plan={plan.data} />
          )}
        </Panel>
      </div>
    </>
  );
}
