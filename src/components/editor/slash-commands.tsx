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

import { adjacentField, selectField } from "@/components/editor/navigation";
import { messagesFor } from "@/i18n";
import { REPORT_PHRASES, type ReportPhrase } from "@/lib/data/report-phrases";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/** Groupe d'une entrée du menu « / ». */
export type SlashGroup = "structure" | "phrases";

/** Une entrée du menu « / ». */
export interface SlashItem {
  id: string;
  group: SlashGroup;
  /** Intitulé du groupe, dans la langue de l'utilisateur. */
  groupLabel: string;
  title: string;
  hint?: string;
  /** Mots supplémentaires reconnus par le filtre. */
  keywords?: string;
  icon: LucideIcon;
  run: (editor: Editor, range: Range) => void;
}

/**
 * Insère une phrase type, suivie d'une espace, à la place du « /… » tapé.
 *
 * Une phrase à champs — « mesurant [taille] mm » — sélectionne aussitôt
 * son premier champ : on tape la valeur, Tab mène au suivant.
 *
 * @param phrase     Identifiant, texte et mots-clés de la phrase.
 * @param groupLabel Intitulé du groupe, dans la langue de l'utilisateur.
 */
function phraseItem(
  [id, text, keywords = ""]: ReportPhrase,
  groupLabel: string,
): SlashItem {
  return {
    id,
    group: "phrases",
    groupLabel,
    title: text,
    keywords,
    icon: MessageSquareQuote,
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).insertContent(`${text} `).run();
      const field = adjacentField(editor, "next", range.from);
      if (field) selectField(editor, field);
    },
  };
}

/**
 * Contenu du menu, dans la langue de l'utilisateur.
 *
 * **Phrases types.** L'essentiel d'un compte-rendu décrit ce qui est
 * normal, avec des formules que chaque radiologue écrit vingt fois par
 * jour. Les insérer en trois lettres libère son attention pour ce qui ne
 * l'est pas. Les modèles couvrent les examens entiers ; ces phrases
 * servent à l'intérieur d'un texte déjà commencé.
 *
 * **Structure.** Les blocs qu'on n'atteint pas au clavier sans détour :
 * sous-titre d'organe, listes, tableau de mesures. Leurs intitulés
 * suivent la langue de l'écran ; les phrases types, qui sont du contenu,
 * suivent celle du compte-rendu.
 *
 * @param locale         Langue de l'utilisateur.
 * @param reportLanguage Langue du compte-rendu, celle des phrases insérées.
 */
function buildSlashItems(locale: Locale, reportLanguage: Locale): SlashItem[] {
  const labels = messagesFor(locale).reading.slash;
  const structure = (
    id: keyof typeof labels.items,
    icon: LucideIcon,
    run: SlashItem["run"],
  ): SlashItem => {
    const { title, hint, keywords } = labels.items[id];
    return {
      id,
      group: "structure",
      groupLabel: labels.groups.structure,
      title,
      hint: hint || undefined,
      keywords,
      icon,
      run,
    };
  };
  return [
    structure("subtitle", Heading3, (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
    ),
    structure("paragraph", Pilcrow, (editor, range) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
    ),
    structure("bullets", List, (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    ),
    structure("numbers", ListOrdered, (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    ),
    structure("table", Table, (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
    ),
    ...REPORT_PHRASES[reportLanguage].map((phrase) =>
      phraseItem(phrase, labels.groups.phrases),
    ),
  ];
}

const SLASH_ITEMS_BY_LANGUAGES: Partial<Record<string, SlashItem[]>> = {};

/**
 * Contenu du menu, construit une fois par couple de langues.
 *
 * @param locale         Langue de l'utilisateur.
 * @param reportLanguage Langue du compte-rendu ; celle de l'écran à défaut.
 */
export function slashItems(
  locale: Locale = "fr",
  reportLanguage: Locale = locale,
): SlashItem[] {
  return (SLASH_ITEMS_BY_LANGUAGES[`${locale}:${reportLanguage}`] ??=
    buildSlashItems(locale, reportLanguage));
}

/** Contenu du menu en français, la langue de référence. */
export const SLASH_ITEMS: SlashItem[] = slashItems("fr");

/** Normalise pour un filtre insensible à la casse et aux accents. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Entrées correspondant à ce qui a été tapé après « / ».
 *
 * @param query          Saisie qui suit le « / ».
 * @param locale         Langue de l'utilisateur, français par défaut.
 * @param reportLanguage Langue du compte-rendu ; celle de l'écran à défaut.
 */
export function filterSlashItems(
  query: string,
  locale: Locale = "fr",
  reportLanguage: Locale = locale,
): SlashItem[] {
  const items = slashItems(locale, reportLanguage);
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return items;
  return items.filter((item) => {
    const haystack = normalize(`${item.title} ${item.keywords ?? ""}`);
    return words.every((word) => haystack.includes(word));
  });
}

/** Ce que le menu expose au plugin : la gestion du clavier. */
interface SlashMenuHandle {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

/** Propriétés du menu : celles de la suggestion, plus la langue. */
type SlashMenuProps = SuggestionProps<SlashItem, SlashItem> & {
  locale: Locale;
};

/** Options de l'extension. */
interface SlashCommandsOptions {
  /** Langue de l'utilisateur, celle des intitulés du menu. */
  locale: Locale;
  /** Langue du compte-rendu, celle des phrases insérées. */
  reportLanguage: Locale;
}

/**
 * Menu flottant du « / ».
 *
 * Piloté au clavier — flèches, Entrée, Échap — sans que le focus quitte
 * le texte : le radiologue tape « /pleu », Entrée, et continue d'écrire.
 */
const SlashMenu = React.forwardRef<SlashMenuHandle, SlashMenuProps>(
  function SlashMenu({ items, command, locale }, ref) {
    const labels = messagesFor(locale).reading.slash;
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
          {labels.noMatch}
        </div>
      );
    }

    let lastGroup: SlashGroup | null = null;
    return (
      <div
        ref={listRef}
        role="listbox"
        aria-label={labels.insert}
        className="max-h-80 w-[min(22rem,calc(100vw-2rem))] overflow-auto rounded-xl border border-border-default bg-surface-overlay p-1.5 shadow-overlay animate-[fade-in_100ms_var(--ease-out-quart)]"
      >
        {items.map((item, index) => {
          const heading = item.group !== lastGroup ? item.groupLabel : null;
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
                  <span className="block text-xs leading-snug">
                    {item.title}
                  </span>
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
  },
);

/**
 * Extension Tiptap du menu « / ».
 *
 * Ne se déclenche qu'en début de ligne ou après une espace : « 1/2 » ou
 * « T1/T2 » s'écrivent normalement.
 */
export const SlashCommands = Extension.create<SlashCommandsOptions>({
  name: "slashCommands",

  addOptions() {
    return { locale: "fr", reportLanguage: "fr" };
  },

  addProseMirrorPlugins() {
    const { locale, reportLanguage } = this.options;
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: "/",
        allowSpaces: true,
        items: ({ query }) => filterSlashItems(query, locale, reportLanguage),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let renderer: ReactRenderer<SlashMenuHandle> | null = null;
          let unmount: (() => void) | null = null;
          return {
            onStart: (props) => {
              renderer = new ReactRenderer(SlashMenu, {
                props: { ...props, locale },
                editor: props.editor,
              });
              const element = renderer.element as HTMLElement;
              element.style.zIndex = "60";
              unmount = props.mount(element);
            },
            onUpdate: (props) => renderer?.updateProps({ ...props, locale }),
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
