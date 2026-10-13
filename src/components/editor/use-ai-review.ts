"use client";

import * as React from "react";

import {
  reviewSignature,
  stillPresent,
  type AiFinding,
} from "@/components/editor/ai-review";
import type { ReportSections } from "@/components/editor/sections";
import { reviewDraft, sendFindingDecision } from "@/lib/actions/reading";

/** Où en est la relecture par IA. */
export type AiReviewStatus = "idle" | "running" | "done" | "unavailable";

/** Ce que l'écran sait de la relecture par IA, et ce qu'il peut lui demander. */
export interface AiReviewController {
  /** Faux : la fonction n'est pas offerte, rien ne s'affiche. */
  enabled: boolean;
  status: AiReviewStatus;
  /** Signalements encore à l'ordre du jour : ni écartés, ni corrigés. */
  findings: AiFinding[];
  /** Vrai si le texte a changé depuis la dernière relecture. */
  stale: boolean;
  /** Lance une relecture. Sans effet si une autre est en cours. */
  run: () => void;
  /** Écarte un signalement : le radiologue l'a lu et ne le retient pas. */
  dismiss: (finding: AiFinding) => void;
}

interface Reviewed {
  runId: string | null;
  findings: AiFinding[];
  /** Empreinte du texte relu. */
  signature: string;
}

/**
 * Relecture d'un brouillon par IA, vue de l'écran.
 *
 * Trois règles :
 *
 * - **Le service relit ce qui est enregistré.** Une relecture commence
 *   donc par l'enregistrement du brouillon (`save`) ; s'il échoue, il n'y
 *   a pas de relecture, plutôt qu'une relecture d'un texte périmé.
 * - **Rien ne bloque.** Refus du service, panne du modèle ou coupure de
 *   connexion donnent le même état, `unavailable` : l'écran le dit en une
 *   ligne, et la signature reste possible.
 * - **Chaque signalement a une issue.** Écarté par le radiologue, ou
 *   corrigé — son passage a disparu du texte. L'issue est renvoyée au
 *   service, sans texte : c'est elle qui dira si la relecture sert.
 *
 * @param reportId Brouillon à relire ; `null` hors du mode auteur.
 * @param sections Contenu courant de l'éditeur.
 * @param enabled  La fonction est offerte à cet utilisateur.
 * @param save     Enregistre le brouillon ; résout à `false` en cas d'échec.
 */
export function useAiReview({
  reportId,
  sections,
  enabled,
  save,
}: {
  reportId: string | null;
  sections: ReportSections;
  enabled: boolean;
  save: () => Promise<boolean>;
}): AiReviewController {
  const active = enabled && reportId !== null;
  const [status, setStatus] = React.useState<AiReviewStatus>("idle");
  const [reviewed, setReviewed] = React.useState<Reviewed | null>(null);
  const [dismissed, setDismissed] = React.useState<ReadonlySet<number>>(
    () => new Set(),
  );
  // Le texte au moment où le service répond : la frappe continue pendant
  // l'appel, et l'empreinte doit être celle du texte réellement relu.
  const sectionsRef = React.useRef(sections);
  React.useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);
  // Une seule relecture à la fois, y compris entre deux rendus.
  const running = React.useRef(false);
  // Issues déjà renvoyées au service, pour ne pas les renvoyer deux fois.
  const reported = React.useRef(new Set<number>());

  const run = React.useCallback(() => {
    if (!active || running.current) return;
    running.current = true;
    setStatus("running");
    void (async () => {
      try {
        if (!(await save())) {
          setStatus("unavailable");
          return;
        }
        const signature = reviewSignature(sectionsRef.current);
        const result = await reviewDraft(reportId);
        if (!result.ok || !result.data.available) {
          setStatus("unavailable");
          return;
        }
        reported.current = new Set();
        setDismissed(new Set());
        setReviewed({
          runId: result.data.runId,
          findings: result.data.findings,
          signature,
        });
        setStatus("done");
      } catch {
        // Coupure de connexion pendant l'action serveur.
        setStatus("unavailable");
      } finally {
        running.current = false;
      }
    })();
  }, [active, reportId, save]);

  const report = React.useCallback(
    (index: number, decision: "corrected" | "dismissed") => {
      const runId = reviewed?.runId;
      if (!runId || reported.current.has(index)) return;
      reported.current.add(index);
      // Sans attente ni message : perdre une mesure ne coûte rien au
      // radiologue.
      void sendFindingDecision(runId, index, decision).catch(() => undefined);
    },
    [reviewed],
  );

  const dismiss = React.useCallback(
    (finding: AiFinding) => {
      setDismissed((current) => new Set(current).add(finding.index));
      report(finding.index, "dismissed");
    },
    [report],
  );

  const findings = React.useMemo(
    () =>
      (reviewed?.findings ?? []).filter(
        (finding) =>
          !dismissed.has(finding.index) && stillPresent(finding, sections),
      ),
    [reviewed, dismissed, sections],
  );

  // Un passage qui a disparu du texte a été corrigé : on le dit au service.
  React.useEffect(() => {
    for (const finding of reviewed?.findings ?? []) {
      if (!dismissed.has(finding.index) && !stillPresent(finding, sections)) {
        report(finding.index, "corrected");
      }
    }
  }, [reviewed, dismissed, sections, report]);

  const stale =
    status === "done" &&
    reviewed !== null &&
    reviewed.signature !== reviewSignature(sections);

  return React.useMemo(
    () => ({
      enabled: active,
      status,
      findings: active ? findings : [],
      stale,
      run,
      dismiss,
    }),
    [active, status, findings, stale, run, dismiss],
  );
}

/** Relecture par IA absente : la fonction n'est pas offerte. */
export const NO_AI_REVIEW: AiReviewController = {
  enabled: false,
  status: "idle",
  findings: [],
  stale: false,
  run: () => undefined,
  dismiss: () => undefined,
};
