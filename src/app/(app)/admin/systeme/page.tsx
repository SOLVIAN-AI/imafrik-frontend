import { CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";

import {
  ControlBody,
  Figure,
  OPS_FRESHNESS,
  OPS_LABELS,
  OpsList,
  Section,
} from "@/components/admin/control-ui";
import { RelativeTime } from "@/components/admin/relative-time";
import { PageHeader } from "@/components/layout/app-shell";
import { type OpsKind, type OpsRun, getSystem } from "@/lib/data/control";
import { MISSING, formatBytes, formatCount } from "@/lib/format";
import { requireSession } from "@/lib/session/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Système" };

/** Ordre d'affichage des tâches : de la plus grave à perdre à la plus fréquente. */
const OPS_ORDER: OpsKind[] = [
  "backup",
  "restore_drill",
  "reconciliation",
  "host_watch",
];

/** Ce que garantit chaque tâche, en une phrase. */
const OPS_PURPOSE: Record<OpsKind, string> = {
  backup:
    "Copie chiffrée (age) de la base et de l’index du PACS vers R2, chaque nuit.",
  restore_drill:
    "Restauration réelle de la dernière sauvegarde dans une base jetable, chaque semaine : une sauvegarde jamais restaurée n’en est pas une.",
  reconciliation:
    "Rattrape les examens que le PACS a reçus sans que l’application en soit prévenue.",
  host_watch:
    "Disque, conteneurs, certificats HTTPS et DICOM du serveur central.",
};

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
  const system = await getSystem();
  const latest = latestByKind(system.ops);
  const allOk = system.services.every((service) => service.ok);

  return (
    <>
      <PageHeader
        title="Système"
        description={`Environnement ${system.environment} · version ${system.release ?? "inconnue"}`}
      />
      <ControlBody>
        <section
          aria-label="Synthèse"
          className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-raised sm:grid-cols-4"
        >
          <Figure
            label="Services"
            value={allOk ? "Opérationnels" : "Dégradés"}
            tone={allOk ? "done" : "urgent"}
            hint={`${system.services.filter((s) => s.ok).length} sur ${system.services.length} répondent`}
          />
          <Figure
            label="PACS central"
            value={
              system.orthancVersion
                ? `Orthanc ${system.orthancVersion}`
                : MISSING
            }
            hint="version du moteur"
          />
          <Figure
            label="Examens conservés"
            value={
              system.storedStudies === null
                ? MISSING
                : formatCount(system.storedStudies)
            }
            hint="dans le PACS"
          />
          <Figure
            label="Volume d’images"
            value={
              system.storedMegabytes === null
                ? MISSING
                : formatBytes(system.storedMegabytes * 1_048_576)
            }
            hint="sur le disque du PACS"
          />
        </section>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <Section title="Dépendances" flush>
            <ul className="divide-y divide-border-subtle">
              {system.services.map((service) => (
                <li
                  key={service.name}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {service.ok ? (
                    <CheckCircle2
                      className="size-4 shrink-0 text-done"
                      aria-label="Répond"
                    />
                  ) : (
                    <XCircle
                      className="size-4 shrink-0 text-urgent"
                      aria-label="Ne répond pas"
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
            title="Filets de sécurité"
            description="Dernière exécution de chaque tâche planifiée"
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
                        <span className="font-medium">{OPS_LABELS[kind]}</span>
                        <span className="text-2xs text-tertiary">
                          {run ? (
                            <RelativeTime
                              date={run.finishedAt}
                              staleAfterHours={OPS_FRESHNESS[kind]}
                            />
                          ) : (
                            "jamais exécutée"
                          )}
                        </span>
                      </p>
                      <p className="mt-0.5 text-2xs text-tertiary">
                        {OPS_PURPOSE[kind]}
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
          title="Historique d’exploitation"
          description="Exécutions récentes, toutes tâches confondues"
          flush
        >
          <OpsList runs={system.recentRuns} />
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
