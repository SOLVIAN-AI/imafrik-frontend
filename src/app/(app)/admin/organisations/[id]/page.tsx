import { ArrowLeft, Ban, Check, Circle, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ClinicLogoForm } from "@/components/admin/clinic-logo-form";
import { ContractPanel } from "@/components/admin/contract-panel";
import { ControlBody, Figure, Section } from "@/components/admin/control-ui";
import { FlowList, SegmentLegend } from "@/components/admin/flow-list";
import { EnrollmentPanel } from "@/components/admin/gateways/enrollment-panel";
import { GatewayList } from "@/components/admin/gateways/gateway-list";
import { PlanForm } from "@/components/admin/plan-form";
import { RelativeTime } from "@/components/admin/relative-time";
import { ReportLanguageForm } from "@/components/admin/report-language-form";
import { RetentionForm } from "@/components/admin/retention-form";
import { UrgentReadersForm } from "@/components/admin/urgent-readers-form";
import { AssignmentRulesForm } from "@/components/domain/assignment-rules-form";
import { Legend, Ring, StackedBars } from "@/components/charts/charts";
import { DateTime } from "@/components/domain/date-time";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  type OnboardingStep,
  getAnalytics,
  getClinic,
  getClinicLogo,
  getPipeline,
} from "@/lib/data/control";
import {
  formatBytes,
  formatCount,
  formatDate,
  formatDayShort,
  formatMinutes,
  formatRate,
} from "@/lib/format";
import { getAssignmentRules } from "@/lib/actions/assignment-rules";
import { getUrgentReaders } from "@/lib/actions/urgent-readers";
import { clinicViewPath } from "@/lib/clinic-view";
import { getClinicPlan } from "@/lib/data/activity";
import { getClinicGateways, getEnrollmentCodes } from "@/lib/data/gateways";
import { LOCALE_NAMES } from "@/lib/i18n/locale";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";
import { getMessages } from "@/i18n/server";
import type { AppMessages } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.admin.clinic.metaTitle };
}

/**
 * Fiche d'une clinique : sa mise en service, puis son activité.
 *
 * La mise en service se lit comme une liste d'étapes datées — créée,
 * raccordée, équipe invitée, premier examen, premier compte-rendu, première
 * remise. Une clinique bloquée à « raccordée » depuis une semaine appelle
 * un coup de téléphone, pas une analyse.
 *
 * Viennent ensuite ses passerelles : le code qui en raccorde une, et la
 * liste de celles qui existent, avec leurs gestes (approuver, suspendre,
 * révoquer…).
 *
 * Suivent les deux réglages que le contrat fixe : la durée de
 * conservation des images et la langue des comptes-rendus. En bas de
 * fiche, l'état du contrat et, dans une zone de danger, le geste qui y
 * met fin.
 *
 * **Contrat terminé**, la fiche passe en lecture seule : un bandeau le
 * dit en tête, les réglages ne sont plus modifiables, et seul demeure le
 * rappel de l'export à remettre. L'activité passée reste consultable.
 */
export default async function ClinicPage({
  params,
}: PageProps<"/admin/organisations/[id]">) {
  await requireSession(["platform_admin"]);
  const { t, locale } = await getMessages();
  const text = t.admin.clinic;
  const shared = t.admin.shared;
  const series = volumeSeries(t);
  const { id } = await params;
  const clinic = await getClinic(id);
  if (!clinic) notFound();

  const [analytics, recent, logo, gateways, codes, urgentReaders, rules, plan] =
    await Promise.all([
      getAnalytics(30, clinic.id),
      getPipeline(15, clinic.id),
      getClinicLogo(clinic.id),
      getClinicGateways(clinic.id),
      getEnrollmentCodes(clinic.id),
      getUrgentReaders(clinic.id),
      getAssignmentRules(clinic.id),
      getClinicPlan(clinic.id),
    ]);
  const activity = analytics.byClinic[0];
  const done = clinic.onboarding.filter((step) => step.done).length;
  const ended = clinic.contractEndedAt !== null;

  return (
    <>
      <PageHeader
        title={clinic.name}
        description={[
          clinic.city,
          ended
            ? text.contractEnded
            : clinic.active
              ? text.active
              : text.suspended,
          ended
            ? null
            : clinic.openToPool
              ? text.openToPool
              : text.ownRadiologists,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/organisations">
                <ArrowLeft aria-hidden />
                {text.backToOrganisations}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/admin/activite?clinique=${clinic.id}`}>
                {text.detailedActivity}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={`/admin/examens?clinique=${clinic.id}`}>
                {text.clinicStudies}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link
                href={`/admin/activite?onglet=radiologues&clinique=${clinic.id}`}
              >
                {text.radiologistPerformance}
              </Link>
            </Button>
            {/* Les écrans de son responsable, tels qu'il les voit. Jamais
                préchargés : ouvrir la vue se trace au journal. */}
            <Button asChild variant="secondary" size="sm">
              <Link href={clinicViewPath(clinic.id)} prefetch={false}>
                <Eye aria-hidden />
                {t.clinicView.chooser.title}
              </Link>
            </Button>
          </>
        }
      />

      <ControlBody>
        {clinic.contractEndedAt && (
          <div
            role="status"
            className="flex gap-3 rounded-xl border border-urgent/40 bg-urgent-muted px-4 py-3"
          >
            <Ban className="mt-0.5 size-4 shrink-0 text-urgent" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {t.admin.contract.endedOnBefore}
                <DateTime date={clinic.contractEndedAt} withTime={false} />
                {t.admin.contract.endedOnAfter}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-secondary">
                {t.admin.contract.endedDetail}
              </p>
            </div>
          </div>
        )}

        {/* Mise en service à gauche, chiffres et volumes à droite : deux
            blocs de même hauteur. Les réglages du contrat suivent, côte à
            côte. Empilés sous la mise en service, ils laissaient un grand
            vide sous l'histogramme. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Section
            title={text.onboarding}
            description={text.stepsDone(done, clinic.onboarding.length)}
          >
            <Onboarding steps={clinic.onboarding} t={t} />
          </Section>

          <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
            <section
              aria-label={text.summary}
              className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised sm:grid-cols-4"
            >
              <Figure
                label={text.received30d}
                // Même période que l'histogramme voisin : trente jours
                // calendaires. Le compteur glissant de la fiche
                // (`received30d`) en différerait de quelques examens.
                value={formatCount(analytics.totals.received, locale)}
                hint={
                  clinic.lastReceivedAt ? (
                    <RelativeTime
                      date={clinic.lastReceivedAt}
                      staleAfterHours={24}
                    />
                  ) : (
                    text.noStudyReceived
                  )
                }
              />
              <Figure
                label={shared.medianTurnaround}
                value={formatMinutes(activity?.medianMinutes ?? null, locale)}
                hint={text.receiptToSignature}
              />
              <Figure
                label={text.throughput}
                value={formatRate(activity?.medianMbPerSecond ?? null, locale)}
                hint={text.throughputHint}
                tone={
                  activity?.medianMbPerSecond != null &&
                  activity.medianMbPerSecond < 1.5
                    ? "progress"
                    : undefined
                }
              />
              <Figure
                label={shared.imagesReceived}
                value={formatBytes(activity?.bytes ?? 0, locale)}
                hint={text.overThirtyDays}
              />
            </section>

            <Section
              title={shared.receivedStudies}
              description={text.lastThirtyDays}
              aside={<Legend series={series} />}
              className="flex-1"
            >
              <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <StackedBars
                    caption={text.receivedCaption}
                    locale={locale}
                    height={150}
                    points={analytics.daily.map((day) => ({
                      label: formatDayShort(day.day, locale),
                      values: [day.routine, day.urgent],
                    }))}
                    series={series}
                  />
                </div>
                <Ring
                  value={analytics.sla.withinSla}
                  label={text.withinSla}
                  locale={locale}
                  size={80}
                />
              </div>
            </Section>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Section
            title={t.gateways.code.title}
            description={t.gateways.sectionDescription}
          >
            <EnrollmentPanel
              clinicId={clinic.id}
              codes={codes.map((code) => ({
                id: code.id,
                expiresAt: code.expiresAt.toISOString(),
                attempts: code.attempts,
                createdBy: code.createdBy,
              }))}
              blockedBy={
                ended
                  ? t.gateways.code.closedContract
                  : clinic.active
                    ? null
                    : t.gateways.code.suspendedClinic
              }
            />
          </Section>
          <Section
            title={t.gateways.section}
            description={t.gateways.count(gateways.length)}
            action={{
              label: t.gateways.seeAll,
              href: "/admin/passerelles",
            }}
            className="xl:col-span-2"
            flush
          >
            {gateways.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-tertiary">
                {t.gateways.emptyForClinic}
              </p>
            ) : (
              <GatewayList gateways={gateways} t={t} showClinic={false} />
            )}
          </Section>
        </div>

        <Section
          id="liste-urgence"
          title={t.assignment.urgentReaders.title}
          description={t.assignment.urgentReaders.description}
        >
          {urgentReaders.ok ? (
            <UrgentReadersForm
              clinicId={clinic.id}
              readers={urgentReaders.data}
              readOnly={ended}
            />
          ) : (
            <p role="alert" className="text-xs text-urgent">
              {urgentReaders.error}
            </p>
          )}
        </Section>

        <Section
          title={t.assignment.rules.title}
          description={t.assignment.rules.adminDescription}
        >
          {rules.ok ? (
            <AssignmentRulesForm
              key={rules.data.version}
              clinicId={clinic.id}
              rules={rules.data}
              readOnly={ended}
            />
          ) : (
            <p role="alert" className="text-xs text-urgent">
              {rules.error}
            </p>
          )}
        </Section>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section
            id="abonnement"
            title={t.admin.plan.title}
            description={
              plan
                ? t.admin.plan.perMonth(formatCount(plan.monthlyFee, locale))
                : t.admin.plan.none
            }
          >
            {ended ? (
              <ReadOnly text={t.admin.contract.readOnly} />
            ) : (
              <PlanForm
                clinicId={clinic.id}
                plan={plan?.plan ?? null}
                fee={plan?.monthlyFee ?? null}
              />
            )}
          </Section>
          <Section
            title={text.retention}
            description={
              clinic.imageRetentionDays === null
                ? text.noLimit
                : text.retentionDays(clinic.imageRetentionDays)
            }
          >
            {ended ? (
              <ReadOnly text={t.admin.contract.readOnly} />
            ) : (
              <RetentionForm
                clinicId={clinic.id}
                clinicName={clinic.name}
                days={clinic.imageRetentionDays}
                purged={clinic.imagesPurged}
              />
            )}
          </Section>
          <Section
            title={t.admin.reportLanguage.title}
            description={LOCALE_NAMES[clinic.reportLanguage]}
          >
            {ended ? (
              <ReadOnly text={t.admin.contract.readOnly} />
            ) : (
              <ReportLanguageForm
                clinicId={clinic.id}
                language={clinic.reportLanguage}
              />
            )}
          </Section>
          <Section
            title={t.admin.clinicLogo.title}
            description={
              clinic.logoUpdatedAt
                ? `${t.admin.clinicLogo.since} ${formatDate(clinic.logoUpdatedAt, locale)}`
                : t.admin.clinicLogo.none
            }
          >
            {ended ? (
              <ReadOnly text={t.admin.contract.readOnly} />
            ) : (
              <ClinicLogoForm clinicId={clinic.id} logo={logo} />
            )}
          </Section>
        </div>

        <Section
          title={text.recent}
          description={text.recentDescription}
          aside={<SegmentLegend locale={locale} />}
          action={{
            label: text.fullFlow,
            href: `/admin/flux?clinique=${clinic.id}`,
          }}
          flush
        >
          {recent.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-tertiary">
              {text.noRecent}
            </p>
          ) : (
            <FlowList studies={recent} locale={locale} />
          )}
        </Section>

        <Section
          title={t.admin.contract.title}
          description={
            ended ? text.contractEnded : t.admin.contract.underContract
          }
        >
          <ContractPanel
            clinicId={clinic.id}
            clinicName={clinic.name}
            endedAt={clinic.contractEndedAt?.toISOString() ?? null}
          />
        </Section>
      </ControlBody>
    </>
  );
}

/** Réglage figé par la fin du contrat : la valeur reste dans l'en-tête de section. */
function ReadOnly({ text }: { text: string }) {
  return <p className="text-xs leading-relaxed text-tertiary">{text}</p>;
}

/** Séries de l'histogramme des volumes, de bas en haut. */
const volumeSeries = (t: AppMessages) => [
  { label: t.admin.shared.routine, tone: "accent" as const },
  { label: t.admin.shared.urgent, tone: "urgent" as const },
];

/**
 * Étapes de mise en service, reliées par un trait.
 *
 * La première étape non franchie est mise en avant : c'est la seule qui
 * appelle une action. Chaque étape est nommée par sa clé, dans la langue
 * de l'utilisateur.
 */
function Onboarding({ steps, t }: { steps: OnboardingStep[]; t: AppMessages }) {
  const text = t.admin.clinic;
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
                {text.steps[step.key]}
                <span className="sr-only">
                  {step.done
                    ? text.stepDone
                    : isNext
                      ? text.stepNext
                      : text.stepUpcoming}
                </span>
              </p>
              <p className="text-2xs text-tertiary">
                {step.doneAt ? (
                  <DateTime date={step.doneAt} />
                ) : isNext ? (
                  text.pending
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
