"use client";

import Suggestion, {
  exitSuggestion,
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";
import {
  Extension,
  ReactRenderer,
  type Editor,
  type Range,
} from "@tiptap/react";
import {
  Heading3,
  List,
  ListOrdered,
  MessageSquareQuote,
  Pilcrow,
  Table,
  type LucideIcon,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/** Une entrée du menu « / ». */
export interface SlashItem {
  id: string;
  group: "Structure" | "Phrases types";
  title: string;
  hint?: string;
  /** Mots supplémentaires reconnus par le filtre. */
  keywords?: string;
  icon: LucideIcon;
  run: (editor: Editor, range: Range) => void;
}

/** Insère une phrase type, suivie d'une espace, à la place du « /… » tapé. */
function phrase(id: string, text: string, keywords = ""): SlashItem {
  return {
    id,
    group: "Phrases types",
    title: text,
    keywords,
    icon: MessageSquareQuote,
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertContent(`${text} `).run(),
  };
}

/**
 * Contenu du menu.
 *
 * **Phrases types.** L'essentiel d'un compte-rendu décrit ce qui est
 * normal, avec des formules que chaque radiologue écrit vingt fois par
 * jour. Les insérer en trois lettres libère son attention pour ce qui ne
 * l'est pas. Les modèles couvrent les examens entiers ; ces phrases
 * servent à l'intérieur d'un texte déjà commencé.
 *
 * **Structure.** Les blocs qu'on n'atteint pas au clavier sans détour :
 * sous-titre d'organe, listes, tableau de mesures.
 */
export const SLASH_ITEMS: SlashItem[] = [
  {
    id: "subtitle",
    group: "Structure",
    title: "Sous-titre",
    hint: "Un organe, une région",
    keywords: "titre organe heading",
    icon: Heading3,
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    id: "paragraph",
    group: "Structure",
    title: "Paragraphe",
    hint: "Texte courant",
    keywords: "texte normal",
    icon: Pilcrow,
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    id: "bullets",
    group: "Structure",
    title: "Liste à puces",
    keywords: "puces liste",
    icon: List,
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    id: "numbers",
    group: "Structure",
    title: "Liste numérotée",
    keywords: "numeros liste ordre",
    icon: ListOrdered,
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    id: "table",
    group: "Structure",
    title: "Tableau de mesures",
    hint: "3 colonnes, ligne d’en-tête",
    keywords: "tableau mesures dimensions",
    icon: Table,
    run: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  phrase("normal", "Examen sans anomalie significative.", "normal rien"),
  phrase("no-anomaly", "Absence d’anomalie décelable.", "normal"),
  phrase(
    "no-comparison",
    "Absence d’examen antérieur disponible pour comparaison.",
    "comparatif anterieur",
  ),
  phrase(
    "pleura",
    "Absence d’épanchement pleural ou péricardique.",
    "thorax plevre poumon",
  ),
  phrase(
    "mediastinum",
    "Pas d’adénomégalie médiastinale ni hilaire.",
    "thorax ganglion adenopathie",
  ),
  phrase(
    "liver",
    "Foie de taille et de morphologie normales, sans lésion focale.",
    "abdomen hepatique",
  ),
  phrase(
    "biliary",
    "Absence de dilatation des voies biliaires intra- et extra-hépatiques.",
    "abdomen vesicule bile",
  ),
  phrase(
    "kidneys",
    "Reins de taille et de morphologie normales, sans dilatation des cavités pyélocalicielles.",
    "abdomen rein urinaire",
  ),
  phrase(
    "peritoneum",
    "Absence d’épanchement intra-péritonéal.",
    "abdomen ascite liquide",
  ),
  phrase("bones", "Structures osseuses sans lésion suspecte.", "os squelette"),
  phrase(
    "correlation",
    "Confrontation clinico-biologique recommandée.",
    "conclusion clinique",
  ),
  phrase("follow-up", "Contrôle à distance conseillé.", "conclusion suivi"),
  phrase(
    "specialist",
    "Avis spécialisé recommandé.",
    "conclusion chirurgie avis",
  ),
];

/** Normalise pour un filtre insensible à la casse et aux accents. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Entrées correspondant à ce qui a été tapé après « / ». */
export function filterSlashItems(query: string): SlashItem[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return SLASH_ITEMS;
  return SLASH_ITEMS.filter((item) => {
    const haystack = normalize(`${item.title} ${item.keywords ?? ""}`);
    return words.every((word) => haystack.includes(word));
  });
}

/** Ce que le menu expose au plugin : la gestion du clavier. */
interface SlashMenuHandle {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

/**
 * Menu flottant du « / ».
 *
 * Piloté au clavier — flèches, Entrée, Échap — sans que le focus quitte
 * le texte : le radiologue tape « /pleu », Entrée, et continue d'écrire.
 */
const SlashMenu = React.forwardRef<
  SlashMenuHandle,
  SuggestionProps<SlashItem, SlashItem>
>(function SlashMenu({ items, command }, ref) {
  const [selected, setSelected] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [lastItems, setLastItems] = React.useState(items);

  // Nouvelle liste filtrée : la sélection repart du haut. Ajusté pendant
  // le rendu (motif recommandé par React) plutôt que dans un effet.
  if (items !== lastItems) {
    setLastItems(items);
    setSelected(0);
  }

  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${selected}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (items.length === 0) return false;
      if (event.key === "ArrowDown") {
        setSelected((index) => (index + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setSelected((index) => (index - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const item = items[selected];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="w-72 rounded-xl border border-border-default bg-surface-overlay px-3 py-2.5 text-xs text-tertiary shadow-overlay">
        Aucune commande ne correspond.
      </div>
    );
  }

  let lastGroup: SlashItem["group"] | null = null;
  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Insérer"
      className="max-h-80 w-[min(22rem,calc(100vw-2rem))] overflow-auto rounded-xl border border-border-default bg-surface-overlay p-1.5 shadow-overlay animate-[fade-in_100ms_var(--ease-out-quart)]"
    >
      {items.map((item, index) => {
        const heading = item.group !== lastGroup ? item.group : null;
        lastGroup = item.group;
        return (
          <React.Fragment key={item.id}>
            {heading && (
              <p className="label-eyebrow px-2.5 pt-2 pb-1">{heading}</p>
            )}
            <button
              type="button"
              role="option"
              aria-selected={index === selected}
              data-index={index}
              // mousedown : le clic ne doit pas retirer le focus du texte.
              onMouseDown={(event) => {
                event.preventDefault();
                command(item);
              }}
              onMouseMove={() => setSelected(index)}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left",
                index === selected
                  ? "bg-surface-active text-primary"
                  : "text-secondary",
              )}
            >
              <item.icon
                className={cn(
                  "mt-0.5 size-3.5 shrink-0",
                  index === selected ? "text-accent" : "text-tertiary",
                )}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-xs leading-snug">{item.title}</span>
                {item.hint && (
                  <span className="block text-2xs text-tertiary">
                    {item.hint}
                  </span>
                )}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
});

/**
 * Extension Tiptap du menu « / ».
 *
 * Ne se déclenche qu'en début de ligne ou après une espace : « 1/2 » ou
 * « T1/T2 » s'écrivent normalement.
 */
export const SlashCommands = Extension.create({
  name: "slashCommands",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: "/",
        allowSpaces: true,
        items: ({ query }) => filterSlashItems(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let renderer: ReactRenderer<SlashMenuHandle> | null = null;
          let unmount: (() => void) | null = null;
          return {
            onStart: (props) => {
              renderer = new ReactRenderer(SlashMenu, {
                props,
                editor: props.editor,
              });
              const element = renderer.element as HTMLElement;
              element.style.zIndex = "60";
              unmount = props.mount(element);
            },
            onUpdate: (props) => renderer?.updateProps(props),
            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                // Ferme la suggestion elle-même — pas seulement le menu —
                // pour que la frappe suivante ne la rouvre pas.
                exitSuggestion(props.view);
                return true;
              }
              return renderer?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              unmount?.();
              renderer?.destroy();
              renderer = null;
              unmount = null;
            },
          };
        },
      }),
    ];
  },
});
