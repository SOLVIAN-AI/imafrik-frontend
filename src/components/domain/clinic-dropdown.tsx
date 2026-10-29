"use client";

import { Check, ChevronDown, Hospital, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { useLocale, useMessages } from "@/i18n/client";
import {
  type ClinicChoice,
  clinicChoiceHref,
  matchClinics,
  moveActive,
  SEARCH_FROM,
  sortClinics,
  typeAhead,
} from "@/lib/clinic-choice";
import { formatCount } from "@/lib/format";
import { CURSOR_PARAM } from "@/lib/pagination";
import { cn } from "@/lib/utils";

/** Largeur de la liste ouverte : celle d'un nom long et de son nombre. */
const POPUP_REM = 22;

/**
 * Choix de la clinique d'une liste d'examens, en liste déroulante.
 *
 * « Toutes les cliniques » d'abord, puis les cliniques par ordre
 * alphabétique de la langue, chacune avec son nombre d'examens quand
 * l'écran les compte ; une clinique à zéro reste proposée, grisée. Au-delà
 * de quelques cliniques ({@link SEARCH_FROM}), la liste s'ouvre sur une
 * recherche, accents et majuscules ignorés. Des pastilles côte à côte ne
 * tenaient plus dès une dizaine de cliniques, ni sur un téléphone.
 *
 * **Le choix est dans l'adresse** (`?clinique=`, par identifiant, jamais
 * une donnée patient) : il se partage et survit au rechargement. Les autres
 * paramètres restent, la pagination repart du début.
 *
 * **Clavier et lecteur d'écran** : motif « combobox » de l'ARIA. Le bouton
 * annonce la clinique retenue et ouvre la liste (Entrée, Espace, flèches) ;
 * dans la liste, les flèches, Origine, Fin et les pages déplacent la
 * sélection, annoncée par `aria-activedescendant`, Entrée choisit, Échap
 * referme et rend le focus au bouton. Sans recherche, une lettre mène à la
 * clinique suivante qui commence par elle. La liste ouverte tient dans la
 * largeur d'un téléphone et s'aligne sur le bord libre.
 *
 * @param label      Nom du choix (« Clinique »), visible sur le bouton.
 * @param allLabel   Option qui retire le filtre (« Toutes les cliniques »).
 * @param clinics    Cliniques proposées, dans n'importe quel ordre.
 * @param total      Examens de toutes les cliniques, quand l'écran compte.
 * @param active     Clinique retenue ; `null` pour toutes.
 * @param param      Paramètre d'adresse de la clinique.
 * @param reset      Paramètres retirés au changement (la page de la liste).
 * @param appearance `pill` dans une barre de pastilles, `field` ailleurs.
 */
export function ClinicDropdown({
  label,
  allLabel,
  clinics,
  total,
  active,
  param = "clinique",
  reset = [CURSOR_PARAM],
  appearance = "field",
  className,
}: {
  label: string;
  allLabel: string;
  clinics: readonly ClinicChoice[];
  total?: number;
  active: string | null;
  param?: string;
  reset?: readonly string[];
  appearance?: "pill" | "field";
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const text = useMessages().worklist.filters;
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
    () => sortClinics(clinics, locale),
    [clinics, locale],
  );
  const searchable = clinics.length >= SEARCH_FROM;
  const options: ClinicChoice[] = [
    { id: "", name: allLabel, count: total },
    ...matchClinics(sorted, query),
  ];
  const matches = options.length - 1;
  const selected = clinics.find((clinic) => clinic.id === active) ?? null;
  const shown = selected ?? { id: "", name: allLabel, count: total };
  const optionId = (index: number) => `${id}-option-${index}`;
  const counts = (count: number | undefined) =>
    count === undefined ? null : (
      <>
        <span aria-hidden>{formatCount(count, locale)}</span>
        <span className="sr-only">, {text.studyCount(count)}</span>
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
        [{ id: "" }, ...sorted].findIndex(
          (option) => option.id === (active ?? ""),
        ),
      ),
    );
    setOpen(true);
  };

  const close = (focusTrigger: boolean) => {
    setOpen(false);
    if (focusTrigger) trigger.current?.focus();
  };

  const choose = (option: ClinicChoice | undefined) => {
    if (!option) return;
    close(true);
    const next = option.id || null;
    if (next === active) return;
    startTransition(() =>
      router.replace(
        clinicChoiceHref(pathname, searchParams.toString(), param, next, reset),
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
      choose(options[activeIndex]);
      return;
    }
    // Dans le champ de recherche, Origine et Fin déplacent le curseur.
    const typing = event.target === search.current;
    if (typing && (event.key === "Home" || event.key === "End")) return;
    const moved = moveActive(activeIndex, event.key, options.length);
    if (moved !== null) {
      event.preventDefault();
      setActiveIndex(moved);
      return;
    }
    if (!typing && event.key === " ") {
      event.preventDefault();
      choose(options[activeIndex]);
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
        options.map((option) => option.name),
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
      data-testid="clinic-dropdown"
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
        <Hospital
          className={cn(
            "size-3.5 shrink-0",
            filtered ? "text-accent" : "text-tertiary",
          )}
          aria-hidden
        />
        {/* Le nom accessible commence par le texte visible (WCAG 2.5.3). */}
        <span className="shrink-0 text-tertiary">{label}</span>
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
            alignEnd ? "right-0" : "left-0",
          )}
          style={{ width: `min(${POPUP_REM}rem, calc(100vw - 2rem))` }}
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
                aria-label={text.clinicSearch}
                aria-expanded
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                autoComplete="off"
                spellCheck={false}
                placeholder={text.clinicSearch}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(event.target.value.trim() ? 1 : 0);
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
            {options.map((option, index) => {
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
                    index === 0 && "font-medium",
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
                  <span className="min-w-0 flex-1 truncate">{option.name}</span>
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
              {text.clinicNoMatch}
            </p>
          )}
          {searchable && (
            <p className="sr-only" aria-live="polite">
              {query.trim() ? text.clinicMatches(matches) : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
