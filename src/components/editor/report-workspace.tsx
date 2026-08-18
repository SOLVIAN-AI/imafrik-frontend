"use client";

import { ArrowLeft, Lock, PenTool } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import {
  Group,
  Panel,
  Separator,
  useGroupRef,
  type Layout,
  type LayoutChangedMeta,
} from "react-resizable-panels";

import {
  ReportEditor,
  type ReportSections,
  type SectionKey,
} from "@/components/editor/report-editor";
import { SignReportDialog } from "@/components/editor/sign-report-dialog";
import { ViewerPane } from "@/components/editor/viewer-pane";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { useAutosave } from "@/hooks/use-autosave";
import { saveReportDraft, signReport } from "@/lib/data/actions";
import type { Study } from "@/lib/data/studies";
import { useSession } from "@/components/providers/session-provider";
import { homeFor } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Contexte de l'examen lu, affiché en tête d'écran.
 *
 * Alias du type de la couche de données : l'espace de travail n'a pas de
 * forme à lui, et redéclarer les champs obligerait à les tenir en phase
 * à la main.
 */
export type WorkspaceStudy = Study;

/** Clé de persistance du partage entre les deux volets. */
const LAYOUT_STORAGE_KEY = "imafrik.reading.layout";

/**
 * Mémorise le partage image / texte choisi par le radiologue.
 *
 * Ce réglage est personnel et durable : certains lisent avec deux tiers
 * d'image, d'autres rédigent plus qu'ils ne scrutent. Le refaire à chaque
 * examen serait un irritant quotidien.
 *
 * La restauration a lieu **après** le montage, jamais pendant le rendu :
 * `localStorage` n'existe pas côté serveur, et lire une valeur qui
 * diffère du HTML rendu produirait une divergence d'hydratation.
 */
function usePersistedLayout() {
  const groupRef = useGroupRef();

  React.useEffect(() => {
    const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!stored) return;
    try {
      groupRef.current?.setLayout(JSON.parse(stored) as Layout);
    } catch {
      // Valeur corrompue : le partage par défaut fait parfaitement
      // l'affaire, inutile d'en faire une erreur visible.
      window.localStorage.removeItem(LAYOUT_STORAGE_KEY);
    }
  }, [groupRef]);

  const onLayoutChanged = React.useCallback(
    (layout: Layout, meta: LayoutChangedMeta) => {
      // Seul un geste délibéré est mémorisé. Un redimensionnement de
      // fenêtre modifie aussi la répartition, sans rien dire de la
      // préférence de l'utilisateur.
      if (!meta.isUserInteraction) return;
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    },
    [],
  );

  return { groupRef, onLayoutChanged };
}

/** Formate un `NOM^Prénom` DICOM pour la lecture. */
function formatPatientName(dicomName: string): string {
  const [family = "", given = ""] = dicomName.split("^");
  return [family.toUpperCase(), given].filter(Boolean).join(" ") || "—";
}

/**
 * Barre de contexte de l'écran de lecture.
 *
 * Elle répond en permanence à la seule question qui compte quand on
 * enchaîne les examens : *de qui est-ce le dossier ?* La perdre au
 * défilement serait une source d'erreur d'attribution — c'est pourquoi
 * elle est fixe, hors des volets qui défilent.
 */
function StudyBar({
  study,
  signed,
  canEdit,
  onSign,
}: {
  study: WorkspaceStudy;
  signed: boolean;
  canEdit: boolean;
  onSign: () => void;
}) {
  const { active } = useSession();
  const role = active.role;

  return (
    <header
      className={cn(
        "flex h-13 shrink-0 items-center gap-3 border-b border-border-subtle px-4",
        "bg-surface-raised/40 backdrop-blur-sm",
      )}
    >
      {/* Le retour dépend du portail : la file de lecture pour un
          radiologue, le suivi des examens pour une clinique. Un lien codé
          en dur renverrait la moitié des utilisateurs vers un écran qui
          n'existe pas pour eux. */}
      <Button variant="ghost" size="icon" aria-label="Retour" asChild>
        <Link href={homeFor(role)}>
          <ArrowLeft />
        </Link>
      </Button>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-sm font-semibold tracking-[-0.01em]">
            {formatPatientName(study.patientName)}
          </h1>
          {study.urgent && <UrgentMarker />}
        </div>
        <p className="truncate text-2xs text-tertiary">
          <span className="font-mono">{study.patientId}</span> ·{" "}
          {study.modality}
          {study.bodyPart && ` ${study.bodyPart}`} · {study.clinic}
        </p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        {/* La signature fait passer l'examen à « Rendu ». Le serveur le
            confirmera au prochain chargement ; l'afficher tout de suite
            évite un écran qui se contredit lui-même. */}
        <StudyStatusChip status={signed ? "reported" : study.status} />
        {signed && (
          <span className="flex items-center gap-1.5 text-2xs text-done">
            <Lock className="size-3" aria-hidden />
            Signé
          </span>
        )}
        {canEdit && !signed && (
          <Button size="sm" onClick={onSign}>
            <PenTool />
            Signer
          </Button>
        )}
      </div>
    </header>
  );
}

/**
 * Écran de lecture : images à gauche, compte-rendu à droite.
 *
 * **Pourquoi côte à côte plutôt qu'en onglets.** Un compte-rendu se
 * rédige en regardant l'image, pas de mémoire. Deux onglets obligeraient
 * à basculer à chaque mesure relevée, et chaque bascule est une occasion
 * d'oublier ce qu'on allait écrire.
 *
 * **Pourquoi l'image à gauche.** On lit de gauche à droite : l'observation
 * précède sa transcription. C'est aussi la disposition des consoles de
 * lecture auxquelles les radiologues sont habitués.
 *
 * La séparation est déplaçable et la position retenue d'une session à
 * l'autre, parce que la répartition idéale dépend de la modalité et de la
 * personne.
 *
 * **Le même écran sert la consultation.** Une clinique qui ouvre ses
 * propres images arrive ici avec `canEdit` à faux : elle voit les images
 * et le compte-rendu tel qu'il est, sans barre de mise en forme ni
 * signature. Écrire un second écran pour cela aurait dupliqué le volet
 * d'images, le partage déplaçable et la mise en page du document.
 *
 * @param study      Examen lu.
 * @param viewerUrl  URL signée du viewer, `null` s'il n'est pas joignable.
 * @param reportId   Compte-rendu à écrire. `null` tant qu'aucun n'existe
 *                   — l'enregistrement est alors suspendu plutôt que
 *                   d'écrire dans le vide.
 * @param initial    Contenu initial du compte-rendu, tel qu'il est en base.
 * @param canEdit    Faux en consultation : ni rédaction, ni signature.
 * @param signerName Nom porté par la signature.
 */
export function ReportWorkspace({
  study,
  viewerUrl,
  reportId,
  initial,
  initiallySigned = false,
  canEdit = true,
  signerName,
}: {
  study: WorkspaceStudy;
  viewerUrl: string | null;
  reportId: string | null;
  initial: ReportSections;
  initiallySigned?: boolean;
  canEdit?: boolean;
  signerName: string;
}) {
  const [sections, setSections] = React.useState<ReportSections>(initial);
  const [signed, setSigned] = React.useState(initiallySigned);
  const [confirming, setConfirming] = React.useState(false);
  const { groupRef, onLayoutChanged } = usePersistedLayout();

  // Un compte-rendu signé, consulté par une clinique, ou pas encore créé
  // en base, ne s'écrit pas.
  const locked = signed || !canEdit;

  const save = React.useCallback(
    async (value: ReportSections) => {
      if (!reportId) return;
      await saveReportDraft(reportId, value);
    },
    [reportId],
  );

  const { state, flush } = useAutosave({
    value: sections,
    save,
    disabled: locked || reportId === null,
  });

  const update = React.useCallback((key: SectionKey, html: string) => {
    setSections((current) => ({ ...current, [key]: html }));
  }, []);

  /**
   * Vide la file d'enregistrement avant de signer.
   *
   * Sans cela, une frappe faite moins d'une seconde avant le clic serait
   * encore dans le minuteur : on signerait une version antérieure à celle
   * affichée à l'écran.
   */
  const sign = React.useCallback(async () => {
    await flush();
    if (reportId) await signReport(reportId);
    setSigned(true);
  }, [flush, reportId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StudyBar
        study={study}
        signed={signed}
        canEdit={canEdit}
        onSign={() => setConfirming(true)}
      />

      <Group
        orientation="horizontal"
        groupRef={groupRef}
        onLayoutChanged={onLayoutChanged}
        className="min-h-0 flex-1"
      >
        {/* 34 % minimum de chaque côté : en deçà, l'image devient
            inexploitable ou le texte tombe sous la mesure lisible. */}
        <Panel id="viewer" defaultSize="56" minSize="34" className="min-w-0">
          <ViewerPane study={study} viewerUrl={viewerUrl} />
        </Panel>

        <Separator
          className={cn(
            "w-px shrink-0 bg-border-default outline-none",
            // La poignée est fine à l'œil mais large au pointeur : la
            // zone de saisie déborde du trait sans l'épaissir.
            "relative after:absolute after:inset-y-0 after:-inset-x-1 after:content-[’’]",
            "transition-colors data-[state=hover]:bg-accent data-[state=drag]:bg-accent",
          )}
        />

        <Panel id="report" defaultSize="44" minSize="34" className="min-w-0">
          <div className="flex h-full min-h-0 flex-col">
            {signed && <SignedBanner />}
            <ReportEditor
              sections={sections}
              saveState={state}
              readOnly={locked}
              onChange={update}
            />
          </div>
        </Panel>
      </Group>

      <SignReportDialog
        open={confirming}
        onOpenChange={setConfirming}
        sections={sections}
        patientLabel={formatPatientName(study.patientName)}
        signerName={signerName}
        onConfirm={sign}
      />
    </div>
  );
}

/**
 * Bandeau d'un compte-rendu signé.
 *
 * Il dit pourquoi le texte ne répond plus. Un éditeur devenu inerte sans
 * explication passe pour une panne.
 */
function SignedBanner() {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-b border-border-subtle px-4 py-2",
        "bg-done-muted text-2xs text-done",
      )}
    >
      <Lock className="size-3 shrink-0" aria-hidden />
      Compte-rendu signé et transmis. Toute correction passera par un addendum.
    </div>
  );
}
