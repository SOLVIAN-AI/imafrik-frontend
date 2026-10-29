"use client";

import { Check, ChevronDown, type LucideIcon, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { useLocale } from "@/i18n/client";
import {
  type ChoiceOption,
  matchChoices,
  moveActive,
  SEARCH_FROM,
  sortChoices,
  typeAhead,
} from "@/lib/filters/choice";
import type { SearchText } from "@/lib/filters/dimensions";
import { PAGE_PARAMS, paramHref } from "@/lib/filters/url";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Largeur de la liste ouverte : celle d'un nom long et de son nombre. */
const POPUP_REM = 22;

/**
 * Liste déroulante d'un filtre : la clinique, demain le radiologue ou le
 * pays, et sur téléphone une rangée de puces trop longue pour la largeur.
 *
 * L'option par défaut d'abord (« Toutes les cliniques »), puis les
 * options par ordre alphabétique de la langue (ou dans l'ordre reçu, pour
 * des valeurs fixes comme les modalités), chacune avec son nombre de
 * lignes quand l'écran les compte ; une option à zéro reste proposée,
 * grisée. Au-delà de quelques options ({@link SEARCH_FROM}), la liste
 * s'ouvre sur une recherche, accents et majuscules ignorés. Des pastilles
 * côte à côte ne tenaient plus dès une dizaine de cliniques, ni sur un
 * téléphone.
 *
 * **Le choix est dans l'adresse** (par identifiant ou par un mot court,
 * jamais une donnée patient) : il se partage et survit au rechargement.
 * Les autres paramètres restent, la pagination repart du début.
 *
 * **Clavier et lecteur d'écran** : motif « combobox » de l'ARIA. Le bouton
 * annonce la valeur retenue et ouvre la liste (Entrée, Espace, flèches) ;
 * dans la liste, les flèches, Origine, Fin et les pages déplacent la
 * sélection, annoncée par `aria-activedescendant`, Entrée choisit, Échap
 * referme et rend le focus au bouton. Sans recherche, une lettre mène à
 * l'option suivante qui commence par elle. La liste ouverte tient dans la
 * largeur d'un téléphone et s'aligne sur le bord libre.
 *
 * @param label       Nom du choix (« Clinique »), visible sur le bouton.
 * @param allLabel    Option qui retire le filtre (« Toutes les cliniques ») ;
 *                    sans elle, une liste où l'on choisit toujours une
 *                    option (la clinique consultée).
 * @param placeholder Texte du bouton tant que rien n'est choisi, sans
 *                    option par défaut.
 * @param navigate    Adresse où mène une option : la liste choisit une
 *                    page plutôt qu'un filtre.
 * @param fit         `trigger` : la liste ouverte prend la largeur de son
 *                    bouton, dans un conteneur étroit (la navigation) ;
 *                    sinon celle d'un nom long, bornée par la fenêtre.
 * @param options     Options proposées, dans n'importe quel ordre.
 * @param total       Lignes de toutes les options, quand l'écran compte.
 * @param active      Option retenue ; `null` pour toutes.
 * @param param       Paramètre d'adresse du choix.
 * @param write       Valeur d'adresse d'une option (identité par défaut).
 * @param reset       Paramètres retirés au changement (la page de la liste).
 * @param icon        Pictogramme de la dimension.
 * @param order       `alphabetical` (défaut), ou `given` pour des valeurs
 *                    fixes, dans l'ordre reçu.
 * @param searchText  Textes de la recherche ; sans eux, pas de recherche.
 * @param countPhrase Nombre de lignes en toutes lettres (« 12 examens »).
 * @param appearance  `pill` dans une barre de pastilles, `field` ailleurs.
 */
export function FilterDropdown({
  label,
  allLabel,
  placeholder,
  navigate,
  fit,
  options,
  total,
  active,
  param,
  write,
  reset = PAGE_PARAMS,
  icon: Icon,
  order = "alphabetical",
  searchText,
  countPhrase,
  appearance = "field",
  className,
}: {
  label: string;
  allLabel?: string;
  placeholder?: string;
  navigate?: (value: string) => string;
  fit?: "trigger";
  options: readonly ChoiceOption[];
  total?: number;
  active: string | null;
  param: string;
  write?: (value: string) => string;
  reset?: readonly string[];
  icon: LucideIcon;
  order?: "alphabetical" | "given";
  searchText?: SearchText;
  countPhrase: (count: number) => string;
  appearance?: "pill" | "field";
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const id = React.useId();
  const listId = `${id}-list`;
  const wrapper = React.useRef<HTMLDivElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const search = React.useRef<HTMLInputElement>(null);
  const listbox = React.useRef<HTMLUListElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [alignEnd, setAlignEnd] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const sorted = React.useMemo(
    () => (order === "given" ? [...options] : sortChoices(options, locale)),
    [options, order, locale],
  );
  const searchable = searchText !== undefined && options.length >= SEARCH_FROM;
  const all: ChoiceOption[] =
    allLabel === undefined ? [] : [{ id: "", name: allLabel, count: total }];
  const shownOptions: ChoiceOption[] = [
    ...all,
    ...matchChoices(sorted, searchable ? query : ""),
  ];
  const matches = shownOptions.length - all.length;
  const selected = options.find((option) => option.id === active) ?? null;
  const shown = selected ??
    all[0] ?? { id: "", name: placeholder ?? "", count: undefined };
  const optionId = (index: number) => `${id}-option-${index}`;
  const counts = (count: number | undefined) =>
    count === undefined ? null : (
      <>
        <span aria-hidden>{formatCount(count, locale)}</span>
        <span className="sr-only">, {countPhrase(count)}</span>
      </>
    );

  const show = () => {
    // La liste s'aligne sur le bord libre : sous un bouton placé à droite
    // (en-tête de page), elle déborderait de la fenêtre.
    const rect = trigger.current?.getBoundingClientRect();
    const width =
      POPUP_REM *
      parseFloat(getComputedStyle(document.documentElement).fontSize || "16");
    setAlignEnd(Boolean(rect && rect.left + width > window.innerWidth - 16));
    setQuery("");
    setActiveIndex(
      Math.max(
        0,
        [...all, ...sorted].findIndex((option) => option.id === (active ?? "")),
      ),
    );
    setOpen(true);
  };

  const close = (focusTrigger: boolean) => {
    setOpen(false);
    if (focusTrigger) trigger.current?.focus();
  };

  const choose = (option: ChoiceOption | undefined) => {
    if (!option) return;
    close(true);
    const next = option.id || null;
    if (next === active) return;
    if (navigate && next) {
      startTransition(() => router.push(navigate(next)));
      return;
    }
    startTransition(() =>
      router.replace(
        paramHref(
          pathname,
          searchParams.toString(),
          param,
          next && (write ? write(next) : next),
          reset,
        ),
        { scroll: false },
      ),
    );
  };

  // Le focus entre dans la liste ouverte : sur la recherche, ou sur la
  // liste elle-même.
  React.useEffect(() => {
    if (!open) return;
    (searchable ? search.current : listbox.current)?.focus();
  }, [open, searchable]);

  // La ligne mise en avant reste visible quand on la déplace au clavier.
  const activeId = activeIndex >= 0 ? optionId(activeIndex) : undefined;
  React.useEffect(() => {
    if (!open || !activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [open, activeId]);

  // Un clic hors de la liste la referme, sans voler le focus.
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      // Échap ne referme pas aussi une fenêtre qui contiendrait la liste.
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === "Tab") {
      close(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      choose(shownOptions[activeIndex]);
      return;
    }
    // Dans le champ de recherche, Origine et Fin déplacent le curseur.
    const typing = event.target === search.current;
    if (typing && (event.key === "Home" || event.key === "End")) return;
    const moved = moveActive(activeIndex, event.key, shownOptions.length);
    if (moved !== null) {
      event.preventDefault();
      setActiveIndex(moved);
      return;
    }
    if (!typing && event.key === " ") {
      event.preventDefault();
      choose(shownOptions[activeIndex]);
      return;
    }
    if (
      !typing &&
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const found = typeAhead(
        shownOptions.map((option) => option.name),
        activeIndex,
        event.key,
      );
      if (found !== null) setActiveIndex(found);
    }
  };

  const pill = appearance === "pill";
  const filtered = selected !== null;

  return (
    <div
      ref={wrapper}
      className={cn("relative flex min-w-0", className)}
      data-testid="filter-dropdown"
    >
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-busy={pending || undefined}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            show();
          }
        }}
        className={cn(
          "inline-flex min-w-0 max-w-full items-center gap-1.5 border text-xs transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          pill ? "h-7 rounded-full px-2.5" : "h-8 rounded-lg px-2.5",
          filtered
            ? "border-accent bg-accent-muted text-primary"
            : "border-border-subtle text-secondary hover:border-border-default hover:text-primary",
          open && "border-border-default",
          pending && "opacity-70",
        )}
      >
        <Icon
          className={cn(
            "size-3.5 shrink-0",
            filtered ? "text-accent" : "text-tertiary",
          )}
          aria-hidden
        />
        {/* Le nom accessible commence par le texte visible (WCAG 2.5.3). */}
        <span
          className={cn(
            "shrink-0",
            // Sur le fond accentué d'un filtre actif, le gris tertiaire
            // n'atteint pas le contraste exigé (4,5:1).
            filtered ? "text-secondary" : "text-tertiary",
          )}
        >
          {label}
        </span>
        <span className={cn("min-w-0 truncate", filtered && "font-medium")}>
          {shown.name}
        </span>
        {shown.count !== undefined && (
          <span
            className={cn(
              "shrink-0 rounded px-1 text-2xs tabular-nums",
              filtered ? "font-semibold" : "bg-surface-hover",
            )}
          >
            {counts(shown.count)}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-3 shrink-0 text-tertiary transition-transform duration-150",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full z-40 mt-1 flex flex-col rounded-lg p-1",
            "border border-border-default bg-surface-overlay shadow-overlay",
            "animate-[fade-in_100ms_var(--ease-out-quart)]",
            fit === "trigger"
              ? "right-0 left-0"
              : alignEnd
                ? "right-0"
                : "left-0",
          )}
          style={
            fit === "trigger"
              ? undefined
              : { width: `min(${POPUP_REM}rem, calc(100vw - 2rem))` }
          }
        >
          {searchable && (
            <div className="relative mb-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary"
                aria-hidden
              />
              <input
                ref={search}
                type="text"
                role="combobox"
                aria-label={searchText?.search}
                aria-expanded
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                autoComplete="off"
                spellCheck={false}
                placeholder={searchText?.search}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  // La première trouvée, après l'option par défaut s'il y en a.
                  setActiveIndex(event.target.value.trim() ? all.length : 0);
                }}
                onKeyDown={onListKeyDown}
                className="h-8 w-full rounded-md border border-border-subtle bg-surface-sunken pr-2 pl-8 text-xs text-primary placeholder:text-tertiary focus-visible:border-accent focus-visible:outline-none"
              />
            </div>
          )}
          <ul
            ref={listbox}
            id={listId}
            role="listbox"
            aria-label={label}
            tabIndex={searchable ? -1 : 0}
            aria-activedescendant={searchable ? undefined : activeId}
            onKeyDown={searchable ? undefined : onListKeyDown}
            className="max-h-[min(18rem,50vh)] overflow-y-auto outline-none"
          >
            {shownOptions.map((option, index) => {
              const isSelected = option.id === (active ?? "");
              const highlighted = index === activeIndex;
              return (
                <li
                  key={option.id || "all"}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  onPointerMove={() => setActiveIndex(index)}
                  // Le focus reste sur la recherche ou la liste.
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  className={cn(
                    "flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                    highlighted && "bg-surface-hover",
                    index === 0 && all.length > 0 && "font-medium",
                    option.count === 0 && !isSelected
                      ? "text-tertiary"
                      : "text-primary",
                  )}
                >
                  <Check
                    className={cn(
                      "size-3.5 shrink-0 text-accent",
                      !isSelected && "invisible",
                    )}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{option.name}</span>
                    {option.detail && (
                      <span className="truncate text-2xs text-tertiary">
                        {option.detail}
                      </span>
                    )}
                  </span>
                  {option.count !== undefined && (
                    <span className="shrink-0 text-2xs text-tertiary tabular-nums">
                      {counts(option.count)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {searchable && matches === 0 && (
            <p className="px-2 py-2 text-xs text-tertiary">
              {searchText?.noMatch}
            </p>
          )}
          {searchable && (
            <p className="sr-only" aria-live="polite">
              {query.trim() ? searchText?.matches(matches) : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
