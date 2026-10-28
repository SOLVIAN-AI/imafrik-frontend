import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AssignmentRulesForm } from "@/components/domain/assignment-rules-form";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { getAssignmentRules } from "@/lib/actions/assignment-rules";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.assignment.rules.title };
}

/**
 * Règles d'attribution de la clinique, réglées par son responsable.
 *
 * Le radiologue de chaque modalité, puis le planning de la semaine : à
 * l'arrivée d'un examen, le service le confie au radiologue prévu, s'il
 * peut le recevoir ; sinon l'examen reste à attribuer. Le responsable n'y
 * place que ses propres radiologues ; ceux du réseau que l'équipe IMAFRIK
 * y a placés restent visibles, et il peut les retirer.
 */
export default async function AssignmentRulesPage() {
  const session = await requireSession(["clinic_staff"]);
  const { t } = await getMessages();
  const text = t.assignment.rules;
  const rules = await getAssignmentRules(null);

  return (
    <>
      <PageHeader
        title={text.title}
        description={`${text.description} · ${session.active.organizationName}`}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/equipe">
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
              clinicId={null}
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
