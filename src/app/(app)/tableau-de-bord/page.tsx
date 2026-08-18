"use client";

import { ArrowRight, Download, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StudyAge } from "@/components/domain/study-age";
import { StudyStatusChip } from "@/components/domain/study-status";
import {
  METRIC_ICONS,
  MetricGrid,
  type Metric,
} from "@/components/domain/metrics";
import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/providers/session-provider";
import { reportsWithStudy } from "@/lib/demo/reports";
import { DEMO_STUDIES, type DemoStudy } from "@/lib/demo/studies";
import { DateTime } from "@/components/domain/date-time";
import { formatPatientName } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Mesures du tableau de bord d'une clinique.
 *
 * Elles ne comptent pas la même chose que celles du radiologue. Une
 * clinique ne se demande pas combien d'examens attendent dans le pool :
 * elle se demande ce qu'elle a envoyé, ce qui revient, et si le délai
 * habituel est tenu.
 */
function buildMetrics(studies: DemoStudy[], readyCount: number): Metric[] {
  const inReading = studies.filter(
    (study) => study.status === "assigned" || study.status === "in_progress",
  );

  return [
    {
      label: "Examens envoyés",
      value: String(studies.length),
      icon: METRIC_ICONS.sent,
      tone: "neutral",
    },
    {
      label: "En cours de lecture",
      value: String(inReading.length),
      icon: METRIC_ICONS.writing,
      tone: "progress",
    },
    {
      label: "Comptes-rendus prêts",
      value: String(readyCount),
      hint: readyCount > 0 ? "à récupérer" : undefined,
      icon: METRIC_ICONS.ready,
      tone: readyCount > 0 ? "accent" : "neutral",
    },
    {
      label: "Délai moyen",
      value: "2 h 10",
      icon: METRIC_ICONS.wait,
      tone: "done",
      // Un délai qui baisse est une bonne nouvelle : le sens de la
      // variation ne suffit pas à le dire, il est donc déclaré.
      trend: {
        value: "18 %",
        direction: "down",
        good: true,
        label: "par rapport à la semaine dernière",
      },
    },
  ];
}

/**
 * Tableau de bord de la clinique.
 *
 * Il est construit autour d'une seule question : **qu'est-ce qui
 * m'attend ?** D'où l'ordre — d'abord les comptes-rendus prêts, qui
 * appellent une action ; ensuite les examens en cours, qui n'appellent
 * que de la patience ; l'envoi d'un nouvel examen reste accessible en
 * permanence, en tête de la navigation comme ici.
 */
export default function ClinicDashboardPage() {
  const router = useRouter();
  const { active } = useSession();

  // Une clinique ne voit que ses propres examens. La restriction est
  // ici cosmétique — en production elle est posée par les politiques RLS,
  // qui sont la seule barrière qui compte.
  const studies = DEMO_STUDIES.filter(
    (study) => study.clinic === active.organizationName,
  );
  const ready = reportsWithStudy().filter(
    (row) => row.study.clinic === active.organizationName,
  );

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description={`${active.organizationName} · ${active.city}`}
        actions={
          <Button size="sm" asChild>
            <Link href="/envoyer">
              <Upload />
              Envoyer un examen
            </Link>
          </Button>
        }
      />

      <MetricGrid
        metrics={buildMetrics(studies, ready.length)}
        className="px-6 pb-4"
      />

      {/* `items-start` : les deux panneaux prennent la hauteur de leur
          contenu. Étirés sur toute la fenêtre, ils laisseraient de larges
          zones vides qui donnent à l'écran un air inachevé. */}
      <div className="grid min-h-0 flex-1 items-start gap-4 overflow-auto px-6 pb-6 lg:grid-cols-3">
        {/* Ce qui appelle une action occupe la place principale. */}
        <Panel className="flex flex-col overflow-hidden lg:col-span-2">
          <SectionTitle
            title="Comptes-rendus prêts"
            action={{ label: "Tout voir", href: "/comptes-rendus" }}
          />

          {ready.length === 0 ? (
            <EmptyRow>Aucun compte-rendu en attente de récupération.</EmptyRow>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {ready.map(({ report, study }) => (
                <li key={report.id}>
                  <Link
                    href={`/comptes-rendus/${report.id}`}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      "transition-colors hover:bg-surface-hover",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {formatPatientName(study.patientName)}
                      </p>
                      <p className="truncate text-2xs text-tertiary">
                        {study.modality} {study.bodyPart} · signé par{" "}
                        {report.signedBy} · <DateTime date={report.signedAt} />
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" asChild>
                      <span>
                        <Download />
                        PDF
                      </span>
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Ce qui n'appelle que de la patience tient dans une colonne. */}
        <Panel className="flex flex-col overflow-hidden">
          <SectionTitle
            title="Derniers examens envoyés"
            action={{ label: "Tout voir", href: "/examens" }}
          />

          {studies.length === 0 ? (
            <EmptyRow>Aucun examen envoyé pour le moment.</EmptyRow>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {studies.slice(0, 5).map((study) => (
                <li key={study.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/examens/${study.id}`)}
                    className={cn(
                      "flex w-full items-center gap-2 px-4 py-2.5 text-left",
                      "transition-colors hover:bg-surface-hover",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {formatPatientName(study.patientName)}
                      </p>
                      <p className="truncate text-2xs text-tertiary">
                        {study.modality} · {study.bodyPart}
                      </p>
                    </div>
                    <StudyStatusChip status={study.status} />
                    <StudyAge
                      date={study.receivedAt}
                      muted={study.status === "delivered"}
                      className="w-10 shrink-0 text-right text-2xs tabular-nums"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

/** En-tête d'un panneau, avec son lien de sortie. */
function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b border-border-subtle px-4">
      <h2 className="label-eyebrow">{title}</h2>
      {action && (
        <Link
          href={action.href}
          className="flex items-center gap-1 text-2xs text-tertiary transition-colors hover:text-accent"
        >
          {action.label}
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** Message d'un panneau sans contenu. */
function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-4 py-8 text-center text-xs text-tertiary">{children}</p>
  );
}
