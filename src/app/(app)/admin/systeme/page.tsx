import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";

import {
  ControlBody,
  Figure,
  OPS_FRESHNESS,
  OpsList,
  Section,
} from "@/components/admin/control-ui";
import { RelativeTime } from "@/components/admin/relative-time";
import { PageHeader } from "@/components/layout/app-shell";
import { type OpsKind, type OpsRun, getSystem } from "@/lib/data/control";
import { MISSING, formatBytes, formatCount } from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";
import { getMessages } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages()).t.nav.items.system };
}

/** Ordre d'affichage des tâches : de la plus grave à perdre à la plus fréquente. */
const OPS_ORDER: OpsKind[] = [
  "backup",
  "restore_drill",
  "reconciliation",
  "retention",
  "host_watch",
];

/**
 * État technique de la plateforme.
 *
 * Les dépendances répondent-elles, quelle version tourne, combien
 * d'images le PACS conserve, et surtout : **les filets de sécurité
 * fonctionnent-ils** — sauvegardes, exercices de restauration,
 * réconciliation, surveillance. Une sauvegarde silencieusement en échec
 * depuis trois semaines est le genre de panne qu'on découvre le jour où
 * on en a besoin.
 */
export default async function SystemPage() {
  await requireSession(["platform_admin"]);
  const { t, locale } = await getMessages();
  const text = t.admin.system;
  const ops = t.admin.ops;
  const system = await getSystem();
  const latest = latestByKind(system.ops);
  const allOk = system.services.every((service) => service.ok);

  return (
    <>
      <PageHeader
        title={t.nav.items.system}
        description={text.description(system.environment, system.release)}
      />
      <ControlBody>
        <section
          aria-label={t.admin.shared.summary}
          className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised sm:grid-cols-4"
        >
          <Figure
            label={text.services}
            value={allOk ? text.operational : text.degraded}
            tone={allOk ? "done" : "urgent"}
            hint={text.responding(
              system.services.filter((s) => s.ok).length,
              system.services.length,
            )}
          />
          <Figure
            label={text.pacs}
            value={
              system.orthancVersion
                ? `Orthanc ${system.orthancVersion}`
                : MISSING
            }
            hint={text.engineVersion}
          />
          <Figure
            label={text.storedStudies}
            value={
              system.storedStudies === null
                ? MISSING
                : formatCount(system.storedStudies, locale)
            }
            hint={text.inPacs}
          />
          <Figure
            label={text.imageVolume}
            value={
              system.storedMegabytes === null
                ? MISSING
                : formatBytes(system.storedMegabytes * 1_048_576, locale)
            }
            hint={text.onPacsDisk}
          />
        </section>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <Section title={text.dependencies} flush>
            <ul className="divide-y divide-border-subtle">
              {system.services.map((service) => (
                <li
                  key={service.name}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {service.ok ? (
                    <CheckCircle2
                      className="size-4 shrink-0 text-done"
                      aria-label={text.up}
                    />
                  ) : (
                    <XCircle
                      className="size-4 shrink-0 text-urgent"
                      aria-label={text.down}
                    />
                  )}
                  <span className="text-sm font-medium">{service.name}</span>
                  {service.detail && (
                    <span
                      className={cn(
                        "ml-auto min-w-0 truncate text-right text-2xs",
                        service.ok ? "text-tertiary" : "text-urgent",
                      )}
                      title={service.detail}
                    >
                      {service.detail}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Section>

          <Section
            title={text.safetyNets}
            description={text.safetyNetsDescription}
            flush
          >
            <ul className="divide-y divide-border-subtle">
              {OPS_ORDER.map((kind) => {
                const run = latest.get(kind);
                const healthy =
                  run !== undefined &&
                  run.ok &&
                  system.checkedAt.getTime() - run.finishedAt.getTime() <=
                    OPS_FRESHNESS[kind] * 3_600_000;
                return (
                  <li key={kind} className="flex gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        run === undefined
                          ? "bg-tertiary"
                          : healthy
                            ? "bg-done"
                            : "bg-urgent",
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                        <span className="font-medium">{ops.labels[kind]}</span>
                        <span className="text-2xs text-tertiary">
                          {run ? (
                            <RelativeTime
                              date={run.finishedAt}
                              staleAfterHours={OPS_FRESHNESS[kind]}
                            />
                          ) : (
                            ops.neverRun
                          )}
                        </span>
                      </p>
                      <p className="mt-0.5 text-2xs text-tertiary">
                        {ops.purpose[kind]}
                      </p>
                      {run?.summary && (
                        <p
                          className={cn(
                            "mt-1 text-2xs",
                            run.ok ? "text-secondary" : "text-urgent",
                          )}
                        >
                          {run.summary}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>
        </div>

        <Section
          title={text.history}
          description={text.historyDescription}
          flush
        >
          <OpsList runs={system.recentRuns} locale={locale} />
        </Section>
      </ControlBody>
    </>
  );
}

/**
 * Dernière exécution de chaque tâche ; pour une même tâche sur plusieurs
 * cibles, un échec l'emporte sur un succès — même règle que les alertes
 * du service.
 */
function latestByKind(runs: OpsRun[]): Map<OpsKind, OpsRun> {
  const latest = new Map<OpsKind, OpsRun>();
  for (const run of runs) {
    const current = latest.get(run.kind);
    if (
      !current ||
      (!run.ok && current.ok) ||
      (run.ok === current.ok && run.finishedAt > current.finishedAt)
    ) {
      latest.set(run.kind, run);
    }
  }
  return latest;
}
