"use client";

import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Check, CloudOff, Loader2 } from "lucide-react";
import * as React from "react";

import { FormatToolbar } from "@/components/editor/format-toolbar";
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
    placeholder: "Motif de l'examen, renseignement clinique transmis…",
    required: true,
  },
  {
    key: "technique",
    title: "Technique",
    placeholder: "Protocole d'acquisition, injection, reconstructions…",
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

/** État de la sauvegarde automatique, tel qu'affiché à l'utilisateur. */
export type SaveState = "idle" | "saving" | "saved" | "offline";

/**
 * Extensions communes à toutes les sections.
 *
 * Volontairement réduites. Un compte-rendu médical est un document
 * normalisé : titres, polices et couleurs libres produiraient des
 * documents hétérogènes là où l'uniformité fait la lisibilité — et le
 * PDF final impose de toute façon sa mise en page.
 *
 * Tout ce que la barre d'outils n'expose pas est désactivé — titres,
 * blocs de code, citations, liens, barré. Ces marques resteraient
 * atteignables au collage ou au raccourci clavier, et produiraient des
 * comptes-rendus qu'on ne saurait ni relire ni convertir en PDF de façon
 * homogène.
 *
 * Le soulignement, lui, n'est **pas** ajouté ici : StarterKit le fournit
 * déjà. L'importer en plus déclare deux extensions du même nom, ce que
 * Tiptap signale et qui déstabilise l'éditeur.
 *
 * @param placeholder Texte de substitution propre à la section.
 */
function sectionExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      code: false,
      horizontalRule: false,
      blockquote: false,
      link: false,
      strike: false,
    }),
    // L'alignement ne porte que sur les paragraphes : c'est le seul bloc
    // que le document autorise.
    TextAlign.configure({ types: ["paragraph"], defaultAlignment: "left" }),
    Placeholder.configure({ placeholder }),
    CharacterCount,
  ];
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
  title,
  placeholder,
  required,
  value,
  readOnly,
  onFocus,
  onChange,
}: {
  title: string;
  placeholder: string;
  required: boolean;
  value: string;
  readOnly: boolean;
  onFocus: (editor: Editor) => void;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: sectionExtensions(placeholder),
    content: value,
    editable: !readOnly,
    // Le rendu initial se fait côté client : Tiptap manipule le DOM, et
    // le pré-rendre côté serveur produirait une divergence d'hydratation.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "outline-none",
          // Mesure de ligne limitée : au-delà d'environ 70 caractères,
          // l'œil perd la ligne suivante en revenant à la marge.
          "max-w-[68ch]",
          "text-[0.9375rem] leading-[1.75]",
          "[&_p]:min-h-[1.75em]",
          // Un interligne entre paragraphes, jamais d'alinéa : c'est la
          // convention du document administratif et médical français.
          "[&_p+p]:mt-3",
          "[&_strong]:font-semibold",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
          // Le texte de substitution disparaît dès la première frappe.
          "[&_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_p.is-editor-empty:first-child::before]:float-left",
          "[&_p.is-editor-empty:first-child::before]:h-0",
          "[&_p.is-editor-empty:first-child::before]:text-tertiary",
          "[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
        ),
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
    <section className="border-b border-border-subtle px-10 py-6 last:border-b-0">
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
    offline: (
      <>
        <CloudOff className="size-3 text-progress" aria-hidden />
        Hors ligne — conservé sur ce poste
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
 * Éditeur de compte-rendu.
 *
 * **Le document est sombre, et c'est délibéré.** Un traitement de texte
 * classique offre une page blanche ; ici elle éblouirait un radiologue
 * installé dans une pièce assombrie, et dégraderait sa lecture de l'image
 * voisine. Le caractère « document » ne vient pas de la couleur du
 * papier : il vient des marges généreuses, de la mesure de ligne limitée
 * et du soin typographique — c'est ce qui est reproduit ici.
 *
 * La mise en forme reste minimale et la structure fixe : un compte-rendu
 * est un document normalisé, et le PDF final impose sa propre mise en
 * page. Ce que le radiologue contrôle, c'est l'emphase et l'alignement
 * de son texte — pas la maquette.
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

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface-base">
      <FormatToolbar editor={readOnly ? null : active}>
        <SaveIndicator state={saveState} />
        {footer}
      </FormatToolbar>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-6">
        {/* La « feuille » : une surface élevée, centrée, détachée de son
            fond sur les quatre côtés. C'est ce détachement, autant que
            les marges intérieures, qui donne l'impression de document. */}
        <div className="mx-auto max-w-3xl rounded-xl border border-border-subtle bg-surface-raised shadow-raised">
          {REPORT_SECTIONS.map((section) => (
            <Section
              key={section.key}
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
      </div>
    </div>
  );
}
