"use client";

import { RefreshCw, Sparkles } from "lucide-react";

import { editorSection, type AiSource } from "@/components/editor/ai-review";
import type { SectionKey } from "@/components/editor/sections";
import type { AiReviewController } from "@/components/editor/use-ai-review";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils";

/**
 * Relecture avancée, par IA : l'état, puis les signalements.
 *
 * Tout ce qui vient de l'IA est marqué comme tel. Un signalement montre
 * le passage en cause et dit pourquoi, en une phrase ; il ne propose
 * aucune correction. Le radiologue peut s'y rendre ou l'écarter.
 *
 * Une relecture sans signalement ne dit jamais « conforme » : l'absence
 * de signalement n'est pas une validation, et le texte le rappelle.
 *
 * @param review        État et commandes de la relecture.
 * @param sectionTitles Intitulés des sections, dans la langue du
 *                      compte-rendu.
 * @param onGo          Amène une section à l'écran.
 */
export function AiReviewPanel({
  review,
  sectionTitles,
  onGo,
  className,
}: {
  review: AiReviewController;
  sectionTitles: Record<SectionKey, string>;
  onGo?: (section: SectionKey) => void;
  className?: string;
}) {
  const labels = useMessages().reading.aiReview;
  if (!review.enabled) return null;

  const running = review.status === "running";
  const sourceTitle = (source: AiSource) =>
    source === "clinical_info" ? labels.clinicalInfo : sectionTitles[source];
  const state =
    review.status === "running"
      ? labels.running
      : review.status === "unavailable"
        ? labels.unavailable
        : review.status === "idle"
          ? labels.idle
          : review.findings.length > 0
            ? labels.withFindings
            : labels.nothing;

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 shrink-0 text-accent" aria-hidden />
        <h3 className="text-xs font-medium">{labels.title}</h3>
        <span className="rounded border border-border-default px-1 text-2xs text-tertiary">
          {labels.badge}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          loading={running}
          onClick={review.run}
        >
          <RefreshCw />
          {review.status === "idle" ? labels.run : labels.rerun}
        </Button>
      </div>

      <p className="text-xs text-tertiary" role="status">
        {state}
        {review.stale && !running ? ` ${labels.stale}` : ""}
      </p>

      {review.findings.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {review.findings.map((finding) => (
            <li
              key={finding.index}
              className="rounded-lg border border-border-subtle px-2.5 py-2"
            >
              <p className="text-xs">
                <span
                  className={cn(
                    "font-medium",
                    finding.kind === "critical_finding" ||
                      finding.kind === "laterality"
                      ? "text-urgent"
                      : "text-progress",
                  )}
                >
                  {labels.kinds[finding.kind]}
                </span>{" "}
                · {sourceTitle(finding.section)}
              </p>
              <p className="mt-1 text-xs">{finding.note}</p>
              <p className="mt-1 text-2xs text-tertiary italic">
                {labels.quoted(finding.quote)}
              </p>
              {finding.relatedQuote && finding.relatedSection && (
                <p className="mt-0.5 text-2xs text-tertiary italic">
                  {labels.related(
                    sourceTitle(finding.relatedSection),
                    finding.relatedQuote,
                  )}
                </p>
              )}
              <div className="mt-1.5 flex gap-1">
                {onGo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onGo(editorSection(finding.section))}
                  >
                    {labels.go}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => review.dismiss(finding)}
                >
                  {labels.dismiss}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
