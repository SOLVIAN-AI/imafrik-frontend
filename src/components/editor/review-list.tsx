"use client";

import {
  ArrowLeftRight,
  Brackets,
  Repeat2,
  Ruler,
  type LucideIcon,
} from "lucide-react";

import type { SectionKey } from "@/components/editor/sections";
import {
  describeFinding,
  type ReviewFinding,
  type ReviewKind,
} from "@/components/editor/review";
import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Icône de chaque nature de point relevé. */
const KIND_ICONS: Record<ReviewKind, LucideIcon> = {
  laterality: ArrowLeftRight,
  placeholder: Brackets,
  unit: Ruler,
  repeat: Repeat2,
};

/**
 * Points relevés par la relecture automatique.
 *
 * Chacun dit **où** (la section) et **quoi** (l'extrait) ; un clic mène à
 * la section quand `onGo` est fourni. La latéralité, la plus grave, est
 * en tête — l'ordre vient de `reviewReport`.
 *
 * Les messages suivent la langue de l'utilisateur ; les sections sont
 * nommées comme à l'écran, dans la langue du compte-rendu.
 *
 * @param findings      Points relevés.
 * @param sectionTitles Intitulés des sections, dans la langue du
 *                      compte-rendu.
 * @param onGo          Amène une section à l'écran.
 */
export function ReviewList({
  findings,
  sectionTitles,
  onGo,
  className,
}: {
  findings: ReviewFinding[];
  sectionTitles: Record<SectionKey, string>;
  onGo?: (section: SectionKey) => void;
  className?: string;
}) {
  const t = useMessages();
  const labels = t.reading.review;
  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {findings.map((finding, index) => {
        const Icon = KIND_ICONS[finding.kind];
        const content = (
          <>
            <Icon
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                finding.kind === "laterality" ? "text-urgent" : "text-progress",
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block text-xs">
                {describeFinding(finding, labels)}
              </span>
              <span className="mt-0.5 block text-2xs text-tertiary">
                {labels.kinds[finding.kind]} · {sectionTitles[finding.section]}
                {finding.excerpt && (
                  <span className="italic"> · {finding.excerpt}</span>
                )}
              </span>
            </span>
          </>
        );
        return (
          <li key={`${finding.kind}-${finding.section}-${index}`}>
            {onGo ? (
              <button
                type="button"
                onClick={() => onGo(finding.section)}
                className="flex w-full gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent"
              >
                {content}
              </button>
            ) : (
              <div className="flex gap-2.5 px-2.5 py-1.5">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
