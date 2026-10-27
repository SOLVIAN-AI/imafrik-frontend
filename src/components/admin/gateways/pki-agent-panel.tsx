import Link from "next/link";

import { RelativeTime } from "@/components/admin/relative-time";
import { DateTime } from "@/components/domain/date-time";
import type { PkiAgent } from "@/lib/data/gateways";
import { groupCycles } from "@/lib/gateways";
import { cn } from "@/lib/utils";
import type { AppMessages } from "@/i18n";

/** Silence au-delà duquel la tâche d'hôte est signalée : celui du service. */
const SILENT_HOURS = 5 / 60;

/**
 * La tâche d'hôte qui applique la confiance au PACS : son dernier cycle,
 * ce qui attend d'être appliqué, et ses cycles marquants.
 *
 * L'alerte d'une tâche muette ou en échec vient du service (liste
 * d'alertes en tête de page) ; ce panneau donne le détail pour agir.
 *
 * @param agent État transmis par le service.
 * @param t     Textes.
 */
export function PkiAgentPanel({
  agent,
  t,
}: {
  agent: PkiAgent;
  t: AppMessages;
}) {
  const text = t.gateways.agent;
  const outcomeTone =
    agent.lastOutcome === "refused" || agent.lastOutcome === "failed"
      ? "text-urgent"
      : agent.lastOutcome === "deferred"
        ? "text-progress"
        : "text-done";

  return (
    <div className="flex flex-col gap-4 text-xs">
      {agent.lastReportAt ? (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
          <div>
            <dt className="text-2xs text-tertiary">{text.lastReport}</dt>
            <dd>
              <RelativeTime
                date={agent.lastReportAt}
                staleAfterHours={SILENT_HOURS}
              />
              {agent.lastOutcome && (
                <span className={cn("ml-2 font-medium", outcomeTone)}>
                  {text.outcome[agent.lastOutcome]}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-2xs text-tertiary">{text.lastRestart}</dt>
            <dd>
              {agent.lastRestartAt ? (
                <DateTime date={agent.lastRestartAt} />
              ) : (
                text.noRestart
              )}
            </dd>
          </div>
          {agent.lastError && (
            <div className="sm:col-span-3">
              <dt className="sr-only">{text.outcome.failed}</dt>
              <dd
                role="note"
                className="rounded-lg bg-urgent-muted px-3 py-2 font-mono text-2xs break-words text-urgent"
              >
                {agent.lastError}
              </dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="rounded-lg bg-progress-muted px-3 py-2.5 leading-relaxed text-progress">
          {text.never}
        </p>
      )}

      <div>
        <h3 className="text-2xs font-medium text-secondary">{text.pending}</h3>
        {agent.pending.length === 0 ? (
          <p className="mt-1 text-tertiary">{text.noPending}</p>
        ) : (
          <ul className="mt-1.5 flex flex-col gap-1">
            {agent.pending.map((change) => (
              <li
                key={`${change.gatewayId}-${change.change}`}
                className="flex flex-wrap items-baseline gap-x-2"
              >
                <Link
                  href={`/admin/passerelles/${change.gatewayId}`}
                  className="font-medium hover:text-accent hover:underline"
                >
                  {change.hostname}
                </Link>
                <span className="text-tertiary">{change.clinicName}</span>
                <span
                  className={cn(
                    "text-2xs",
                    change.change === "add" ? "text-done" : "text-urgent",
                  )}
                >
                  {text.change[change.change]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-2xs font-medium text-secondary">{text.cycles}</h3>
        {agent.cycles.length === 0 ? (
          <p className="mt-1 text-tertiary">{text.noCycles}</p>
        ) : (
          <ol className="mt-1.5 flex flex-col gap-1.5">
            {groupCycles(agent.cycles).map((cycle) => (
              <li
                key={cycle.reportedAt.toISOString()}
                className="flex flex-wrap items-baseline gap-x-2"
              >
                <DateTime
                  date={cycle.reportedAt}
                  className="text-2xs whitespace-nowrap text-tertiary tabular-nums"
                />
                <span
                  className={cn(
                    "font-medium",
                    cycle.outcome === "applied"
                      ? "text-done"
                      : cycle.outcome === "deferred"
                        ? "text-progress"
                        : "text-urgent",
                  )}
                >
                  {text.outcome[cycle.outcome]}
                </span>
                <span className="text-secondary">
                  {text.cycleSummary(cycle.added, cycle.removed)}
                </span>
                {cycle.restarted && (
                  <span className="text-2xs text-tertiary">
                    {text.restarted}
                  </span>
                )}
                {cycle.count > 1 && (
                  <span className="text-2xs text-tertiary">
                    {text.repeatedSince(cycle.count)}{" "}
                    <DateTime date={cycle.firstAt} className="tabular-nums" />
                  </span>
                )}
                {cycle.error && (
                  <span className="w-full font-mono text-2xs break-words text-urgent">
                    {cycle.error}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
