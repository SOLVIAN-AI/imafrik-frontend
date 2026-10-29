import { Activity } from "lucide-react";
import type { Metadata } from "next";

import { ControlBody, Figure, Section } from "@/components/admin/control-ui";
import { FlowList, SegmentLegend } from "@/components/admin/flow-list";
import { FilterBar } from "@/components/filters/filter-bar";
import { FilteredEmpty } from "@/components/filters/filtered-empty";
import { PageHeader } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { quantile } from "@/lib/charts";
import { listOrganizations } from "@/lib/data/admin";
import { type PipelineStudy, getPipeline } from "@/lib/data/control";
import { type BarDimension, STUDY_STATES } from "@/lib/filters/dimensions";
import { LIST_FILTERS } from "@/lib/filters/screens";
import { studyQuery } from "@/lib/filters/studies";
import { hasFilters, readFilters } from "@/lib/filters/url";
import { MODALITY_GROUPS } from "@/lib/modalities";
import {
  formatBytes,
  formatCount,
  formatMinutes,
  formatRate,
} from "@/lib/format";
import { throughput } from "@/lib/pipeline";
import type { Locale } from "@/lib/i18n/locale";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.flow };
}

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
  const { t, locale } = await getMessages();
  const text = t.admin.flow;
  const params = await searchParams;
  const clinics = (await listOrganizations())
    .filter((org) => org.kind === "clinic")
    .map((org) => ({ id: org.id, name: org.name }));
  const keys = LIST_FILTERS.flux;
  const filters = readFilters(params, keys, {
    clinic: clinics.map((clinic) => clinic.id),
  });
  // Filtrés par le service avant sa limite : « les cent derniers scanners
  // urgents », pas un filtre sur les cent derniers examens.
  const query = studyQuery(filters);
  const studies = await getPipeline(LIMIT, filters.clinic ?? null, {
    modalityGroup: query.modalityGroup,
    priority: query.priority,
    statuses: query.status,
  });
  // Sans nombres : le flux ne compte pas au-delà de ce qu'il montre.
  const bar: BarDimension[] = [
    {
      key: "clinic",
      options: clinics.map((clinic) => ({
        value: clinic.id,
        label: clinic.name,
      })),
    },
    {
      key: "modality",
      options: MODALITY_GROUPS.map((value) => ({ value })),
    },
    { key: "state", options: STUDY_STATES.map((value) => ({ value })) },
    { key: "urgency" },
  ];

  return (
    <>
      <PageHeader
        title={t.nav.items.flow}
        description={text.description(studies.length)}
      />
      <FilterBar
        dimensions={bar}
        active={filters}
        result={{ count: studies.length, noun: "studies" }}
        className="shrink-0 px-4 pb-3 sm:px-6"
      />
      <ControlBody>
        {studies.length === 0 && hasFilters(filters) ? (
          <Section title={t.admin.shared.examinations}>
            <FilteredEmpty dimensions={bar} active={filters} />
          </Section>
        ) : studies.length === 0 ? (
          <Section title={t.admin.shared.examinations}>
            <EmptyState
              icon={Activity}
              title={text.emptyTitle}
              detail={text.emptyDetail}
            />
          </Section>
        ) : (
          <>
            <Summary studies={studies} t={t} locale={locale} />
            <Section
              title={t.admin.shared.examinations}
              description={t.admin.shared.mostRecentFirst}
              aside={<SegmentLegend locale={locale} />}
              flush
            >
              <FlowList studies={studies} locale={locale} />
            </Section>
          </>
        )}
      </ControlBody>
    </>
  );
}

/** Synthèse des examens affichés. */
function Summary({
  studies,
  t,
  locale,
}: {
  studies: PipelineStudy[];
  t: AppMessages;
  locale: Locale;
}) {
  const text = t.admin.flow;
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
      aria-label={t.admin.shared.summary}
      className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised sm:grid-cols-4"
    >
      <Figure
        label={text.medianThroughput}
        value={formatRate(quantile(rates, 0.5), locale)}
        hint={text.slowestTenth(formatRate(slowest, locale))}
        info={{ text: text.medianThroughputInfo }}
        tone={slowest !== null && slowest < 1 ? "progress" : undefined}
      />
      <Figure
        label={text.medianArrival}
        value={formatMinutes(quantile(arrivals, 0.5), locale)}
        hint={text.arrivalHint}
        info={{ text: t.admin.stages.info.arrival, term: "passerelle" }}
      />
      <Figure
        label={t.admin.shared.volumeReceived}
        value={formatBytes(bytes, locale)}
        hint={t.admin.shared.studyCount(
          studies.length,
          formatCount(studies.length, locale),
        )}
      />
      <Figure
        label={text.inQueue}
        value={formatCount(waiting, locale)}
        hint={text.inQueueHint}
        tone={waiting > 0 ? "progress" : "done"}
      />
    </section>
  );
}
