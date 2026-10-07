import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { RelativeTime } from "@/components/admin/relative-time";
import { Panel } from "@/components/layout/app-shell";
import { messagesFor } from "@/i18n";
import type { Alert, OpsKind, OpsRun } from "@/lib/data/control";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * Pièces communes aux écrans de la tour de contrôle.
 *
 * Une même grammaire partout : un panneau titré, une alerte au même
 * endroit avec la même couleur, une tâche d'exploitation lue de la même
 * façon sur le cockpit et sur l'écran système. Qui passe d'un écran à
 * l'autre n'a rien à réapprendre.
 *
 * Module partagé, sans `"use client"` : les pièces qui écrivent du texte
 * reçoivent la langue de l'utilisateur en propriété.
 */

/**
 * Panneau titré.
 *
 * @param title       Intitulé, en capitales discrètes.
 * @param description Précision sous le titre — période, unité, définition.
 * @param action      Lien vers l'écran détaillé.
 * @param aside       Contenu à droite du titre — légende, sélecteur.
 * @param flush       Sans marge intérieure : listes et tableaux bord à bord.
 */
export function Section({
  title,
  description,
  action,
  aside,
  flush = false,
  className,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  action?: { label: string; href: string };
  aside?: React.ReactNode;
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className={cn("flex min-w-0 flex-col overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border-subtle px-4 py-3">
        <div className="min-w-0">
          <h2 className="label-eyebrow">{title}</h2>
          {description && (
            <p className="mt-0.5 text-2xs text-tertiary">{description}</p>
          )}
        </div>
        {aside}
        {action && (
          <Link
            href={action.href}
            className="-my-1.5 flex items-center gap-1 py-1.5 text-2xs text-tertiary transition-colors hover:text-accent"
          >
            {action.label}
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        )}
      </div>
      <div className={cn("min-w-0 flex-1", !flush && "p-4")}>{children}</div>
    </Panel>
  );
}

/** Corps des écrans : défilement, marges, pile de panneaux. */
export function ControlBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-auto px-4 pb-8 sm:px-6",
        // Les panneaux gardent leur hauteur : c'est le corps qui défile.
        // Sans cela, un panneau à `overflow-hidden` se laisse écraser
        // jusqu'à zéro dès que la page dépasse la fenêtre.
        "[&>*]:shrink-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

const SEVERITY = {
  critical: {
    icon: AlertOctagon,
    row: "border-urgent/30 bg-urgent-muted",
    tint: "text-urgent",
  },
  warning: {
    icon: AlertTriangle,
    row: "border-progress/30 bg-progress-muted",
    tint: "text-progress",
  },
  info: {
    icon: Info,
    row: "border-accent/25 bg-accent-muted",
    tint: "text-accent",
  },
} as const;

/**
 * Alertes du cockpit, des plus graves aux moins graves.
 *
 * Chacune mène à l'écran où agir : une alerte qu'on ne peut pas suivre
 * d'un clic finit par ne plus être lue. Le message vient du service,
 * déjà rédigé dans la langue de l'utilisateur : il s'affiche tel quel.
 *
 * @param alerts Alertes à afficher.
 * @param locale Langue de l'utilisateur.
 */
export function AlertList({
  alerts,
  locale,
}: {
  alerts: Alert[];
  locale: Locale;
}) {
  const t = messagesFor(locale).admin.alerts;
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-done/25 bg-done-muted px-4 py-3">
        <CheckCircle2 className="size-4 shrink-0 text-done" aria-hidden />
        <p className="text-sm">{t.allClear}</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2" aria-label={t.label}>
      {alerts.map((alert) => {
        const style = SEVERITY[alert.severity];
        const Icon = style.icon;
        const content = (
          <>
            <Icon className={cn("size-4 shrink-0", style.tint)} aria-hidden />
            <span className="sr-only">
              {t.severityPrefix(t.severity[alert.severity])}
            </span>
            <span className="min-w-0 flex-1 text-sm">{alert.message}</span>
            {alert.href && (
              <ArrowRight
                className="size-3.5 shrink-0 text-tertiary transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            )}
          </>
        );
        const classes = cn(
          "group flex items-center gap-3 rounded-xl border px-4 py-2.5",
          style.row,
        );
        return (
          <li key={alert.code + alert.message}>
            {alert.href ? (
              <Link
                href={alert.href}
                className={cn(
                  classes,
                  "focus-visible:outline-2 focus-visible:outline-accent",
                )}
              >
                {content}
              </Link>
            ) : (
              <div className={classes}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Fraîcheur attendue de chaque tâche, en heures — au-delà, elle est en
 * retard même si sa dernière exécution a réussi. Mêmes seuils que les
 * alertes du service.
 */
export const OPS_FRESHNESS: Record<OpsKind, number> = {
  backup: 26,
  restore_drill: 24 * 8,
  reconciliation: 0.5,
  host_watch: 0.5,
  retention: 48,
};

/**
 * Tâches d'exploitation : état, ancienneté, résumé.
 *
 * Libellés et cibles viennent des textes de l'utilisateur ; le résumé,
 * rédigé par le service, s'affiche tel quel.
 *
 * @param runs   Exécutions à afficher.
 * @param locale Langue de l'utilisateur.
 * @param dense  Variante compacte, pour le cockpit.
 */
export function OpsList({
  runs,
  locale,
  dense = false,
}: {
  runs: OpsRun[];
  locale: Locale;
  dense?: boolean;
}) {
  const t = messagesFor(locale).admin.ops;
  if (runs.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-xs text-tertiary">
        {t.emptyBefore} <code className="font-mono">tools/install_ops.sh</code>
        {t.emptyAfter}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border-subtle">
      {runs.map((run, index) => (
        <li
          key={`${run.kind}-${run.target}-${run.finishedAt.toISOString()}-${index}`}
          className={cn(
            "flex items-start gap-3 px-4",
            dense ? "py-2.5" : "py-3",
          )}
        >
          {run.ok ? (
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-done"
              aria-label={t.succeeded}
            />
          ) : (
            <XCircle
              className="mt-0.5 size-4 shrink-0 text-urgent"
              aria-label={t.failed}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
              <span className="font-medium">{t.labels[run.kind]}</span>
              {run.target && (
                <span className="text-tertiary">
                  {t.targets[run.target] ?? run.target}
                </span>
              )}
            </p>
            {run.summary && (
              <p
                className={cn(
                  "mt-0.5 text-2xs",
                  run.ok ? "text-tertiary" : "text-urgent",
                  dense && "truncate",
                )}
              >
                {run.summary}
              </p>
            )}
          </div>
          <RelativeTime
            date={run.finishedAt}
            staleAfterHours={OPS_FRESHNESS[run.kind]}
            className="shrink-0 text-2xs whitespace-nowrap text-tertiary tabular-nums"
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * Sélecteur à segments, fait de liens : l'état vit dans l'adresse, qui se
 * partage et survit à un rechargement.
 */
export function Segmented({
  label,
  options,
}: {
  label: string;
  options: { label: string; href: string; active: boolean }[];
}) {
  return (
    <nav
      aria-label={label}
      className="flex max-w-full overflow-x-auto rounded-lg border border-border-subtle bg-surface-sunken p-0.5"
    >
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.active ? "page" : undefined}
          scroll={false}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs whitespace-nowrap transition-colors",
            option.active
              ? "bg-surface-raised font-medium text-primary shadow-raised"
              : "text-tertiary hover:text-secondary",
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Une valeur clé, sa légende, et une précision — dans un panneau.
 *
 * Plus sobre qu'une carte de mesure : pour les grilles denses de l'écran
 * d'activité, où dix icônes côte à côte deviendraient du bruit.
 */
export function Figure({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  tone?: "urgent" | "progress" | "done";
}) {
  return (
    <div className="min-w-0">
      <p className="truncate text-2xs text-tertiary">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-xl font-semibold tabular-nums",
          tone === "urgent" && "text-urgent",
          tone === "progress" && "text-progress",
          tone === "done" && "text-done",
        )}
      >
        {value}
      </p>
      {hint && <p className="truncate text-2xs text-tertiary">{hint}</p>}
    </div>
  );
}

/** Pastille d'état — en ligne, active, en échec. */
export function StatusDot({
  ok,
  label,
}: {
  ok: boolean | null;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          ok === null ? "bg-tertiary" : ok ? "bg-done" : "bg-urgent",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
