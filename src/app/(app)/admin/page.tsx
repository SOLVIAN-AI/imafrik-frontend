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
import type { Locale } from "@/lib/i18n/locale";
import { requireSession } from "@/lib/session/server";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.cockpit };
}

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
  const { t, locale } = await getMessages();
  const text = t.admin.cockpit;
  const overview = await getOverview();
  const { network } = overview;
  const series = volumeSeries(t);

  return (
    <>
      <PageHeader
        title={text.title}
        description={text.description}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/activite">
              {text.detailedAnalytics}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      />

      <ControlBody>
        <AlertList alerts={overview.alerts} locale={locale} />

        <MetricGrid metrics={liveMetrics(overview, t, locale)} />

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Section
            title={t.admin.shared.receivedStudies}
            description={text.receivedDescription}
            action={{ label: text.activity, href: "/admin/activite" }}
            className="lg:col-span-2"
          >
            <StackedBars
              caption={text.receivedCaption}
              locale={locale}
              points={overview.received14d.map((day) => ({
                label: formatDayShort(day.day, locale),
                values: [day.routine, day.urgent],
              }))}
              series={series}
            />
            <Legend series={series} className="mt-3" />
          </Section>

          <Section title={text.sla} description={text.slaDescription}>
            <div className="flex flex-col gap-5">
              <SlaRow
                label={t.admin.shared.urgentPlural}
                target={overview.targets.urgent}
                sla={overview.sla30d.urgent}
                t={t}
                locale={locale}
              />
              <SlaRow
                label={t.admin.shared.routine}
                target={overview.targets.routine}
                sla={overview.sla30d.routine}
                t={t}
                locale={locale}
              />
            </div>
          </Section>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Section title={text.network} flush>
            <ul className="divide-y divide-border-subtle">
              <NetworkRow
                icon={Building2}
                label={text.clinicsActive}
                value={network.clinicsActive}
                href="/admin/organisations"
              />
              <NetworkRow
                icon={Wifi}
                label={text.clinicsConnected}
                value={network.clinicsConnected}
                hint={text.outOf(network.clinicsActive)}
                warn={network.clinicsConnected < network.clinicsActive}
                href="/admin/organisations"
              />
              <NetworkRow
                icon={Stethoscope}
                label={text.radiologistsActive}
                value={network.radiologistsActive}
                href="/admin/utilisateurs"
              />
              <NetworkRow
                icon={Inbox}
                label={text.newRequests}
                value={network.newRequests}
                warn={network.newRequests > 0}
                href="/admin/demandes"
              />
            </ul>
          </Section>

          <Section
            title={text.operations}
            description={text.operationsDescription}
            action={{ label: text.system, href: "/admin/systeme" }}
            flush
            className="lg:col-span-2"
          >
            <OpsList runs={overview.ops} locale={locale} dense />
          </Section>
        </div>

        <p className="text-center text-2xs text-tertiary">
          {text.computedBefore} <DateTime date={overview.generatedAt} />{" "}
          {text.computedAfter}
        </p>
      </ControlBody>
    </>
  );
}

/** Séries de l'histogramme des volumes, de bas en haut. */
const volumeSeries = (t: AppMessages) => [
  { label: t.admin.shared.routine, tone: "accent" as const },
  { label: t.admin.shared.urgent, tone: "urgent" as const },
];

/**
 * Bandeau du direct : ce qui attend, ce qui avance, ce qui sort.
 *
 * @param overview État de la plateforme.
 * @param t        Textes de l'application.
 * @param locale   Langue de l'utilisateur.
 */
function liveMetrics(
  { live }: ControlOverview,
  t: AppMessages,
  locale: Locale,
): Metric[] {
  const text = t.admin.cockpit;
  const overdue = live.urgentOverdue + live.routineOverdue;
  return [
    {
      label: text.waiting,
      value: formatCount(live.waiting, locale),
      hint:
        live.oldestWaitingMinutes !== null
          ? text.waitingHint(
              live.urgentWaiting,
              formatDuration(live.oldestWaitingMinutes, locale),
            )
          : text.emptyQueue,
      icon: METRIC_ICONS.inbox,
      tone: live.urgentWaiting > 0 ? "urgent" : "neutral",
    },
    {
      label: text.overdue,
      value: formatCount(overdue, locale),
      hint: text.overdueHint(live.urgentOverdue, live.routineOverdue),
      icon: METRIC_ICONS.urgent,
      tone:
        live.urgentOverdue > 0 ? "urgent" : overdue > 0 ? "progress" : "done",
    },
    {
      label: text.inProgress,
      value: formatCount(live.inProgress, locale),
      hint: text.inProgressHint,
      icon: METRIC_ICONS.writing,
      tone: "progress",
    },
    {
      label: text.signedToday,
      value: formatCount(live.signedToday, locale),
      hint: text.signedTodayHint(live.receivedToday, live.deliveredToday),
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
  t,
  locale,
}: {
  label: string;
  target: number;
  sla: PrioritySla;
  t: AppMessages;
  locale: Locale;
}) {
  const text = t.admin.cockpit;
  return (
    <div className="flex items-center gap-4">
      <Ring
        value={sla.withinSla}
        label={text.slaRing(label)}
        locale={locale}
        size={72}
        showLabel={false}
      />
      <dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="col-span-2 font-medium">
          {label}{" "}
          <span className="font-normal text-tertiary">
            {text.promised(formatDuration(target, locale))}
          </span>
        </dt>
        <dt className="text-tertiary">{text.median}</dt>
        <dd className="text-right tabular-nums">
          {formatMinutes(sla.medianMinutes, locale)}
        </dd>
        <dt className="text-tertiary">{text.p90}</dt>
        <dd className="text-right tabular-nums">
          {formatMinutes(sla.p90Minutes, locale)}
        </dd>
        <dt className="text-tertiary">{text.signed}</dt>
        <dd className="text-right tabular-nums">
          {formatCount(sla.signed, locale)}
        </dd>
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
