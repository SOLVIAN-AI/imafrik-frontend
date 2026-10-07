import { ArrowLeft, Check, Circle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ControlBody, Figure, Section } from "@/components/admin/control-ui";
import { FlowList, SegmentLegend } from "@/components/admin/flow-list";
import { RelativeTime } from "@/components/admin/relative-time";
import { Legend, Ring, StackedBars } from "@/components/charts/charts";
import { DateTime } from "@/components/domain/date-time";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  type OnboardingStep,
  getAnalytics,
  getClinic,
  getPipeline,
} from "@/lib/data/control";
import {
  formatBytes,
  formatCount,
  formatDayShort,
  formatMinutes,
  formatRate,
} from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Clinique" };

/**
 * Fiche d'une clinique : sa mise en service, puis son activité.
 *
 * La mise en service se lit comme une liste d'étapes datées — créée,
 * raccordée, équipe invitée, premier examen, premier compte-rendu, première
 * remise. Une clinique bloquée à « raccordée » depuis une semaine appelle
 * un coup de téléphone, pas une analyse.
 */
export default async function ClinicPage({
  params,
}: PageProps<"/admin/organisations/[id]">) {
  await requireSession(["platform_admin"]);
  const { id } = await params;
  const clinic = await getClinic(id);
  if (!clinic) notFound();

  const [analytics, recent] = await Promise.all([
    getAnalytics(30, clinic.id),
    getPipeline(15, clinic.id),
  ]);
  const activity = analytics.byClinic[0];
  const done = clinic.onboarding.filter((step) => step.done).length;

  return (
    <>
      <PageHeader
        title={clinic.name}
        description={[
          clinic.city,
          clinic.active ? "active" : "suspendue",
          clinic.openToPool ? "ouverte au pool" : "radiologues attitrés",
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/organisations">
                <ArrowLeft aria-hidden />
                Organisations
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/admin/activite?clinique=${clinic.id}`}>
                Activité détaillée
              </Link>
            </Button>
          </>
        }
      />

      <ControlBody>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Section
            title="Mise en service"
            description={`${done} étape${done > 1 ? "s" : ""} sur ${clinic.onboarding.length}`}
          >
            <Onboarding steps={clinic.onboarding} />
          </Section>

          <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
            <section
              aria-label="Synthèse sur trente jours"
              className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised sm:grid-cols-4"
            >
              <Figure
                label="Reçus · 30 jours"
                // Même période que l'histogramme voisin : trente jours
                // calendaires. Le compteur glissant de la fiche
                // (`received30d`) en différerait de quelques examens.
                value={formatCount(analytics.totals.received)}
                hint={
                  clinic.lastReceivedAt ? (
                    <RelativeTime
                      date={clinic.lastReceivedAt}
                      staleAfterHours={24}
                    />
                  ) : (
                    "aucun examen reçu"
                  )
                }
              />
              <Figure
                label="Délai médian"
                value={formatMinutes(activity?.medianMinutes ?? null)}
                hint="réception → signature"
              />
              <Figure
                label="Débit de réception"
                value={formatRate(activity?.medianMbPerSecond ?? null)}
                hint="médiane par examen"
                tone={
                  activity?.medianMbPerSecond != null &&
                  activity.medianMbPerSecond < 1.5
                    ? "progress"
                    : undefined
                }
              />
              <Figure
                label="Images reçues"
                value={formatBytes(activity?.bytes ?? 0)}
                hint="sur trente jours"
              />
            </section>

            <Section
              title="Examens reçus"
              description="Trente derniers jours"
              aside={<Legend series={SERIES} />}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <StackedBars
                    caption="Examens reçus par jour, sur trente jours"
                    height={150}
                    points={analytics.daily.map((day) => ({
                      label: formatDayShort(day.day),
                      values: [day.routine, day.urgent],
                    }))}
                    series={SERIES}
                  />
                </div>
                <Ring
                  value={analytics.sla.withinSla}
                  label="Rendus dans les délais"
                  size={80}
                />
              </div>
            </Section>
          </div>
        </div>

        <Section
          title="Derniers examens"
          description="Du scanner de la clinique au compte-rendu remis"
          aside={<SegmentLegend />}
          action={{
            label: "Tout le flux",
            href: `/admin/flux?clinique=${clinic.id}`,
          }}
          flush
        >
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-tertiary">
              Aucun examen reçu. Une fois la passerelle installée, l’examen de
              test du kit apparaît ici en moins d’une minute.
            </p>
          ) : (
            <FlowList studies={recent} />
          )}
        </Section>
      </ControlBody>
    </>
  );
}

const SERIES = [
  { label: "Routine", tone: "accent" as const },
  { label: "Urgence", tone: "urgent" as const },
];

/**
 * Étapes de mise en service, reliées par un trait.
 *
 * La première étape non franchie est mise en avant : c'est la seule qui
 * appelle une action.
 */
function Onboarding({ steps }: { steps: OnboardingStep[] }) {
  const next = steps.findIndex((step) => !step.done);
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const isNext = index === next;
        return (
          <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
            {index < steps.length - 1 && (
              <span
                className={cn(
                  "absolute top-6 bottom-0 left-[11px] w-px",
                  step.done ? "bg-done/50" : "bg-border-default",
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative flex size-6 shrink-0 items-center justify-center rounded-full border",
                step.done
                  ? "border-done/40 bg-done-muted text-done"
                  : isNext
                    ? "border-progress/50 bg-progress-muted text-progress"
                    : "border-border-default bg-surface-sunken text-tertiary",
              )}
              aria-hidden
            >
              {step.done ? (
                <Check className="size-3.5" />
              ) : (
                <Circle className="size-2 fill-current" />
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm",
                  step.done ? "" : isNext ? "font-medium" : "text-tertiary",
                )}
              >
                {step.label}
                <span className="sr-only">
                  {step.done
                    ? " : fait"
                    : isNext
                      ? " : prochaine étape"
                      : " : à venir"}
                </span>
              </p>
              <p className="text-2xs text-tertiary">
                {step.doneAt ? (
                  <DateTime date={step.doneAt} />
                ) : isNext ? (
                  "En attente"
                ) : (
                  "—"
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
