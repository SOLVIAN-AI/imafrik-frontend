"use client";

import {
  ArrowLeftRight,
  Brackets,
  Repeat2,
  Ruler,
  type LucideIcon,
} from "lucide-react";

import { REPORT_SECTIONS, type SectionKey } from "@/components/editor/sections";
import type { ReviewFinding, ReviewKind } from "@/components/editor/review";
import { cn } from "@/lib/utils";

/** Repère de chaque nature de point relevé. */
const KINDS: Record<ReviewKind, { icon: LucideIcon; label: string }> = {
  laterality: { icon: ArrowLeftRight, label: "Latéralité" },
  placeholder: { icon: Brackets, label: "Modèle" },
  unit: { icon: Ruler, label: "Unité" },
  repeat: { icon: Repeat2, label: "Répétition" },
};

const SECTION_TITLES = Object.fromEntries(
  REPORT_SECTIONS.map((section) => [section.key, section.title]),
) as Record<SectionKey, string>;

/**
 * Points relevés par la relecture automatique.
 *
 * Chacun dit **où** (la section) et **quoi** (l'extrait) ; un clic mène à
 * la section quand `onGo` est fourni. La latéralité, la plus grave, est
 * en tête — l'ordre vient de `reviewReport`.
 *
 * @param findings Points relevés.
 * @param onGo     Amène une section à l'écran.
 */
export function ReviewList({
  findings,
  onGo,
  className,
}: {
  findings: ReviewFinding[];
  onGo?: (section: SectionKey) => void;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {findings.map((finding, index) => {
        const kind = KINDS[finding.kind];
        const Icon = kind.icon;
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
              <span className="block text-xs">{finding.message}</span>
              <span className="mt-0.5 block text-2xs text-tertiary">
                {kind.label} · {SECTION_TITLES[finding.section]}
                {finding.excerpt && (
                  <span className="italic"> — {finding.excerpt}</span>
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
