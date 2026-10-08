import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { Extension, type Editor } from "@tiptap/react";

import { findFields, type Range } from "@/components/editor/search";

/**
 * Une feuille continue, au clavier.
 *
 * Les cinq sections sont des éditeurs distincts — c'est le modèle de
 * données, et celui du document signé. Mais la rédaction, elle, ne doit
 * pas buter sur leurs bords : on descend d'une section à l'autre avec les
 * flèches, comme dans une seule page, et la touche Tab enchaîne les
 * champs à compléter des modèles — « [taille] », « [segment] » — puis
 * les sections. C'est le geste des meilleurs outils de compte-rendu : on
 * tape, Tab, on tape, sans jamais reprendre la souris.
 */

/** Sens d'un déplacement entre sections. */
export type Direction = "next" | "previous";

/** Ce qui a provoqué le déplacement. */
export type LeaveReason = "arrow" | "tab";

/**
 * Appelé quand le curseur quitte la section par un bord.
 *
 * @returns `true` si un déplacement a eu lieu ; sinon la touche garde son
 *          comportement habituel.
 */
export type LeaveHandler = (
  direction: Direction,
  reason: LeaveReason,
) => boolean;

/**
 * Stockage de l'extension : le rappel de sortie y est déposé **après**
 * la création de l'éditeur (voir `bindSectionLeave`). Les options, elles,
 * sont figées à la création — un rappel passé là serait périmé au
 * premier rendu suivant.
 */
interface NavigationStorage {
  onLeave: LeaveHandler | null;
}

declare module "@tiptap/core" {
  interface Storage {
    sectionNavigation: NavigationStorage;
  }
}

/**
 * Branche le rappel de sortie d'une section.
 *
 * @param editor  Éditeur de la section.
 * @param onLeave Rappel, ou `null` pour le débrancher.
 */
export function bindSectionLeave(editor: Editor, onLeave: LeaveHandler | null) {
  const storage = editor.storage.sectionNavigation;
  if (storage) storage.onLeave = onLeave;
}

/**
 * Prochain champ à compléter après une position, ou le précédent avant
 * elle.
 *
 * @param editor    Éditeur de la section.
 * @param direction Sens de recherche.
 * @param from      Position de départ ; par défaut, la sélection.
 */
export function adjacentField(
  editor: Editor,
  direction: Direction,
  from?: number,
): Range | null {
  const fields = findFields(editor.state.doc);
  const { selection } = editor.state;
  if (direction === "next") {
    const start = from ?? selection.to;
    return fields.find((field) => field.from >= start) ?? null;
  }
  const end = from ?? selection.from;
  return fields.findLast((field) => field.to <= end) ?? null;
}

/**
 * Sélectionne un champ et l'amène à l'écran : la frappe suivante le
 * remplace.
 */
export function selectField(editor: Editor, field: Range) {
  focusNow(editor);
  editor.chain().focus().setTextSelection(field).scrollIntoView().run();
}

/**
 * Donne le focus à une section **immédiatement**.
 *
 * La commande `focus` de Tiptap attend l'image suivante : une frappe
 * rapide — Tab, Tab — partirait entre-temps dans la section qu'on vient
 * de quitter. Le focus du DOM est donc posé tout de suite.
 */
export function focusNow(editor: Editor) {
  if (!editor.view.hasFocus()) editor.view.focus();
}

/** Vrai si une liste ou un tableau réserve Tab à son propre usage. */
function keysTakenByStructure(editor: Editor): boolean {
  return editor.isActive("listItem") || editor.isActive("table");
}

/**
 * Extension de navigation d'une section.
 *
 * Priorité basse : le menu « / » et les listes traitent leurs touches
 * d'abord — Tab indente une puce, les flèches parcourent le menu.
 */
export const SectionNavigation = Extension.create<
  Record<string, never>,
  NavigationStorage
>({
  name: "sectionNavigation",
  priority: 50,

  addStorage() {
    return { onLeave: null };
  },

  // Les champs à compléter se voient comme des champs : une pastille
  // pointillée, par décoration — le texte enregistré reste « [taille] ».
  addProseMirrorPlugins() {
    const decorate = (doc: Parameters<typeof findFields>[0]) =>
      DecorationSet.create(
        doc,
        findFields(doc).map((field) =>
          Decoration.inline(field.from, field.to, { class: "report-field" }),
        ),
      );
    return [
      new Plugin<DecorationSet>({
        key: new PluginKey("reportFields"),
        state: {
          init: (_config, state) => decorate(state.doc),
          apply: (tr, previous) =>
            tr.docChanged ? decorate(tr.doc) : previous,
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    const leave: LeaveHandler = (direction, reason) =>
      // Lu sur l'éditeur, là où `bindSectionLeave` l'a déposé.
      this.editor.storage.sectionNavigation?.onLeave?.(direction, reason) ??
      false;
    const atEdge = (editor: Editor, direction: Direction) => {
      const { state, view } = editor;
      if (!state.selection.empty) return false;
      const block = state.selection.$head.index(0);
      const edgeBlock = direction === "next" ? state.doc.childCount - 1 : 0;
      return (
        block === edgeBlock &&
        view.endOfTextblock(direction === "next" ? "down" : "up")
      );
    };

    return {
      ArrowDown: ({ editor }) =>
        atEdge(editor, "next") && leave("next", "arrow"),
      ArrowUp: ({ editor }) =>
        atEdge(editor, "previous") && leave("previous", "arrow"),
      Tab: ({ editor }) => {
        if (keysTakenByStructure(editor)) return false;
        const field = adjacentField(editor, "next");
        if (field) {
          selectField(editor, field);
          return true;
        }
        leave("next", "tab");
        // Toujours consommée : sortir de l'éditeur par Tab ferait perdre
        // le fil de la rédaction au premier appui de trop.
        return true;
      },
      "Shift-Tab": ({ editor }) => {
        if (keysTakenByStructure(editor)) return false;
        const field = adjacentField(editor, "previous");
        if (field) {
          selectField(editor, field);
          return true;
        }
        leave("previous", "tab");
        return true;
      },
    };
  },
});
