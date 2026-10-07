import { ArrowRight, Building2, Inbox, Stethoscope, Wifi } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  AlertList,
  ControlBody,
  OpsList,
  Section,
} from "@/components/admin/control-ui";
import { Legend, Ring, StackedBars } from "@/components/charts/charts";
import { DateTime } from "@/components/domain/date-time";
import {
  METRIC_ICONS,
  type Metric,
  MetricGrid,
} from "@/components/domain/metrics";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  type ControlOverview,
  type PrioritySla,
  getOverview,
} from "@/lib/data/control";
import {
  formatCount,
  formatDayShort,
  formatDuration,
  formatMinutes,
} from "@/lib/format";
import { requireSession } from "@/lib/session/server";

export const metadata: Metadata = { title: "Cockpit" };

/**
 * Cockpit de la tour de contrôle.
 *
 * Il répond, dans l'ordre où on se les pose en arrivant, à trois
 * questions : **y a-t-il quelque chose à faire maintenant** (alertes),
 * **la plateforme tient-elle ses promesses** (files, délais), **le
 * socle tient-il** (réseau, exploitation). Le détail vit dans les écrans
 * dédiés ; chaque bloc y mène.
 */
export default async function CockpitPage() {
  await requireSession(["platform_admin"]);
  const overview = await getOverview();
  const { network } = overview;

  return (
    <>
      <PageHeader
        title="Tour de contrôle"
        description="État de la plateforme à l’instant — files, délais, réseau, exploitation."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/activite">
              Analyses détaillées
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />

      <ControlBody>
        <AlertList alerts={overview.alerts} />

        <MetricGrid metrics={liveMetrics(overview)} />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Section
            title="Examens reçus"
            description="Quatorze derniers jours, par priorité"
            action={{ label: "Activité", href: "/admin/activite" }}
            className="lg:col-span-2"
          >
            <StackedBars
              caption="Examens reçus par jour, sur quatorze jours"
              points={overview.received14d.map((day) => ({
                label: formatDayShort(day.day),
                values: [day.routine, day.urgent],
              }))}
              series={SERIES}
            />
            <Legend series={SERIES} className="mt-3" />
          </Section>

          <Section
            title="Délais promis"
            description="Examens signés sur trente jours"
          >
            <div className="flex flex-col gap-5">
              <SlaRow
                label="Urgences"
                target={overview.targets.urgent}
                sla={overview.sla30d.urgent}
              />
              <SlaRow
                label="Routine"
                target={overview.targets.routine}
                sla={overview.sla30d.routine}
              />
            </div>
          </Section>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Section title="Réseau" flush>
            <ul className="divide-y divide-border-subtle">
              <NetworkRow
                icon={Building2}
                label="Cliniques actives"
                value={network.clinicsActive}
                href="/admin/organisations"
              />
              <NetworkRow
                icon={Wifi}
                label="Passerelles raccordées"
                value={network.clinicsConnected}
                hint={`sur ${network.clinicsActive}`}
                warn={network.clinicsConnected < network.clinicsActive}
                href="/admin/organisations"
              />
              <NetworkRow
                icon={Stethoscope}
                label="Radiologues actifs"
                value={network.radiologistsActive}
                href="/admin/utilisateurs"
              />
              <NetworkRow
                icon={Inbox}
                label="Demandes à traiter"
                value={network.newRequests}
                warn={network.newRequests > 0}
                href="/admin/demandes"
              />
            </ul>
          </Section>

          <Section
            title="Exploitation"
            description="Dernière exécution de chaque tâche"
            action={{ label: "Système", href: "/admin/systeme" }}
            flush
            className="lg:col-span-2"
          >
            <OpsList runs={overview.ops} dense />
          </Section>
        </div>

        <p className="text-center text-2xs text-tertiary">
          Calculé le <DateTime date={overview.generatedAt} /> (UTC) · rechargez
          la page pour actualiser.
        </p>
      </ControlBody>
    </>
  );
}

const SERIES = [
  { label: "Routine", tone: "accent" as const },
  { label: "Urgence", tone: "urgent" as const },
];

/** Bandeau du direct : ce qui attend, ce qui avance, ce qui sort. */
function liveMetrics({ live }: ControlOverview): Metric[] {
  const overdue = live.urgentOverdue + live.routineOverdue;
  return [
    {
      label: "En attente de lecture",
      value: formatCount(live.waiting),
      hint:
        live.oldestWaitingMinutes !== null
          ? `dont ${live.urgentWaiting} urgence${live.urgentWaiting > 1 ? "s" : ""} · plus ancien ${formatDuration(live.oldestWaitingMinutes)}`
          : "file vide",
      icon: METRIC_ICONS.inbox,
      tone: live.urgentWaiting > 0 ? "urgent" : "neutral",
    },
    {
      label: "Hors délai",
      value: formatCount(overdue),
      hint: `${live.urgentOverdue} urgence${live.urgentOverdue > 1 ? "s" : ""} · ${live.routineOverdue} routine`,
      icon: METRIC_ICONS.urgent,
      tone:
        live.urgentOverdue > 0 ? "urgent" : overdue > 0 ? "progress" : "done",
    },
    {
      label: "En cours de lecture",
      value: formatCount(live.inProgress),
      hint: "pas encore signés",
      icon: METRIC_ICONS.writing,
      tone: "progress",
    },
    {
      label: "Signés aujourd’hui",
      value: formatCount(live.signedToday),
      hint: `${live.receivedToday} reçus · ${live.deliveredToday} remis`,
      icon: METRIC_ICONS.done,
      tone: "done",
    },
  ];
}

/** Respect du délai pour une priorité : anneau, médiane, 90e centile. */
function SlaRow({
  label,
  target,
  sla,
}: {
  label: string;
  target: number;
  sla: PrioritySla;
}) {
  return (
    <div className="flex items-center gap-4">
      <Ring
        value={sla.withinSla}
        label={`${label} : part rendue dans le délai`}
        size={72}
        showLabel={false}
      />
      <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="col-span-2 font-medium">
          {label}{" "}
          <span className="font-normal text-tertiary">
            · promis en {formatDuration(target)}
          </span>
        </dt>
        <dt className="text-tertiary">Médiane</dt>
        <dd className="text-right tabular-nums">
          {formatMinutes(sla.medianMinutes)}
        </dd>
        <dt className="text-tertiary">9 sur 10 sous</dt>
        <dd className="text-right tabular-nums">
          {formatMinutes(sla.p90Minutes)}
        </dd>
        <dt className="text-tertiary">Signés</dt>
        <dd className="text-right tabular-nums">{formatCount(sla.signed)}</dd>
      </dl>
    </div>
  );
}

/** Une ligne du bloc réseau, qui mène à l'écran correspondant. */
function NetworkRow({
  icon: Icon,
  label,
  value,
  hint,
  warn = false,
  href,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  hint?: string;
  warn?: boolean;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Icon className="size-4 shrink-0 text-tertiary" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-xs text-secondary">
          {label}
        </span>
        <span
          className={
            warn
              ? "text-sm font-semibold text-progress tabular-nums"
              : "text-sm font-semibold tabular-nums"
          }
        >
          {value}
          {hint && (
            <span className="ml-1 text-2xs font-normal text-tertiary">
              {hint}
            </span>
          )}
        </span>
        <ArrowRight
          className="size-3 shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </li>
  );
}
