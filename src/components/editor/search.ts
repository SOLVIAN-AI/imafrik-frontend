import { Extension, type Editor } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Recherche et remplacement dans une section du compte-rendu.
 *
 * Les occurrences sont **surlignées par des décorations** ProseMirror :
 * elles se dessinent par-dessus le texte sans le modifier. Ni l'historique
 * d'annulation, ni l'enregistrement automatique, ni le document signé ne
 * les voient — un surlignage de recherche n'a rien à faire dans un PDF.
 *
 * La barre de recherche (`FindBar`) pilote les cinq sections à la fois ;
 * chacune ne connaît que ses propres occurrences.
 */

/** Une occurrence : positions ProseMirror de début et de fin. */
export interface Range {
  from: number;
  to: number;
}

/** Critères de recherche. */
export interface SearchQuery {
  text: string;
  caseSensitive: boolean;
}

/**
 * Normalise un texte pour une comparaison insensible à la casse.
 *
 * `toLocaleLowerCase` peut changer la longueur d'une chaîne (« İ » turc) ;
 * on compare donc caractère par caractère, en ne gardant la minuscule que
 * si elle a la même longueur — ce qui préserve la correspondance entre
 * index du texte et positions du document.
 */
function fold(text: string): string {
  let folded = "";
  for (const char of text) {
    const lower = char.toLocaleLowerCase("fr");
    folded += lower.length === char.length ? lower : char;
  }
  return folded;
}

/**
 * Parcourt les blocs de texte d'un document, avec la position de chaque
 * caractère.
 *
 * Une occurrence peut traverser des marques (« **foie** hétérogène »)
 * mais jamais un saut de paragraphe — c'est le comportement de tout
 * traitement de texte. Un nœud en ligne qui n'est pas du texte (saut de
 * ligne) devient un caractère nul, introuvable.
 *
 * @param doc   Document ProseMirror.
 * @param visit Reçoit le texte du bloc et la position de chaque caractère.
 */
function eachTextblock(
  doc: PMNode,
  visit: (text: string, positions: number[]) => void,
) {
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    let text = "";
    const positions: number[] = [];
    node.forEach((child, offset) => {
      const start = pos + 1 + offset;
      if (child.isText) {
        const value = child.text ?? "";
        for (let index = 0; index < value.length; index += 1) {
          text += value[index];
          positions.push(start + index);
        }
      } else {
        text += "\u0000";
        positions.push(start);
      }
    });
    visit(text, positions);
    return false;
  });
}

/** Convertit un intervalle du texte d'un bloc en positions du document. */
const toRange = (positions: number[], index: number, length: number) => ({
  from: positions[index],
  to: positions[index + length - 1] + 1,
});

/**
 * Occurrences d'un texte dans un document.
 *
 * @param doc   Document ProseMirror.
 * @param query Critères ; un texte vide ne trouve rien.
 * @returns Les occurrences, dans l'ordre du document, sans chevauchement.
 */
export function findInDoc(doc: PMNode, query: SearchQuery): Range[] {
  const needle = query.caseSensitive ? query.text : fold(query.text);
  if (!needle) return [];
  const ranges: Range[] = [];
  eachTextblock(doc, (text, positions) => {
    const haystack = query.caseSensitive ? text : fold(text);
    let index = haystack.indexOf(needle);
    while (index !== -1) {
      ranges.push(toRange(positions, index, needle.length));
      index = haystack.indexOf(needle, index + needle.length);
    }
  });
  return ranges;
}

/**
 * Champs à compléter d'un modèle : un texte entre crochets, par exemple
 * « [taille] » ou « [segment] ».
 *
 * C'est la convention des modèles de compte-rendu : la touche Tab saute
 * d'un champ au suivant et le sélectionne, la frappe le remplace.
 */
export const FIELD_PATTERN = /\[[^\]\n\u0000]{1,60}\]/g;

/**
 * Champs à compléter d'un document.
 *
 * @param doc Document ProseMirror.
 * @returns Les champs, dans l'ordre du document.
 */
export function findFields(doc: PMNode): Range[] {
  const ranges: Range[] = [];
  eachTextblock(doc, (text, positions) => {
    for (const match of text.matchAll(FIELD_PATTERN)) {
      ranges.push(toRange(positions, match.index, match[0].length));
    }
  });
  return ranges;
}

/** État du greffon : critères, occurrence active, décorations. */
interface SearchState {
  query: SearchQuery;
  /** Index de l'occurrence active dans cette section, ou -1. */
  active: number;
  decorations: DecorationSet;
}

/** Méta-donnée d'une transaction qui change la recherche. */
interface SearchMeta {
  query: SearchQuery;
  active: number;
}

export const searchKey = new PluginKey<SearchState>("reportSearch");

function decorate(doc: PMNode, query: SearchQuery, active: number) {
  const ranges = findInDoc(doc, query);
  return DecorationSet.create(
    doc,
    ranges.map((range, index) =>
      Decoration.inline(range.from, range.to, {
        class:
          index === active
            ? "search-match search-match-active"
            : "search-match",
      }),
    ),
  );
}

const EMPTY_QUERY: SearchQuery = { text: "", caseSensitive: false };

/** Extension Tiptap : surligne les occurrences de la recherche en cours. */
export const SearchHighlight = Extension.create({
  name: "reportSearch",
  addProseMirrorPlugins() {
    return [
      new Plugin<SearchState>({
        key: searchKey,
        state: {
          init: () => ({
            query: EMPTY_QUERY,
            active: -1,
            decorations: DecorationSet.empty,
          }),
          apply(tr, previous, _old, state) {
            const meta = tr.getMeta(searchKey) as SearchMeta | undefined;
            if (meta) {
              return {
                ...meta,
                decorations: decorate(state.doc, meta.query, meta.active),
              };
            }
            if (!tr.docChanged || !previous.query.text) return previous;
            return {
              ...previous,
              decorations: decorate(state.doc, previous.query, previous.active),
            };
          },
        },
        props: {
          decorations: (state) => searchKey.getState(state)?.decorations,
        },
      }),
    ];
  },
});

/**
 * Applique des critères de recherche à une section.
 *
 * @param editor Éditeur de la section.
 * @param query  Critères ; un texte vide efface le surlignage.
 * @param active Index de l'occurrence active dans cette section, ou -1.
 */
export function setSearch(editor: Editor, query: SearchQuery, active = -1) {
  const meta: SearchMeta = { query, active };
  // `addToHistory: false` : changer de recherche n'est pas une
  // modification qu'un Ctrl+Z devrait défaire.
  editor.view.dispatch(
    editor.state.tr.setMeta(searchKey, meta).setMeta("addToHistory", false),
  );
}

/**
 * Remplace des occurrences dans une section, en une seule transaction —
 * donc un seul Ctrl+Z pour tout défaire.
 *
 * Les occurrences sont traitées de la dernière à la première : remplacer
 * la première décalerait les positions des suivantes. Le texte de
 * remplacement reprend les marques du texte remplacé (gras, surligné…).
 *
 * @param editor      Éditeur de la section.
 * @param ranges      Occurrences à remplacer.
 * @param replacement Texte de remplacement ; vide pour supprimer.
 */
export function replaceRanges(
  editor: Editor,
  ranges: Range[],
  replacement: string,
) {
  if (ranges.length === 0 || !editor.isEditable) return;
  const tr = editor.state.tr;
  for (const range of [...ranges].sort((a, b) => b.from - a.from)) {
    if (replacement) {
      const marks = editor.state.doc.resolve(range.from + 1).marks();
      tr.replaceWith(
        range.from,
        range.to,
        editor.schema.text(replacement, marks),
      );
    } else {
      tr.delete(range.from, range.to);
    }
  }
  editor.view.dispatch(tr);
}
