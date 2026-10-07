import { Activity } from "lucide-react";
import type { Metadata } from "next";

import { ClinicFilter } from "@/components/admin/clinic-filter";
import { ControlBody, Figure, Section } from "@/components/admin/control-ui";
import { FlowList, SegmentLegend } from "@/components/admin/flow-list";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { parseClinic } from "@/lib/admin-params";
import { quantile } from "@/lib/charts";
import { listOrganizations } from "@/lib/data/admin";
import { type PipelineStudy, getPipeline } from "@/lib/data/control";
import {
  formatBytes,
  formatCount,
  formatMinutes,
  formatRate,
} from "@/lib/format";
import { throughput } from "@/lib/pipeline";
import { requireSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Flux d’images" };

/** Examens affichés : assez pour voir une tendance, assez peu pour rester lisible. */
const LIMIT = 100;

/**
 * Flux d'images, examen par examen.
 *
 * Du scanner de la clinique au compte-rendu remis : chaque examen récent
 * avec sa vitesse de réception sur le serveur central et la durée de
 * chaque étape. C'est l'écran qu'on ouvre quand une clinique appelle —
 * « nos images n'arrivent pas », « le compte-rendu tarde » — pour savoir
 * en dix secondes si c'est la liaison, la file ou la lecture.
 *
 * Aucune identité de patient : le service ne la transmet pas ici.
 */
export default async function FlowPage({
  searchParams,
}: PageProps<"/admin/flux">) {
  await requireSession(["platform_admin"]);
  const params = await searchParams;
  const clinics = (await listOrganizations())
    .filter((org) => org.kind === "clinic")
    .map((org) => ({ id: org.id, name: org.name }));
  const clinicId = parseClinic(
    params.clinique,
    clinics.map((clinic) => clinic.id),
  );
  const studies = await getPipeline(LIMIT, clinicId);

  return (
    <>
      <PageHeader
        title="Flux d’images"
        description={`${studies.length} derniers examens reçus · de l’acquisition à la remise du compte-rendu`}
        actions={<ClinicFilter clinics={clinics} />}
      />
      <ControlBody>
        {studies.length === 0 ? (
          <Section title="Examens">
            <EmptyState
              icon={Activity}
              title="Aucun examen reçu"
              detail="Les examens apparaissent ici dès que le PACS central les a reçus."
            />
          </Section>
        ) : (
          <>
            <Summary studies={studies} />
            <Section
              title="Examens"
              description="Les plus récents en tête"
              aside={<SegmentLegend />}
              flush
            >
              <FlowList studies={studies} />
            </Section>
          </>
        )}
      </ControlBody>
    </>
  );
}

/** Synthèse des examens affichés. */
function Summary({ studies }: { studies: PipelineStudy[] }) {
  const rates = studies
    .map(throughput)
    .filter((rate): rate is number => rate !== null);
  const arrivals = studies
    .filter((study) => study.acquiredAt && study.lastInstanceAt)
    .map(
      (study) =>
        (study.lastInstanceAt!.getTime() - study.acquiredAt!.getTime()) /
        60_000,
    );
  const bytes = studies.reduce(
    (sum, study) => sum + (study.transferBytes ?? 0),
    0,
  );
  const waiting = studies.filter((study) => study.claimedAt === null).length;
  const slowest = quantile(rates, 0.1);

  return (
    <section
      aria-label="Synthèse"
      className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised sm:grid-cols-4"
    >
      <Figure
        label="Débit médian"
        value={formatRate(quantile(rates, 0.5))}
        hint={`10 % sous ${formatRate(slowest)}`}
        tone={slowest !== null && slowest < 1 ? "progress" : undefined}
      />
      <Figure
        label="Acheminement médian"
        value={formatMinutes(quantile(arrivals, 0.5))}
        hint="acquisition → dernière image"
      />
      <Figure
        label="Volume reçu"
        value={formatBytes(bytes)}
        hint={`${formatCount(studies.length)} examens`}
      />
      <Figure
        label="En file"
        value={formatCount(waiting)}
        hint="pas encore pris en charge"
        tone={waiting > 0 ? "progress" : "done"}
      />
    </section>
  );
}
