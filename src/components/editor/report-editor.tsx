"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import {
  AlertTriangle,
  Check,
  CloudOff,
  Keyboard,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import * as React from "react";

import {
  DOCUMENT_TEXT_CLASSES,
  sectionExtensions,
} from "@/components/editor/extensions";
import { FormatToolbar } from "@/components/editor/format-toolbar";
import { ShortcutsDialog } from "@/components/editor/shortcuts-dialog";
import type { AutosaveState } from "@/hooks/use-autosave";
import { cn } from "@/lib/utils";

/**
 * Sections d'un compte-rendu, dans l'ordre où elles sont dictées.
 *
 * Cet ordre est celui de la pratique radiologique, pas un choix
 * d'interface : on rappelle la question posée, on dit comment on a
 * regardé, on compare à l'antérieur, on décrit, puis on conclut. Les
 * clés correspondent exactement au champ `sections` du schéma.
 */
export const REPORT_SECTIONS = [
  {
    key: "indication",
    title: "Indication clinique",
    placeholder: "Motif de l’examen, renseignement clinique transmis…",
    required: true,
  },
  {
    key: "technique",
    title: "Technique",
    placeholder: "Protocole d’acquisition, injection, reconstructions…",
    required: false,
  },
  {
    key: "comparatif",
    title: "Comparatif",
    placeholder: "Examens antérieurs disponibles, ou absence de comparatif…",
    required: false,
  },
  {
    key: "resultats",
    title: "Résultats",
    placeholder: "Description par organe…",
    required: true,
  },
  {
    key: "conclusion",
    title: "Conclusion",
    placeholder: "Synthèse diagnostique.",
    required: true,
  },
] as const;

export type SectionKey = (typeof REPORT_SECTIONS)[number]["key"];
export type ReportSections = Record<SectionKey, string>;

/** Un compte-rendu vierge : toutes les sections présentes, toutes vides. */
export const EMPTY_REPORT_SECTIONS: ReportSections = Object.fromEntries(
  REPORT_SECTIONS.map((section) => [section.key, ""]),
) as ReportSections;

/**
 * Indique si une section est vide de tout texte.
 *
 * L'éditeur ne rend jamais une chaîne vide : une section dans laquelle on
 * a seulement cliqué vaut `<p></p>`. Comparer à `""` laisserait donc
 * signer un compte-rendu sans conclusion.
 *
 * @param html Contenu HTML de la section.
 * @returns `true` s'il ne reste aucun caractère une fois le balisage ôté.
 */
export function isSectionEmpty(html: string | undefined): boolean {
  if (!html) return true;
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length === 0
  );
}

/**
 * Liste les sections obligatoires encore vides.
 *
 * Signer engage la responsabilité du radiologue : le contrôle est fait
 * ici, à l'écran, pour qu'il soit expliqué avant l'envoi — et refait côté
 * serveur, parce qu'un contrôle d'interface n'est pas une garantie.
 *
 * @param sections Contenu courant du compte-rendu.
 * @returns Les intitulés manquants, dans l'ordre du document.
 */
export function missingRequiredSections(sections: ReportSections): string[] {
  return REPORT_SECTIONS.filter(
    (section) => section.required && isSectionEmpty(sections[section.key]),
  ).map((section) => section.title);
}

/** État de la sauvegarde automatique — voir `useAutosave`. */
export type SaveState = AutosaveState;

/** Nombre de mots d'un fragment HTML — pour le compteur du document. */
export function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

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
}: {
  id: string;
  title: string;
  placeholder: string;
  required: boolean;
  value: string;
  readOnly: boolean;
  onFocus: (editor: Editor) => void;
  onChange: (html: string) => void;
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
}: {
  icon: typeof Keyboard;
  label: string;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-surface-hover hover:text-primary"
    >
      <Icon className="size-4" aria-hidden />
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
  saveState = "idle",
  readOnly = false,
  onChange,
  footer,
}: {
  sections: ReportSections;
  saveState?: SaveState;
  /** Un compte-rendu signé est verrouillé, en base comme à l'écran. */
  readOnly?: boolean;
  onChange?: (key: SectionKey, html: string) => void;
  footer?: React.ReactNode;
}) {
  // La barre de mise en forme agit sur la section qui a le focus. On
  // retient donc l'éditeur actif plutôt que d'en dupliquer une par
  // section, ce qui encombrerait le document.
  const [active, setActive] = React.useState<Editor | null>(null);
  const [focusMode, setFocusMode] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const idPrefix = React.useId().replace(/:/g, "");

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
      {!readOnly && <Outline sections={sections} idPrefix={idPrefix} />}

      <div className="min-h-0 flex-1 overflow-auto px-3 py-4 sm:px-5 sm:py-6">
        {/* La « feuille » : une surface élevée, centrée, détachée de son
            fond sur les quatre côtés. C'est ce détachement, autant que
            les marges intérieures, qui donne l'impression de document. */}
        <div className="mx-auto max-w-3xl rounded-xl border border-border-subtle bg-surface-raised shadow-raised">
          {REPORT_SECTIONS.map((section) => (
            <Section
              key={section.key}
              id={`${idPrefix}-${section.key}`}
              title={section.title}
              placeholder={section.placeholder}
              required={section.required}
              value={sections[section.key] ?? ""}
              readOnly={readOnly}
              onFocus={setActive}
              onChange={(html) => onChange?.(section.key, html)}
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
            tableau de mesures.
          </p>
        )}
      </div>

      <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
