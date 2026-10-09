"use client";

import type { Editor } from "@tiptap/react";
import {
  CaseSensitive,
  ChevronDown,
  ChevronUp,
  Replace,
  Search,
  X,
} from "lucide-react";
import * as React from "react";

import {
  findInDoc,
  type Range,
  replaceRanges,
  type SearchQuery,
  setSearch,
} from "@/components/editor/search";
import { useMessages } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Une occurrence, rattachée à sa section. */
interface Match {
  editor: Editor;
  range: Range;
  /** Index de l'occurrence dans sa section. */
  local: number;
}

/**
 * Barre de recherche et de remplacement du compte-rendu.
 *
 * Elle cherche dans **toutes les sections à la fois**, dans l'ordre du
 * document — on cherche « gauche » dans un compte-rendu, pas dans un de
 * ses morceaux. Les occurrences sont surlignées, l'active plus fortement,
 * et amenée à l'écran.
 *
 * Clavier : Entrée pour la suivante, Maj+Entrée pour la précédente,
 * Échap pour fermer. Remplacer tout se fait en une transaction par
 * section : un Ctrl+Z dans une section défait tous ses remplacements.
 *
 * @param editors  Éditeurs des sections, dans l'ordre du document.
 * @param withReplace     Affiche le champ de remplacement.
 * @param onToggleReplace Affiche ou masque le champ de remplacement.
 * @param onClose  Fermeture — le surlignage est effacé.
 */
export function FindBar({
  editors,
  withReplace,
  onToggleReplace,
  onClose,
}: {
  editors: () => Editor[];
  withReplace: boolean;
  onToggleReplace: () => void;
  onClose: () => void;
}) {
  const labels = useMessages().reading.find;
  const [text, setText] = React.useState("");
  const [replacement, setReplacement] = React.useState("");
  const [caseSensitive, setCaseSensitive] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  // Incrémenté à chaque modification d'une section : les occurrences
  // suivent la frappe, sans recalcul à chaque rendu.
  const [version, setVersion] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const list = editors();
    const bump = () => setVersion((value) => value + 1);
    list.forEach((editor) => editor.on("update", bump));
    return () => list.forEach((editor) => editor.off("update", bump));
  }, [editors]);

  // Le champ de recherche prend le focus à l'ouverture.
  React.useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const query: SearchQuery = React.useMemo(
    () => ({ text, caseSensitive }),
    [text, caseSensitive],
  );

  const matches: Match[] = React.useMemo(() => {
    void version;
    return editors().flatMap((editor) =>
      findInDoc(editor.state.doc, query).map((range, local) => ({
        editor,
        range,
        local,
      })),
    );
  }, [editors, query, version]);

  const current = matches.length ? Math.min(index, matches.length - 1) : -1;
  const active = current >= 0 ? matches[current] : null;

  // Surlignage de chaque section, occurrence active comprise.
  React.useEffect(() => {
    for (const editor of editors()) {
      if (editor.isDestroyed) continue;
      setSearch(
        editor,
        query,
        active && active.editor === editor ? active.local : -1,
      );
    }
  }, [editors, query, active]);

  // Effacé à la fermeture.
  React.useEffect(
    () => () => {
      for (const editor of editors()) {
        if (!editor.isDestroyed)
          setSearch(editor, { text: "", caseSensitive: false });
      }
    },
    [editors],
  );

  // L'occurrence active est amenée au centre de l'écran.
  React.useEffect(() => {
    if (!active || active.editor.isDestroyed) return;
    const { node } = active.editor.view.domAtPos(active.range.from);
    const element = node instanceof Element ? node : node.parentElement;
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [active]);

  const go = (step: number) => {
    if (!matches.length) return;
    setIndex((current + step + matches.length) % matches.length);
  };

  const replaceOne = () => {
    if (!active) return;
    replaceRanges(active.editor, [active.range], replacement);
    // L'occurrence suivante prend la place de la remplacée : l'index ne
    // bouge pas, sauf si c'était la dernière.
  };

  const replaceAll = () => {
    for (const editor of editors()) {
      replaceRanges(editor, findInDoc(editor.state.doc, query), replacement);
    }
    setIndex(0);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      // Échap ne doit pas aussi quitter le plein écran.
      event.stopPropagation();
      onClose();
    }
  };

  return (
    <div
      role="search"
      aria-label={labels.label}
      onKeyDown={onKeyDown}
      className="flex shrink-0 flex-col gap-2 border-b border-border-subtle bg-surface-raised px-3 py-2 sm:px-5"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="relative flex min-w-0 flex-[1_1_12rem] items-center">
          <span className="sr-only">{labels.label}</span>
          <Search
            className="pointer-events-none absolute left-2.5 size-3.5 text-tertiary"
            aria-hidden
          />
          <input
            ref={inputRef}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                go(event.shiftKey ? -1 : 1);
              }
            }}
            placeholder={labels.placeholder}
            className="h-8 w-full rounded-md border border-border-default bg-surface-base pr-20 pl-8 text-sm placeholder:text-tertiary focus:border-accent focus:ring-3 focus:ring-accent/25 focus:outline-none"
          />
          <span
            className={cn(
              "absolute right-2.5 text-2xs tabular-nums",
              text && !matches.length ? "text-urgent" : "text-tertiary",
            )}
            aria-live="polite"
          >
            {text
              ? matches.length
                ? `${current + 1} / ${matches.length}`
                : labels.noResult
              : ""}
          </span>
        </label>
        <div className="flex items-center gap-0.5">
          <BarButton
            label={labels.previous}
            onClick={() => go(-1)}
            disabled={!matches.length}
          >
            <ChevronUp />
          </BarButton>
          <BarButton
            label={labels.next}
            onClick={() => go(1)}
            disabled={!matches.length}
          >
            <ChevronDown />
          </BarButton>
          <BarButton
            label={labels.matchCase}
            pressed={caseSensitive}
            onClick={() => {
              setCaseSensitive((value) => !value);
              setIndex(0);
            }}
          >
            <CaseSensitive />
          </BarButton>
          <BarButton
            label={labels.replace}
            pressed={withReplace}
            onClick={onToggleReplace}
          >
            <Replace />
          </BarButton>
          <BarButton label={labels.close} onClick={onClose}>
            <X />
          </BarButton>
        </div>
      </div>

      {withReplace && (
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="min-w-0 flex-[1_1_12rem]">
            <span className="sr-only">{labels.replaceWith}</span>
            <input
              value={replacement}
              onChange={(event) => setReplacement(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  replaceOne();
                }
              }}
              placeholder={labels.replaceWith}
              className="h-8 w-full rounded-md border border-border-default bg-surface-base px-2.5 text-sm placeholder:text-tertiary focus:border-accent focus:ring-3 focus:ring-accent/25 focus:outline-none"
            />
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={replaceOne}
              disabled={!active}
              className="h-8 rounded-md border border-border-default px-2.5 text-xs font-medium transition-colors hover:bg-surface-hover disabled:opacity-40"
            >
              {labels.replace}
            </button>
            <button
              type="button"
              onClick={replaceAll}
              disabled={!matches.length}
              className="h-8 rounded-md border border-border-default px-2.5 text-xs font-medium transition-colors hover:bg-surface-hover disabled:opacity-40"
            >
              {labels.replaceAll}
              {matches.length > 0 && (
                <span className="ml-1 text-tertiary tabular-nums">
                  ({matches.length})
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Bouton d'icône de la barre. */
function BarButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-surface-hover hover:text-primary disabled:opacity-40 [&_svg]:size-4",
        pressed && "bg-accent-muted text-accent",
      )}
    >
      {children}
    </button>
  );
}
