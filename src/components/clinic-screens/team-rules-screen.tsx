import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AssignmentRulesForm } from "@/components/domain/assignment-rules-form";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getAssignmentRules } from "@/lib/actions/assignment-rules";
import { type ClinicConsultation, clinicHref } from "@/lib/clinic-view";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

/**
 * Règles d'attribution de la clinique, réglées par son responsable.
 *
 * Le radiologue de chaque modalité, puis le planning de la semaine : à
 * l'arrivée d'un examen, le service le confie au radiologue prévu, s'il
 * peut le recevoir ; sinon l'examen reste à attribuer. Le responsable n'y
 * place que ses propres radiologues ; ceux du réseau que l'équipe IMAFRIK
 * y a placés restent visibles, et il peut les retirer.
 *
 * Dans la vue des cliniques, l'équipe IMAFRIK lit les mêmes règles et les
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
  const text = t.assignment.rules;
  const clinicId = consultation?.clinicId ?? null;
  const rules = await getAssignmentRules(clinicId);
  const clinicName = consultation?.name ?? session.active.organizationName;

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
        <Panel className="max-w-3xl p-4 sm:p-5">
          {rules.ok ? (
            <AssignmentRulesForm
              key={rules.data.version}
              clinicId={clinicId}
              rules={rules.data}
            />
          ) : (
            <p role="alert" className="text-xs text-urgent">
              {rules.error}
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}
