"use client";

import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  CornerDownLeft,
  Hand,
  Languages,
  Lock,
  PenTool,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
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
import { SignReportDialog } from "@/components/editor/sign-report-dialog";
import {
  SaveAsTemplate,
  TemplatePicker,
} from "@/components/editor/template-tools";
import { ViewerPane } from "@/components/editor/viewer-pane";
import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { type SaveOutcome, useAutosave } from "@/hooks/use-autosave";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useLocale, useMessages } from "@/i18n/client";
import {
  claimStudy,
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
export type WorkspaceMode =
  | {
      kind: "author";
      reportId: string;
      version: number;
      backupKey: string | null;
    }
  | { kind: "claimable" }
  | { kind: "readonly"; notice?: string };

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
}: {
  study: WorkspaceStudy;
  signed: boolean;
  actions: React.ReactNode;
}) {
  const { active } = useSession();
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
      {/* Le retour dépend du portail : la file de lecture pour un
          radiologue, le suivi des examens pour une clinique. */}
      <Button
        variant="ghost"
        size="icon"
        aria-label={t.common.actions.back}
        asChild
      >
        <Link href={homeFor(active.role)}>
          <ArrowLeft />
        </Link>
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-sm font-semibold tracking-[-0.01em]">
            {formatPatientName(study.patientName)}
          </h1>
          {study.urgent && <UrgentMarker />}
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
        <StudyStatusChip status={signed ? "reported" : study.status} />
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
 * @param study      Examen lu.
 * @param viewerUrl  URL signée du viewer, `null` s'il n'est pas joignable.
 * @param mode       Ce que l'utilisateur peut faire — voir {@link WorkspaceMode}.
 * @param initial    Contenu du compte-rendu tel qu'il est en base.
 * @param signed     Le compte-rendu est déjà signé.
 * @param signerName Nom porté par la signature.
 * @param templates  Modèles proposés à l'auteur — ceux de la modalité.
 * @param nextStudyId Prochain examen de la file, proposé après la
 *                    signature : on enchaîne sans repasser par la liste.
 */
export function ReportWorkspace({
  study,
  viewerUrl,
  mode,
  initial,
  signed: initiallySigned,
  signerName,
  templates = [],
  nextStudyId = null,
}: {
  study: WorkspaceStudy;
  viewerUrl: string | null;
  mode: WorkspaceMode;
  initial: ReportSections;
  signed: boolean;
  signerName: string;
  templates?: ReportTemplate[];
  nextStudyId?: string | null;
}) {
  const router = useRouter();
  const { isDemo, active } = useSession();
  const labels = useMessages().reading.workspace;
  const [sections, setSections] = React.useState<ReportSections>(initial);
  // Révision du contenu : incrémentée à chaque texte posé d'ailleurs que
  // par la frappe — voir `replaceSections`.
  const [revision, setRevision] = React.useState(0);
  const [signed, setSigned] = React.useState(initiallySigned);
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const { groupRef, onLayoutChanged } = usePersistedLayout();
  // Côte à côte à partir de 1024 px ; en dessous, chaque volet aurait
  // moins de 340 px — ni l'image ni le texte n'y sont exploitables.
  const wide = useMediaQuery("(min-width: 1024px)", true);

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
      const result = await saveReportDraft(
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

  const { state, flush } = useAutosave({
    value: sections,
    save,
    disabled: locked,
  });

  // Reprise d'une copie de secours laissée par une coupure : proposée
  // seulement si elle part de la version encore en base — sinon le
  // brouillon a avancé ailleurs depuis, et la copie périmée est écartée.
  // La reprise est un choix du radiologue, pas un remplacement silencieux
  // du texte qu'il a sous les yeux.
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
      if (backup.baseVersion !== author.version) {
        clearReportBackup(author.reportId);
        return;
      }
      toast.info(labels.backupFound, {
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
   * l'écran. L'erreur levée est affichée telle quelle par la modale.
   */
  const sign = React.useCallback(async () => {
    if (!author) return;
    if (!(await flush())) {
      throw new Error(
        state === "conflict"
          ? labels.conflictBeforeSign
          : labels.saveFailedBeforeSign,
      );
    }
    const result = await signReport(author.reportId);
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
  }, [author, flush, labels, nextStudyId, router, state]);

  const claim = () =>
    startTransition(async () => {
      const result = await claimStudy(study.id);
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
      const result = await releaseStudy(study.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (author) clearReportBackup(author.reportId);
      router.push("/worklist");
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

  const actions = signed ? (
    next
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
      <Button size="sm" onClick={() => setConfirming(true)}>
        <PenTool />
        {labels.sign}
      </Button>
    </>
  ) : mode.kind === "claimable" ? (
    <Button size="sm" onClick={claim} loading={pending}>
      <Hand />
      {labels.claim}
    </Button>
  ) : (
    next
  );

  const viewer = (
    <ViewerPane study={study} viewerUrl={viewerUrl} demo={isDemo} />
  );
  const report = (
    <div className="flex h-full min-h-0 flex-col">
      {signed && <Banner tone="done">{labels.signedBanner}</Banner>}
      {!signed && mode.kind === "readonly" && mode.notice && (
        <Banner tone="neutral">{mode.notice}</Banner>
      )}
      {!signed && mode.kind === "claimable" && (
        <Banner tone="neutral">{labels.claimBanner}</Banner>
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
      <ReportEditor
        sections={sections}
        revision={revision}
        saveState={state}
        readOnly={locked}
        language={study.reportLanguage}
        onChange={update}
      />
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StudyBar study={study} signed={signed} actions={actions} />

      {wide ? (
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
            {report}
          </Panel>
        </Group>
      ) : (
        <NarrowLayout viewer={viewer} report={report} />
      )}

      {author && (
        <SignReportDialog
          open={confirming}
          onOpenChange={setConfirming}
          sections={sections}
          patientLabel={formatPatientName(study.patientName)}
          signerName={signerName}
          language={study.reportLanguage}
          onConfirm={sign}
        />
      )}
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
    <div className="flex shrink-0 items-start gap-3 border-b border-border-subtle bg-surface-sunken/50 px-4 py-2.5">
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
      <div
        id="pane-images"
        role="tabpanel"
        aria-labelledby="tab-images"
        className={cn("min-h-0 flex-1", tab !== "images" && "hidden")}
      >
        {viewer}
      </div>
      <div
        id="pane-report"
        role="tabpanel"
        aria-labelledby="tab-report"
        className={cn("min-h-0 flex-1", tab !== "report" && "hidden")}
      >
        {report}
      </div>
    </div>
  );
}
