"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  CloudOff,
  Keyboard,
  Loader2,
  Maximize2,
  Minimize2,
  Search,
} from "lucide-react";
import * as React from "react";

import {
  DOCUMENT_TEXT_CLASSES,
  sectionExtensions,
} from "@/components/editor/extensions";
import { FindBar } from "@/components/editor/find-bar";
import {
  countWords,
  isSectionEmpty,
  REPORT_SECTIONS,
  type ReportSections,
  type SectionKey,
} from "@/components/editor/sections";
import { FormatToolbar } from "@/components/editor/format-toolbar";
import {
  adjacentField,
  bindSectionLeave,
  type Direction,
  focusNow,
  type LeaveReason,
  selectField,
} from "@/components/editor/navigation";
import { reviewReport } from "@/components/editor/review";
import { ReviewList } from "@/components/editor/review-list";
import { ShortcutsDialog } from "@/components/editor/shortcuts-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AutosaveState } from "@/hooks/use-autosave";
import { cn } from "@/lib/utils";

export {
  countWords,
  EMPTY_REPORT_SECTIONS,
  isSectionEmpty,
  missingRequiredSections,
  REPORT_SECTIONS,
  type ReportSections,
  type SectionKey,
} from "@/components/editor/sections";

/** État de la sauvegarde automatique — voir `useAutosave`. */
export type SaveState = AutosaveState;

/**
 * Une section du compte-rendu.
 *
 * Chaque section est un éditeur indépendant, ce qui colle au modèle de
 * données — `sections` est un objet, pas un document unique — et permet à
 * un modèle de n'en pré-remplir qu'une partie. Un document unique
 * obligerait à analyser des titres pour retrouver les mêmes découpages.
 */
function Section({
  id,
  title,
  placeholder,
  required,
  value,
  readOnly,
  onFocus,
  onChange,
  onReady,
  onLeave,
}: {
  id: string;
  title: string;
  placeholder: string;
  required: boolean;
  value: string;
  readOnly: boolean;
  onFocus: (editor: Editor) => void;
  onChange: (html: string) => void;
  /** Reçoit l'éditeur une fois créé, `null` à sa destruction. */
  onReady: (editor: Editor | null) => void;
  /** Le curseur quitte la section par un bord — voir `navigation.ts`. */
  onLeave: (direction: Direction, reason: LeaveReason) => boolean;
}) {
  const editor = useEditor({
    extensions: sectionExtensions({ placeholder, commands: !readOnly }),
    content: value,
    editable: !readOnly,
    // Le rendu initial se fait côté client : Tiptap manipule le DOM, et
    // le pré-rendre côté serveur produirait une divergence d'hydratation.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "outline-none",
          DOCUMENT_TEXT_CLASSES,
          // Le texte de substitution disparaît dès la première frappe.
          "[&_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_p.is-editor-empty:first-child::before]:float-left",
          "[&_p.is-editor-empty:first-child::before]:h-0",
          "[&_p.is-editor-empty:first-child::before]:text-tertiary",
          "[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        ),
        // Correcteur du navigateur, en français : une faute d'orthographe
        // dans un document signé engage aussi son signataire.
        spellcheck: "true",
        lang: "fr",
        "aria-label": title,
      },
    },
    onFocus: ({ editor: focused }) => onFocus(focused),
    onUpdate: ({ editor: updated }) => onChange(updated.getHTML()),
  });

  // `editable` n'est lu qu'à la création de l'éditeur : sans cette
  // synchronisation, un compte-rendu signé sous les yeux du radiologue
  // resterait modifiable à l'écran, et les frappes suivantes seraient
  // perdues — l'enregistrement automatique, lui, est bien suspendu.
  React.useEffect(() => {
    if (!editor || editor.isEditable === !readOnly) return;
    // `false` : ne pas émettre d'update, qui passerait pour une frappe de
    // l'utilisateur et déclencherait un enregistrement fantôme.
    editor.setEditable(!readOnly, false);
  }, [editor, readOnly]);

  React.useEffect(() => {
    if (!editor) return;
    onReady(editor);
    return () => onReady(null);
  }, [editor, onReady]);

  React.useEffect(() => {
    if (!editor) return;
    bindSectionLeave(editor, onLeave);
    return () => bindSectionLeave(editor, null);
  }, [editor, onLeave]);

  const empty = editor?.isEmpty ?? true;

  return (
    <section
      id={id}
      className="scroll-mt-4 border-b border-border-subtle px-5 py-5 last:border-b-0 sm:px-10 sm:py-6"
    >
      <h3 className="label-eyebrow mb-2 flex items-center gap-1.5">
        {title}
        {required && empty && (
          <span
            className="size-1 rounded-full bg-urgent"
            title="Section obligatoire pour signer"
            aria-label="Section obligatoire, actuellement vide"
          />
        )}
      </h3>
      <EditorContent editor={editor} />
    </section>
  );
}

/** Témoin de sauvegarde, discret mais toujours présent. */
function SaveIndicator({ state }: { state: SaveState }) {
  const content = {
    idle: null,
    saving: (
      <>
        <Loader2 className="size-3 animate-spin" aria-hidden />
        Enregistrement…
      </>
    ),
    saved: (
      <>
        <Check className="size-3 text-done" aria-hidden />
        Enregistré
      </>
    ),
    // Vrai désormais : la copie de secours est écrite dans le navigateur
    // à chaque échec, et renvoyée dès que le service répond — voir
    // `ReportWorkspace`.
    offline: (
      <>
        <CloudOff className="size-3 text-progress" aria-hidden />
        Hors ligne — copie gardée sur ce poste
      </>
    ),
    conflict: (
      <>
        <AlertTriangle className="size-3 text-urgent" aria-hidden />
        Modifié dans un autre onglet — rechargez
      </>
    ),
  }[state];

  if (!content) return null;

  return (
    <span
      className="flex items-center gap-1.5 text-2xs text-tertiary"
      // Annoncé sans interrompre : la sauvegarde est une information de
      // fond, pas une alerte.
      role="status"
      aria-live="polite"
    >
      {content}
    </span>
  );
}

/**
 * Sommaire du compte-rendu : une pastille par section.
 *
 * Il répond d'un coup d'œil à la question qu'on se pose avant de signer —
 * *qu'est-ce qui manque ?* — et sert de navigation : un clic amène la
 * section à l'écran. Une section obligatoire encore vide est marquée en
 * rouge, la seule teinte réservée à ce qui bloque.
 */
function Outline({
  sections,
  idPrefix,
}: {
  sections: ReportSections;
  idPrefix: string;
}) {
  // `relative` : les mentions `sr-only` des pastilles sont positionnées en
  // absolu ; sans ancêtre positionné, elles échappaient au défilement de
  // la barre et faisaient déborder toute la page.
  return (
    <nav
      aria-label="Sections du compte-rendu"
      className="relative flex shrink-0 gap-1.5 overflow-x-auto border-b border-border-subtle bg-surface-base px-3 py-2 sm:px-5"
    >
      {REPORT_SECTIONS.map((section) => {
        const filled = !isSectionEmpty(sections[section.key]);
        const blocking = section.required && !filled;
        return (
          <a
            key={section.key}
            href={`#${idPrefix}-${section.key}`}
            onClick={(event) => {
              // Défilement dans le volet, sans toucher à l'adresse.
              event.preventDefault();
              document
                .getElementById(`${idPrefix}-${section.key}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className={cn(
              "flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-2xs font-medium transition-colors",
              filled
                ? "border-done/25 bg-done-muted text-done"
                : blocking
                  ? "border-urgent/25 text-urgent hover:bg-urgent-muted"
                  : "border-border-subtle text-tertiary hover:bg-surface-hover",
            )}
          >
            {filled ? (
              <Check className="size-3" aria-hidden />
            ) : (
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  blocking ? "bg-urgent" : "bg-border-strong",
                )}
                aria-hidden
              />
            )}
            {section.title}
            <span className="sr-only">
              {filled
                ? " — rédigée"
                : blocking
                  ? " — obligatoire, vide"
                  : " — facultative, vide"}
            </span>
          </a>
        );
      })}
    </nav>
  );
}

/** Bouton d'outil de l'éditeur, à droite de la barre. */
function EditorAction({
  icon: Icon,
  label,
  onClick,
  pressed,
  badge = 0,
}: {
  icon: typeof Keyboard;
  label: string;
  onClick: () => void;
  pressed?: boolean;
  /** Pastille de compte — masquée à zéro. */
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-surface-hover hover:text-primary",
        pressed && "bg-accent-muted text-accent",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {badge > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-progress px-1 text-[0.625rem] font-semibold text-surface-base tabular-nums"
          aria-hidden
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/**
 * Éditeur de compte-rendu.
 *
 * **Le document est sombre, et c'est délibéré.** Un traitement de texte
 * classique offre une page blanche ; ici elle éblouirait un radiologue
 * installé dans une pièce assombrie, et dégraderait sa lecture de l'image
 * voisine. Le caractère « document » vient des marges, de la mesure de
 * ligne limitée et du soin typographique, pas de la couleur du papier.
 *
 * **Tout pour rédiger, rien qui ne survive pas à la signature.** La
 * palette — voir `sectionExtensions` — est celle d'un traitement de
 * texte : emphase, surlignage, exposants, sous-titres, listes, tableaux
 * de mesures, signes médicaux, phrases types au « / ». Chaque format a
 * son rendu dans le PDF. La structure, elle, reste fixe : un
 * compte-rendu est un document normalisé.
 *
 * Autour du texte : sommaire des sections (ce qui manque avant de
 * signer), compteur de mots, aide des raccourcis, et un mode plein écran
 * pour rédiger sans le volet d'images.
 *
 * @example
 * ```tsx
 * <ReportEditor
 *   sections={sections}
 *   saveState={saveState}
 *   onChange={(key, html) => patch({ [key]: html })}
 * />
 * ```
 */
export function ReportEditor({
  sections,
  revision = 0,
  saveState = "idle",
  readOnly = false,
  onChange,
  footer,
}: {
  sections: ReportSections;
  /**
   * Révision du contenu. Chaque section ne lit `sections` qu'à sa
   * création : le parent incrémente ce compteur quand il remplace le
   * texte autrement que par la frappe (modèle, copie de secours), et les
   * sections sont recréées sur le nouveau contenu. Les synchroniser à
   * chaque rendu ferait perdre des frappes, une valeur en retard d'un
   * rendu écrasant le texte tout juste saisi.
   */
  revision?: number;
  saveState?: SaveState;
  /** Un compte-rendu signé est verrouillé, en base comme à l'écran. */
  readOnly?: boolean;
  onChange?: (key: SectionKey, html: string) => void;
  footer?: React.ReactNode;
}) {
  // La barre de mise en forme agit sur la section qui a le focus. On
  // retient donc l'éditeur actif plutôt que d'en dupliquer une par
  // section, ce qui encombrerait le document.
  const [focused, setActive] = React.useState<Editor | null>(null);
  // Un éditeur recréé — voir `revision` — laisse l'ancien détruit : la
  // barre ne doit pas agir dessus.
  const active = focused && !focused.isDestroyed ? focused : null;
  const [focusMode, setFocusMode] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  // `null` : barre fermée ; sinon, ouverte avec ou sans remplacement.
  const [find, setFind] = React.useState<null | { replace: boolean }>(null);
  const idPrefix = React.useId().replace(/:/g, "");

  // Les éditeurs des sections, pour la recherche et la navigation au
  // clavier d'une section à l'autre.
  const editorsRef = React.useRef(new Map<SectionKey, Editor>());
  const readyHandlers = React.useMemo(
    () =>
      Object.fromEntries(
        REPORT_SECTIONS.map((section) => [
          section.key,
          (editor: Editor | null) => {
            if (editor) editorsRef.current.set(section.key, editor);
            else editorsRef.current.delete(section.key);
          },
        ]),
      ) as Record<SectionKey, (editor: Editor | null) => void>,
    [],
  );
  const orderedEditors = React.useCallback(
    () =>
      REPORT_SECTIONS.map((section) =>
        editorsRef.current.get(section.key),
      ).filter((editor): editor is Editor => Boolean(editor)),
    [],
  );

  /**
   * Passe à la section voisine. Par Tab, on s'arrête sur son premier
   * champ à compléter s'il y en a un — sur le dernier en remontant —,
   * sinon en fin de texte, prêt à écrire. Par les flèches, on arrive au
   * bord voisin, comme dans une page continue.
   */
  const leaveHandlers = React.useMemo(
    () =>
      Object.fromEntries(
        REPORT_SECTIONS.map((section, index) => [
          section.key,
          (direction: Direction, reason: LeaveReason) => {
            const target =
              REPORT_SECTIONS[direction === "next" ? index + 1 : index - 1];
            const editor = target && editorsRef.current.get(target.key);
            if (!editor) return false;
            focusNow(editor);
            if (reason === "tab") {
              const field = adjacentField(
                editor,
                direction,
                direction === "next" ? 0 : editor.state.doc.content.size,
              );
              if (field) selectField(editor, field);
              else editor.chain().focus("end").scrollIntoView().run();
            } else {
              editor
                .chain()
                .focus(direction === "next" ? "start" : "end")
                .scrollIntoView()
                .run();
            }
            return true;
          },
        ]),
      ) as Record<
        SectionKey,
        (direction: Direction, reason: LeaveReason) => boolean
      >,
    [],
  );

  const findings = React.useMemo(() => reviewReport(sections), [sections]);

  /** Amène une section à l'écran et y place le curseur. */
  const goToSection = React.useCallback(
    (key: SectionKey) => {
      setReviewOpen(false);
      document
        .getElementById(`${idPrefix}-${key}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      editorsRef.current.get(key)?.commands.focus("end");
    },
    [idPrefix],
  );

  // Ctrl/⌘ F : rechercher ; Ctrl+H : remplacer. Interceptés seulement
  // quand le focus est dans le compte-rendu — ailleurs, la recherche du
  // navigateur garde son rôle.
  const onKeyDownCapture = (event: React.KeyboardEvent) => {
    // Sans Maj : Ctrl+Maj+H surligne, il ne doit pas ouvrir le remplacement.
    if (
      readOnly ||
      !(event.metaKey || event.ctrlKey) ||
      event.altKey ||
      event.shiftKey
    )
      return;
    const key = event.key.toLowerCase();
    if (key === "f" || (key === "h" && event.ctrlKey && !event.metaKey)) {
      event.preventDefault();
      setFind({ replace: key === "h" });
    }
  };

  const words = REPORT_SECTIONS.reduce(
    (total, section) => total + countWords(sections[section.key] ?? ""),
    0,
  );

  // Échap quitte le plein écran — sauf si un menu ou une boîte de
  // dialogue est ouvert : c'est alors à lui de se fermer.
  React.useEffect(() => {
    if (!focusMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector("[role=dialog], [role=menu], [role=listbox]"))
        return;
      setFocusMode(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusMode]);

  return (
    <div
      onKeyDownCapture={onKeyDownCapture}
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-surface-base",
        // Plein écran : le document seul, au-dessus de tout le reste.
        focusMode && "fixed inset-0 z-40",
      )}
    >
      {!readOnly && (
        <FormatToolbar editor={active}>
          <SaveIndicator state={saveState} />
          {footer}
          <span className="hidden px-1.5 text-2xs text-tertiary tabular-nums xl:inline">
            {words} mot{words > 1 ? "s" : ""}
          </span>
          <EditorAction
            icon={Search}
            label="Rechercher et remplacer (Ctrl+F)"
            pressed={find !== null}
            onClick={() =>
              setFind((open) => (open ? null : { replace: false }))
            }
          />
          <EditorAction
            icon={ClipboardCheck}
            label={
              findings.length
                ? `Relecture : ${findings.length} point${findings.length > 1 ? "s" : ""} à vérifier`
                : "Relecture : rien à signaler"
            }
            badge={findings.length}
            onClick={() => setReviewOpen(true)}
          />
          <EditorAction
            icon={Keyboard}
            label="Raccourcis clavier"
            onClick={() => setHelpOpen(true)}
          />
          <EditorAction
            icon={focusMode ? Minimize2 : Maximize2}
            label={
              focusMode ? "Quitter le plein écran" : "Rédiger en plein écran"
            }
            pressed={focusMode}
            onClick={() => setFocusMode((value) => !value)}
          />
        </FormatToolbar>
      )}
      {!readOnly && find && (
        <FindBar
          editors={orderedEditors}
          withReplace={find.replace}
          onToggleReplace={() =>
            setFind((open) => open && { replace: !open.replace })
          }
          onClose={() => {
            setFind(null);
            // Retour au texte, là où l'on rédigeait.
            active?.commands.focus();
          }}
        />
      )}
      {!readOnly && <Outline sections={sections} idPrefix={idPrefix} />}

      <div className="min-h-0 flex-1 overflow-auto px-3 py-4 sm:px-5 sm:py-6">
        {/* La « feuille » : une surface élevée, centrée, détachée de son
            fond sur les quatre côtés. C'est ce détachement, autant que
            les marges intérieures, qui donne l'impression de document. */}
        <div className="mx-auto max-w-3xl rounded-xl border border-border-subtle bg-surface-raised shadow-raised">
          {REPORT_SECTIONS.map((section) => (
            <Section
              key={`${section.key}:${revision}`}
              id={`${idPrefix}-${section.key}`}
              title={section.title}
              placeholder={section.placeholder}
              required={section.required}
              value={sections[section.key] ?? ""}
              readOnly={readOnly}
              onFocus={setActive}
              onChange={(html) => onChange?.(section.key, html)}
              onReady={readyHandlers[section.key]}
              onLeave={leaveHandlers[section.key]}
            />
          ))}
        </div>
        {!readOnly && (
          <p className="mx-auto mt-3 max-w-3xl px-1 text-2xs text-tertiary">
            Tapez{" "}
            <kbd className="rounded border border-border-subtle px-1 font-sans">
              /
            </kbd>{" "}
            en début de ligne pour insérer une phrase type, un sous-titre ou un
            tableau de mesures ;{" "}
            <kbd className="rounded border border-border-subtle px-1 font-sans">
              Tab
            </kbd>{" "}
            pour passer au champ à compléter suivant, puis à la section
            suivante.
          </p>
        )}
      </div>

      <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relecture</DialogTitle>
            <DialogDescription>
              {findings.length
                ? "Points à vérifier avant de signer. Ce sont des signalements, pas des erreurs certaines : vous restez seul juge de votre texte."
                : "Rien à signaler : latéralité cohérente, aucun champ de modèle oublié, mesures avec leur unité."}
            </DialogDescription>
          </DialogHeader>
          {findings.length > 0 && (
            <ReviewList
              findings={findings}
              onGo={goToSection}
              className="max-h-[60vh] overflow-auto px-3 pb-4"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
