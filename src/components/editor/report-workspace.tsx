"use client";

import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  CloudUpload,
  CornerDownLeft,
  FileClock,
  FilePen,
  Hand,
  Languages,
  Lock,
  PenTool,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
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
import {
  SignReportDialog,
  type SignDialogLabels,
} from "@/components/editor/sign-report-dialog";
import { useAiReview } from "@/components/editor/use-ai-review";
import {
  SaveAsTemplate,
  TemplatePicker,
} from "@/components/editor/template-tools";
import { ViewerPane } from "@/components/editor/viewer-pane";
import { VoidReportButton } from "@/components/admin/void-report-button";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { DeadlineBadge } from "@/components/domain/reading-table";
import { useSession } from "@/components/providers/session-provider";
import { HelpMenu } from "@/components/tour/help-menu";
import { Button } from "@/components/ui/button";
import { type SaveOutcome, useAutosave } from "@/hooks/use-autosave";
import type { ViewerSession } from "@/hooks/use-viewer-session";
import { WorkspaceSkeleton } from "@/components/editor/workspace-skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { AppMessages } from "@/i18n";
import { useLocale, useMessages } from "@/i18n/client";
import type { ActionResult } from "@/lib/actions/result";
import { renewViewerToken, reopenViewer } from "@/lib/actions/viewer";
import {
  claimStudy,
  readDraftVersion,
  releaseStudy,
  saveReportDraft,
  signReport,
} from "@/lib/actions/reading";
import type { Study } from "@/lib/data/studies";
import type { ReportTemplate } from "@/lib/data/templates";
import {
  clearReportBackup,
  importBackupKey,
  purgeStaleBackups,
  readReportBackup,
  writeReportBackup,
} from "@/lib/editor/backup";
import { formatDemographics, formatPatientName } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { homeFor } from "@/lib/navigation";
import { useReturnPath } from "@/lib/return-path";
import { cn } from "@/lib/utils";

/**
 * Contexte de l'examen lu, affiché en tête d'écran.
 *
 * Alias du type de la couche de données : l'espace de travail n'a pas de
 * forme à lui, et redéclarer les champs obligerait à les tenir en phase
 * à la main.
 */
/** États où l'examen attend encore son compte-rendu : l'échéance compte. */
const OPEN_STATUSES: ReadonlySet<Study["status"]> = new Set([
  "received",
  "assigned",
  "in_progress",
]);

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
    try {
      const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (stored) groupRef.current?.setLayout(JSON.parse(stored) as Layout);
    } catch {
      // Valeur corrompue ou stockage bloqué : le partage par défaut fait
      // parfaitement l'affaire, inutile d'en faire une erreur visible.
    }
  }, [groupRef]);

  const onLayoutChanged = React.useCallback(
    (layout: Layout, meta: LayoutChangedMeta) => {
      // Seul un geste délibéré est mémorisé. Un redimensionnement de
      // fenêtre modifie aussi la répartition, sans rien dire de la
      // préférence de l'utilisateur.
      if (!meta.isUserInteraction) return;
      try {
        window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
      } catch {
        // Stockage bloqué : le réglage vaudra pour cette session seulement.
      }
    },
    [],
  );

  return { groupRef, onLayoutChanged };
}

/**
 * Ce que l'utilisateur peut faire de cet examen.
 *
 * Décidé côté serveur par la page, à partir du rôle et de la prise en
 * charge — le service le revérifie de toute façon à chaque écriture.
 *
 * - `author` — le radiologue a pris l'examen en charge : il rédige,
 *   signe, ou rend l'examen au pool. `backupKey` chiffre la copie de
 *   secours locale de son brouillon (`lib/editor/backup-key.ts`) ;
 *   `null`, aucune copie n'est écrite.
 * - `claimable` — un radiologue voit un examen libre : un bouton le prend
 *   en charge et ouvre son brouillon. Personne ne rédige sans l'avoir
 *   pris : deux radiologues ne peuvent pas écrire le même compte-rendu.
 * - `readonly` — consultation : clinique, examen pris par un collègue,
 *   compte-rendu signé.
 */
/** Volet du compte-rendu tant qu'aucun radiologue ne l'a signé. */
function AwaitingReport() {
  const labels = useMessages().reading.page;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <FileClock className="size-6 text-tertiary" aria-hidden />
      <p className="text-sm font-medium">{labels.awaitingReportTitle}</p>
      <p className="max-w-xs text-xs leading-relaxed text-secondary">
        {labels.awaitingReportDetail}
      </p>
    </div>
  );
}

export type WorkspaceMode =
  | {
      kind: "author";
      reportId: string;
      version: number;
      backupKey: string | null;
    }
  | { kind: "claimable" }
  | {
      kind: "readonly";
      notice?: string;
      /**
       * Compte-rendu signé qu'un radiologue habilité peut corriger par un
       * addendum : l'écran y mène, plutôt que de laisser croire le texte
       * figé pour de bon.
       */
      addendumReportId?: string;
      /**
       * Équipe IMAFRIK : compte-rendu signé qu'elle peut annuler s'il l'a
       * été par erreur (essai, mauvais examen).
       */
      voidableReportId?: string;
      /**
       * Consultation sans compte-rendu signé (clinique, administration) :
       * le volet de rédaction cède la place à un état d'attente. Un
       * formulaire vide aux sections « obligatoires » laissait croire à la
       * clinique qu'elle devait le remplir.
       */
      awaitingReport?: boolean;
    };

/** Textes de l'espace de travail qu'un autre usage peut remplacer. */
type AdaptableLabels = Pick<
  AppMessages["reading"]["workspace"],
  | "claim"
  | "claimBanner"
  | "sign"
  | "signedToast"
  | "signedBanner"
  | "release"
  | "releaseConfirm"
>;

/**
 * Le même écran, pour un autre texte qu'un vrai compte-rendu.
 *
 * L'espace de formation (docs/formation.md du backend) s'exerce dans
 * l'écran de lecture réel : mêmes volets, même éditeur, même signature.
 * Seuls changent les actions (un exercice, jamais un examen), quelques
 * libellés, la destination du retour, et ce que la barre propose une
 * fois le texte signé. Sans adaptateur, l'écran est celui d'un vrai
 * compte-rendu, à l'identique.
 */
export interface WorkspaceAdapter {
  /** Enregistre le texte ; mêmes réponses que `saveReportDraft`. */
  save: (
    id: string,
    sections: ReportSections,
    version: number,
  ) => Promise<ActionResult<{ version: number }>>;
  /** Version en base, pour résoudre un conflit d'enregistrement. */
  readVersion: (
    id: string,
  ) => Promise<ActionResult<{ version: number; signed: boolean }>>;
  /** Signe le texte à la version relue. */
  sign: (id: string, version: number) => Promise<ActionResult>;
  /** Prend en charge : ouvre le texte à rédiger. */
  claim: () => Promise<ActionResult<unknown>>;
  /** Abandonne le texte en cours, puis mène à `homeHref`. */
  release: (id: string) => Promise<ActionResult>;
  /** Destination du retour et de l'abandon. */
  homeHref: string;
  /** Titre de la barre, à la place du nom d'un patient. */
  title: string;
  /** Bandeau permanent, au-dessus du texte. */
  notice: string;
  labels: AdaptableLabels;
  signLabels: SignDialogLabels;
  /** Actions de la barre une fois le texte signé. */
  signedActions?: React.ReactNode;
  /** Contenu sous l'éditeur : corrigé, addenda. */
  footer?: React.ReactNode;
  /** Prolongation du jeton du viewer, pour l'étude de l'exercice. */
  viewer: ViewerSession;
}

/**
 * Langue du compte-rendu, signalée quand elle diffère de celle de l'écran.
 *
 * La clinique reçoit ses comptes-rendus dans la langue fixée à son
 * contrat ; le radiologue doit le savoir avant d'écrire la première
 * ligne, pas le découvrir sur le PDF. Discrète, dans le style des autres
 * pastilles de la barre : c'est une information, pas une alerte. Rien
 * n'est affiché quand les deux langues coïncident.
 *
 * @param language Langue du compte-rendu.
 */
function ReportLanguageChip({ language }: { language: Locale }) {
  const t = useMessages();
  const locale = useLocale();
  if (language === locale) return null;
  const labels = t.reading.reportLanguage;
  return (
    <span
      title={labels.tooltip[language]}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-active px-2 py-0.5",
        "text-2xs font-medium whitespace-nowrap text-secondary",
      )}
    >
      <Languages className="size-3" aria-hidden />
      {labels.chip[language]}
      <span className="sr-only">. {labels.tooltip[language]}</span>
    </span>
  );
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
  actions,
  adapter,
}: {
  study: WorkspaceStudy;
  signed: boolean;
  actions: React.ReactNode;
  adapter?: WorkspaceAdapter;
}) {
  const { active } = useSession();
  const storedReturnPath = useReturnPath(homeFor(active.role));
  // Un exercice ramène toujours à la liste des exercices, pas à la
  // dernière liste du portail visitée.
  const returnPath = adapter?.homeHref ?? storedReturnPath;
  const t = useMessages();
  const locale = useLocale();
  // L'âge est celui du jour de l'examen : c'est lui qui compte pour
  // l'interprétation, et il ne dépend pas de l'horloge du poste — le
  // rendu serveur et le rendu client donnent donc le même texte.
  const demographics = formatDemographics(
    study.patientSex,
    study.patientBirthDate,
    study.receivedAt,
    locale,
  );

  return (
    <header
      className={cn(
        // Sur un écran étroit, les actions passent sur une seconde ligne
        // plutôt que de recouvrir le nom du patient.
        "flex min-h-13 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border-subtle px-3 py-2 sm:px-4",
        "bg-surface-raised/40 backdrop-blur-sm",
      )}
    >
      {/* Retour à la page du portail d'où l'on vient ; à défaut, son
          accueil (la file pour un radiologue, le suivi pour une clinique). */}
      <Button
        variant="ghost"
        size="icon"
        aria-label={t.common.actions.back}
        data-tour="back"
        asChild
      >
        <Link href={returnPath}>
          <ArrowLeft />
        </Link>
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-sm font-semibold tracking-[-0.01em]">
            {adapter?.title ?? formatPatientName(study.patientName)}
          </h1>
          {study.urgent && <UrgentMarker />}
          {/* L'échéance reste sous les yeux pendant la rédaction : la file
              l'affichait, l'écran où l'on écrit ne la montrait pas. Au
              radiologue seulement : côté clinique, « reste 22 min » se
              lirait comme une promesse de remise. */}
          {active.role === "radiologist" &&
            !adapter &&
            !signed &&
            OPEN_STATUSES.has(study.status) && <DeadlineBadge study={study} />}
          <ReportLanguageChip language={study.reportLanguage} />
        </div>
        <p className="truncate text-2xs text-tertiary">
          {demographics && (
            <span className="text-secondary">{demographics} · </span>
          )}
          <span className="font-mono">{study.patientId || "—"}</span> ·{" "}
          {study.modality}
          {study.bodyPart && ` ${study.bodyPart}`} · {study.clinic}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <HelpMenu />
        {!adapter && (
          <StudyStatusChip status={signed ? "reported" : study.status} />
        )}
        {signed && (
          <span className="hidden items-center gap-1.5 text-2xs text-done sm:flex">
            <Lock className="size-3" aria-hidden />
            {t.reading.workspace.signed}
          </span>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
          {actions}
        </div>
      )}
    </header>
  );
}

/**
 * Compte-rendu et barre d'actions de l'écran de lecture.
 *
 * Remis à zéro, par sa clé, à chaque changement du brouillon en base
 * (prise en charge, signature) : l'éditeur repart de l'état du serveur.
 * Il s'affiche dans les emplacements que lui prête {@link ReadingWorkspace},
 * si bien que cette remise à zéro ne touche jamais au viewer.
 *
 * @param study      Examen lu.
 * @param mode       Ce que l'utilisateur peut faire — voir {@link WorkspaceMode}.
 * @param initial    Contenu du compte-rendu tel qu'il est en base.
 * @param signed     Le compte-rendu est déjà signé.
 * @param signerName Nom porté par la signature.
 * @param templates  Modèles proposés à l'auteur — ceux de la modalité.
 * @param nextStudyId Prochain examen de la file, proposé après la
 *                    signature : on enchaîne sans repasser par la liste.
 * @param slots      Emplacements de la barre et du compte-rendu.
 */
function ReportWorkspace({
  study,
  mode,
  initial,
  signed: initiallySigned,
  signerName,
  templates = [],
  nextStudyId = null,
  aiReview: aiReviewOffered = false,
  adapter,
  slots,
}: {
  study: WorkspaceStudy;
  mode: WorkspaceMode;
  initial: ReportSections;
  signed: boolean;
  signerName: string;
  templates?: ReportTemplate[];
  nextStudyId?: string | null;
  /** La relecture par IA est offerte à cet utilisateur (décidé par le service). */
  aiReview?: boolean;
  /** Autre usage de l'écran : voir {@link WorkspaceAdapter}. */
  adapter?: WorkspaceAdapter;
  /** Emplacements fournis par {@link ReadingWorkspace}, `null` avant leur montage. */
  slots: WorkspaceSlots;
}) {
  const router = useRouter();
  const { active } = useSession();
  const readingLabels = useMessages().reading.workspace;
  const labels = React.useMemo(
    () => (adapter ? { ...readingLabels, ...adapter.labels } : readingLabels),
    [adapter, readingLabels],
  );
  const [sections, setSections] = React.useState<ReportSections>(initial);
  // Révision du contenu : incrémentée à chaque texte posé d'ailleurs que
  // par la frappe — voir `replaceSections`.
  const [revision, setRevision] = React.useState(0);
  const [signed, setSigned] = React.useState(initiallySigned);
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const author = mode.kind === "author" ? mode : null;
  const locked = signed || !author;

  // Version du brouillon en base, suivie au fil des enregistrements : le
  // service refuse une écriture faite sur une version périmée.
  const version = React.useRef(author?.version ?? 0);

  // Clé de la copie de secours, importée une fois et gardée en mémoire :
  // l'écriture survient précisément quand le réseau est tombé.
  const rawBackupKey = author?.backupKey ?? null;
  const backupKey = React.useMemo(
    () =>
      rawBackupKey ? importBackupKey(rawBackupKey) : Promise.resolve(null),
    [rawBackupKey],
  );

  const save = React.useCallback(
    async (value: ReportSections): Promise<SaveOutcome> => {
      if (!author) return "saved";
      // Réseau coupé : l'appel de l'action rejette au lieu de répondre. Les
      // deux cas mènent à la copie de secours.
      const result = await (adapter?.save ?? saveReportDraft)(
        author.reportId,
        value,
        version.current,
      ).catch(() => null);
      if (result?.ok) {
        version.current = result.data.version;
        clearReportBackup(author.reportId);
        return "saved";
      }
      if (result?.status === 409) return "conflict";
      // Refus explicite du service (numéro d'ordre dont la validation a
      // été retirée, par exemple) : son message est dit une fois, pas à
      // chaque tentative. Le texte reste gardé sur le poste.
      if (result && !result.ok && result.status === 403) {
        toast.error(result.error, { id: "report-save-forbidden" });
      }
      const key = await backupKey;
      if (key) {
        await writeReportBackup(key, author.reportId, {
          sections: value,
          baseVersion: version.current,
          savedAt: new Date().toISOString(),
        });
      }
      return "failed";
    },
    [adapter, author, backupKey],
  );

  /**
   * Garde le texte sur le poste pendant un conflit d'enregistrement.
   *
   * Le service a une autre version du brouillon (second onglet, ou
   * enregistrement appliqué dont la réponse s'est perdue) : écrire
   * écraserait l'autre version sans que le radiologue l'ait décidé. Le
   * texte affiché est donc copié, à chaque modification, jusqu'à ce qu'il
   * tranche ; sans cette copie, tout ce qui était tapé après le conflit
   * disparaissait au rechargement.
   */
  const keep = React.useCallback(
    async (value: ReportSections): Promise<boolean> => {
      if (!author) return false;
      const key = await backupKey;
      if (!key) return false;
      return writeReportBackup(key, author.reportId, {
        sections: value,
        baseVersion: version.current,
        savedAt: new Date().toISOString(),
        conflict: true,
      });
    },
    [author, backupKey],
  );

  const update = React.useCallback((key: SectionKey, html: string) => {
    setSections((current) => ({ ...current, [key]: html }));
  }, []);

  /**
   * Remplace le texte par un contenu venu d'ailleurs que la frappe —
   * modèle, copie de secours, renseignements cliniques.
   *
   * Un éditeur de section ne lit son contenu qu'à sa création. Changer
   * l'état seul laissait l'ancien texte à l'écran pendant que
   * l'enregistrement automatique envoyait le nouveau — et la frappe
   * suivante l'écrasait. La révision recrée les éditeurs sur le contenu
   * posé.
   *
   * @param update Nouvelles sections, ou fonction des sections courantes.
   */
  const replaceSections = React.useCallback(
    (update: React.SetStateAction<ReportSections>) => {
      setSections(update);
      setRevision((current) => current + 1);
    },
    [],
  );

  const { state, flush, resume } = useAutosave({
    value: sections,
    save,
    keep,
    disabled: locked,
  });

  /**
   * Résout un conflit en gardant le texte affiché : l'écriture suivante
   * vise la version désormais en base, et la remplace.
   */
  const keepMine = React.useCallback(async () => {
    if (!author) return;
    const current = await (adapter?.readVersion ?? readDraftVersion)(
      author.reportId,
    ).catch(() => null);
    if (!current?.ok) {
      toast.error(labels.conflictKeepFailed);
      return;
    }
    if (current.data.signed) {
      toast.error(labels.conflictSignedElsewhere);
      return;
    }
    version.current = current.data.version;
    if (await resume()) toast.success(labels.conflictKept);
    else toast.error(labels.conflictKeepFailed);
  }, [adapter, author, labels, resume]);

  // Reprise d'une copie de secours laissée par une coupure ou un conflit.
  // Elle est toujours proposée, jamais imposée ni écartée en silence : si
  // le brouillon a avancé ailleurs depuis, la proposition le dit. Une
  // version plus récente en base ne signifie pas un texte plus récent :
  // un enregistrement appliqué dont la réponse s'est perdue fait avancer
  // la version sans que ce poste le sache, et la copie porte alors tout
  // ce qui a été tapé ensuite.
  //
  // Une copie que la clé du compte n'ouvre pas appartient à un autre
  // compte : elle est laissée en place, sans rien en dire.
  React.useEffect(() => {
    if (!author) return;
    let cancelled = false;
    void (async () => {
      purgeStaleBackups();
      const key = await backupKey;
      if (!key || cancelled) return;
      const read = await readReportBackup(key, author.reportId);
      if (cancelled || read.status !== "found") return;
      const backup = read.backup;
      const diverged = backup.baseVersion !== author.version;
      toast.info(diverged ? labels.backupConflictFound : labels.backupFound, {
        duration: Number.POSITIVE_INFINITY,
        action: {
          label: labels.backupRestore,
          onClick: () => replaceSections(backup.sections),
        },
        cancel: {
          label: labels.backupDiscard,
          onClick: () => clearReportBackup(author.reportId),
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [author, backupKey, labels, replaceSections]);

  /**
   * Signe, après s'être assuré que le service a bien le texte affiché.
   *
   * Si l'enregistrement en cours échoue, la signature n'est pas tentée :
   * signer à ce moment-là, c'était signer une version antérieure à
   * l'écran. La version relue part avec la demande : le service refuse
   * si un autre onglet a enregistré depuis. L'erreur levée est affichée
   * telle quelle par la modale.
   */
  // Relecture par IA : seulement pour l'auteur d'un brouillon ouvert. Elle
  // enregistre avant d'appeler, parce que le service relit ce qui est en
  // base, pas ce qui est à l'écran.
  const aiReview = useAiReview({
    reportId: locked ? null : (author?.reportId ?? null),
    sections,
    enabled: aiReviewOffered,
    save: flush,
  });

  /**
   * Ouvre la fenêtre de signature. La relecture par IA part à ce
   * moment-là si elle n'a pas encore porté sur ce texte : le radiologue
   * la trouve faite en arrivant, sans avoir eu à y penser. Elle ne retarde
   * ni n'empêche la signature.
   */
  const openSigning = React.useCallback(() => {
    setConfirming(true);
    if (aiReview.status === "idle" || aiReview.stale) aiReview.run();
  }, [aiReview]);

  const sign = React.useCallback(async () => {
    if (!author) return;
    if (!(await flush())) {
      throw new Error(
        state === "conflict"
          ? labels.conflictBeforeSign
          : labels.saveFailedBeforeSign,
      );
    }
    // La version que l'écran montre, après l'enregistrement ci-dessus : un
    // texte enregistré depuis un autre onglet fait refuser la signature.
    const result = await (adapter?.sign ?? signReport)(
      author.reportId,
      version.current,
    );
    if (!result.ok) throw new Error(result.error);
    setSigned(true);
    toast.success(labels.signedToast, {
      action: nextStudyId
        ? {
            label: labels.nextStudy,
            onClick: () => router.push(`/lecture/${nextStudyId}`),
          }
        : undefined,
    });
    router.refresh();
  }, [adapter, author, flush, labels, nextStudyId, router, state]);

  const claim = () =>
    startTransition(async () => {
      const result = adapter
        ? await adapter.claim()
        : await claimStudy(study.id);
      if (!result.ok) {
        toast.error(result.error);
        router.refresh();
        return;
      }
      router.refresh();
    });

  const release = () => {
    if (!window.confirm(labels.releaseConfirm)) return;
    startTransition(async () => {
      const result =
        adapter && author
          ? await adapter.release(author.reportId)
          : await releaseStudy(study.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (author) clearReportBackup(author.reportId);
      router.push(adapter?.homeHref ?? "/worklist");
      router.refresh();
    });
  };

  const next =
    nextStudyId && active.role === "radiologist" ? (
      <Button size="sm" variant="secondary" asChild>
        <Link href={`/lecture/${nextStudyId}`} prefetch={false}>
          {labels.nextStudy}
          <ArrowRight />
        </Link>
      </Button>
    ) : null;

  const correct =
    mode.kind === "readonly" && mode.addendumReportId ? (
      <Button size="sm" variant="secondary" asChild>
        <Link href={`/comptes-rendus/${mode.addendumReportId}#addenda`}>
          <FilePen />
          {labels.correct}
        </Link>
      </Button>
    ) : null;

  const voidable =
    mode.kind === "readonly" && mode.voidableReportId ? (
      <VoidReportButton
        reportId={mode.voidableReportId}
        patientLabel={formatPatientName(study.patientName)}
      />
    ) : null;

  const actions = signed ? (
    adapter ? (
      adapter.signedActions
    ) : (
      <>
        {voidable}
        {correct}
        {next}
      </>
    )
  ) : author ? (
    <>
      <TemplatePicker
        templates={templates}
        sections={sections}
        onApply={replaceSections}
      />
      <SaveAsTemplate
        sections={sections}
        modality={study.modality}
        bodyPart={study.bodyPart}
      />
      <Button variant="ghost" size="sm" onClick={release} loading={pending}>
        <Undo2 />
        {labels.release}
      </Button>
      <Button size="sm" onClick={openSigning} data-tour="sign">
        <PenTool />
        {labels.sign}
      </Button>
    </>
  ) : mode.kind === "claimable" ? (
    <Button size="sm" onClick={claim} loading={pending} data-tour="claim">
      <Hand />
      {labels.claim}
    </Button>
  ) : (
    next
  );

  const report = (
    <div className="flex h-full min-h-0 flex-col">
      {adapter && <Banner tone="neutral">{adapter.notice}</Banner>}
      {signed && <Banner tone="done">{labels.signedBanner}</Banner>}
      {!signed && mode.kind === "readonly" && mode.notice && (
        <Banner tone="neutral">{mode.notice}</Banner>
      )}
      {!signed && mode.kind === "claimable" && (
        <Banner tone="neutral">{labels.claimBanner}</Banner>
      )}
      {!signed && author && state === "conflict" && (
        <ConflictBanner
          onKeep={keepMine}
          onReload={() => window.location.reload()}
        />
      )}
      <ClinicalContext
        info={study.clinicalInfo}
        onUse={
          !locked && isBlank(sections.indication)
            ? () =>
                replaceSections((current) => ({
                  ...current,
                  indication: `<p>${escapeHtml(study.clinicalInfo ?? "")}</p>`,
                }))
            : undefined
        }
      />
      {mode.kind === "readonly" && mode.awaitingReport && !signed ? (
        <AwaitingReport />
      ) : (
        <ReportEditor
          sections={sections}
          revision={revision}
          saveState={state}
          readOnly={locked}
          language={study.reportLanguage}
          onChange={update}
          aiReview={aiReview}
        />
      )}
      {adapter?.footer}
    </div>
  );

  // La barre et le compte-rendu s'affichent dans les emplacements du
  // cadre : remis à zéro avec le brouillon, ils laissent le viewer intact.
  return (
    <>
      {slots.bar &&
        createPortal(
          <StudyBar
            study={study}
            signed={signed}
            actions={actions}
            adapter={adapter}
          />,
          slots.bar,
        )}
      {slots.report && createPortal(report, slots.report)}

      {author && (
        <SignReportDialog
          open={confirming}
          onOpenChange={setConfirming}
          sections={sections}
          patientLabel={adapter?.title ?? formatPatientName(study.patientName)}
          signerName={signerName}
          language={study.reportLanguage}
          onConfirm={sign}
          aiReview={aiReview}
          labels={adapter?.signLabels}
        />
      )}
    </>
  );
}

/** Emplacements prêtés par le cadre de lecture à son compte-rendu. */
interface WorkspaceSlots {
  bar: HTMLElement | null;
  report: HTMLElement | null;
}

/** Ce que reçoit l'écran de lecture. */
type ReadingWorkspaceProps = Omit<
  React.ComponentProps<typeof ReportWorkspace>,
  "slots"
> & {
  /** URL signée du viewer, `null` s'il n'est pas joignable. */
  viewerUrl: string | null;
  /**
   * Clé du brouillon en base : elle change à la prise en charge et à la
   * signature, et remet alors l'éditeur à l'état du serveur.
   */
  draftKey: string;
};

/**
 * Écran de lecture : images à gauche, compte-rendu à droite.
 *
 * **Pourquoi côte à côte plutôt qu'en onglets.** Un compte-rendu se
 * rédige en regardant l'image, pas de mémoire. Deux onglets obligeraient
 * à basculer à chaque mesure relevée.
 *
 * **Pourquoi l'image à gauche.** On lit de gauche à droite : l'observation
 * précède sa transcription. C'est aussi la disposition des consoles de
 * lecture auxquelles les radiologues sont habitués.
 *
 * **Le même écran sert la consultation** (`mode.kind === "readonly"`) :
 * images et compte-rendu tel qu'il est, sans mise en forme ni signature.
 *
 * **Le viewer ne se recharge jamais en cours de lecture.** Ce cadre, qui
 * le porte, n'est pas remis à zéro : seul le compte-rendu l'est, à la
 * prise en charge et à la signature. Avant, l'écran entier était recréé,
 * et le radiologue qui prenait en charge l'examen qu'il faisait défiler
 * se retrouvait sur une autre série, à la première coupe. L'adresse du
 * viewer est gardée pour l'examen ouvert : celle qu'émet chaque
 * rafraîchissement, avec un nouveau jeton, rechargerait aussi le cadre.
 */
export function ReadingWorkspace({
  viewerUrl,
  draftKey,
  ...workspace
}: ReadingWorkspaceProps) {
  const { isDemo } = useSession();
  const { study } = workspace;
  const { groupRef, onLayoutChanged } = usePersistedLayout();
  // Côte à côte à partir de 1024 px ; en dessous, chaque volet aurait
  // moins de 340 px — ni l'image ni le texte n'y sont exploitables.
  // Inconnu au rendu serveur (`null`) : une forme neutre, juste à toute
  // largeur, plutôt qu'une disposition devinée.
  const wide = useMediaQuery("(min-width: 1024px)", null);
  const [bar, setBar] = React.useState<HTMLElement | null>(null);
  const [report, setReport] = React.useState<HTMLElement | null>(null);

  // Adresse gardée tant que le même examen est ouvert ; reprise seulement
  // pour un autre examen, ou si le viewer n'était pas joignable.
  const [kept, setKept] = React.useState({ studyId: study.id, url: viewerUrl });
  if (kept.studyId !== study.id || (kept.url === null && viewerUrl !== null)) {
    setKept({ studyId: study.id, url: viewerUrl });
  }

  // Le jeton du viewer est prolongé tant que l'examen reste ouvert : sans
  // quoi il expirait pendant la rédaction (voir ViewerPane).
  const adapterViewer = workspace.adapter?.viewer;
  const viewerSession = React.useMemo<ViewerSession>(
    () =>
      adapterViewer ?? {
        renew: (token) =>
          renewViewerToken({ kind: "study", studyId: study.id }, token),
        reopen: () => reopenViewer({ kind: "study", studyId: study.id }),
      },
    [adapterViewer, study.id],
  );

  const viewer = (
    <ViewerPane
      study={study}
      viewerUrl={kept.url}
      demo={isDemo}
      session={viewerSession}
    />
  );
  const reportSlot = <div ref={setReport} className="h-full min-h-0" />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={setBar} className="contents" />

      {wide === null ? (
        <WorkspaceSkeleton />
      ) : wide ? (
        <Group
          orientation="horizontal"
          groupRef={groupRef}
          onLayoutChanged={onLayoutChanged}
          className="min-h-0 flex-1"
        >
          {/* 34 % minimum de chaque côté : en deçà, l'image devient
              inexploitable ou le texte tombe sous la mesure lisible. */}
          <Panel id="viewer" defaultSize="56" minSize="34" className="min-w-0">
            {viewer}
          </Panel>

          <Separator
            className={cn(
              "w-px shrink-0 bg-border-default outline-none",
              // La poignée est fine à l'œil mais large au pointeur : la
              // zone de saisie déborde du trait sans l'épaissir.
              "relative after:absolute after:inset-y-0 after:-inset-x-1 after:content-['']",
              "transition-colors data-[state=hover]:bg-accent data-[state=drag]:bg-accent",
            )}
          />

          <Panel id="report" defaultSize="44" minSize="34" className="min-w-0">
            {reportSlot}
          </Panel>
        </Group>
      ) : (
        <NarrowLayout viewer={viewer} report={reportSlot} />
      )}

      <ReportWorkspace key={draftKey} {...workspace} slots={{ bar, report }} />
    </div>
  );
}

/**
 * Bandeau d'information au-dessus du compte-rendu.
 *
 * Il dit pourquoi le texte ne répond pas. Un éditeur inerte sans
 * explication passe pour une panne.
 */
function Banner({
  tone,
  children,
}: {
  tone: "done" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-b border-border-subtle px-4 py-2 text-2xs",
        tone === "done"
          ? "bg-done-muted text-done"
          : "bg-surface-raised text-secondary",
      )}
    >
      {tone === "done" && <Lock className="size-3 shrink-0" aria-hidden />}
      {children}
    </div>
  );
}

/**
 * Bandeau d'un conflit d'enregistrement, et ses deux issues.
 *
 * Le texte du radiologue est déjà gardé sur le poste : le bandeau lui
 * laisse choisir, sans urgence, entre l'enregistrer à la place de l'autre
 * version et recharger celle-ci (son texte lui est alors proposé).
 *
 * @param onKeep   Garde le texte affiché.
 * @param onReload Recharge la version enregistrée.
 */
function ConflictBanner({
  onKeep,
  onReload,
}: {
  onKeep: () => Promise<void>;
  onReload: () => void;
}) {
  const labels = useMessages().reading.workspace;
  const [busy, setBusy] = React.useState(false);
  const keep = async () => {
    setBusy(true);
    try {
      await onKeep();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div
      role="alert"
      className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border-subtle bg-urgent-muted px-4 py-2 text-2xs text-primary"
    >
      <p className="min-w-0 flex-1 basis-60">{labels.conflictBanner}</p>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onReload} disabled={busy}>
          {labels.conflictReload}
        </Button>
        <Button size="sm" onClick={() => void keep()} loading={busy}>
          <CloudUpload />
          {labels.conflictKeepMine}
        </Button>
      </div>
    </div>
  );
}

/** Vrai si une section ne contient aucun texte. */
function isBlank(html: string): boolean {
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim() === ""
  );
}

/** Échappe un texte saisi par la clinique avant de l'insérer comme HTML. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Renseignement clinique transmis par la clinique.
 *
 * **C'est la question posée au radiologue**, et il doit l'avoir sous les
 * yeux en rédigeant : relégué en légende sous l'image, il se lisait mal
 * et s'oubliait. Placé en tête du compte-rendu, il peut aussi en devenir
 * l'indication d'un geste — la ressaisir à la main était une source de
 * fautes de copie.
 *
 * @param info  Texte saisi par la clinique, ou `null`.
 * @param onUse Recopie dans l'indication ; absent quand elle n'est pas
 *              modifiable ou déjà rédigée.
 */
function ClinicalContext({
  info,
  onUse,
}: {
  info: string | null;
  onUse?: () => void;
}) {
  const labels = useMessages().reading.workspace;
  if (!info) return null;
  return (
    <div
      data-tour="clinical-info"
      className="flex shrink-0 items-start gap-3 border-b border-border-subtle bg-surface-sunken/50 px-4 py-2.5"
    >
      <ClipboardList
        className="mt-0.5 size-3.5 shrink-0 text-tertiary"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="label-eyebrow">{labels.clinicalInfo}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-secondary">{info}</p>
      </div>
      {onUse && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={onUse}
          title={labels.copyToIndication}
        >
          <CornerDownLeft />
          {labels.indication}
        </Button>
      )}
    </div>
  );
}

/**
 * Écran de lecture sur une largeur réduite : un volet à la fois.
 *
 * Tablette ou téléphone d'astreinte : on bascule entre les images et le
 * compte-rendu plutôt que de les serrer côte à côte. Les deux volets
 * restent montés — seul l'un est affiché — pour que le texte en cours et
 * la position dans les images survivent à la bascule.
 */
function NarrowLayout({
  viewer,
  report,
}: {
  viewer: React.ReactNode;
  report: React.ReactNode;
}) {
  const labels = useMessages().reading.workspace.panes;
  const [tab, setTab] = React.useState<"images" | "report">("images");
  const tabs = [
    { id: "images", label: labels.images },
    { id: "report", label: labels.report },
  ] as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="tablist"
        aria-label={labels.label}
        className="flex shrink-0 gap-1 border-b border-border-subtle bg-surface-raised/40 p-1.5"
      >
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            id={`tab-${entry.id}`}
            aria-selected={tab === entry.id}
            aria-controls={`pane-${entry.id}`}
            data-tour={entry.id === "report" ? "report-tab" : undefined}
            onClick={() => setTab(entry.id)}
            className={cn(
              "h-9 flex-1 rounded-md text-sm font-medium transition-colors",
              tab === entry.id
                ? "bg-surface-active text-primary shadow-edge"
                : "text-tertiary hover:text-secondary",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>
      {/* Les deux volets se superposent. Celui des images est masqué sans
          être retiré de la mise en page (`invisible`, et non `hidden`) : à
          `display: none`, le cadre du visualiseur tombait à zéro de large,
          et OHIF recalculait ses volets sur cette largeur nulle. Au retour
          sur « Images », l'image restait décalée, une bande noire à gauche
          (signalé le 15 octobre 2026). Un élément invisible sort aussi de
          l'ordre de tabulation et de l'arbre d'accessibilité. */}
      <div className="relative min-h-0 flex-1">
        <div
          id="pane-images"
          role="tabpanel"
          aria-labelledby="tab-images"
          className={cn(
            "absolute inset-0",
            tab !== "images" && "pointer-events-none invisible",
          )}
        >
          {viewer}
        </div>
        <div
          id="pane-report"
          role="tabpanel"
          aria-labelledby="tab-report"
          className={cn(
            "absolute inset-0 flex flex-col bg-surface-base",
            tab !== "report" && "hidden",
          )}
        >
          {report}
        </div>
      </div>
    </div>
  );
}
