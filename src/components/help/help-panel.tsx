"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  GraduationCap,
  ListChecks,
  Mail,
  Route,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import {
  createHelpOpenStore,
  type GlossaryTerm,
  HelpContext,
  type HelpControls,
} from "@/components/help/help-context";
import { useSession } from "@/components/providers/session-provider";
import { useTour } from "@/components/tour/tour-provider";
import {
  type HelpGuide,
  type HelpPage,
  guidesOf,
  type HelpScreen,
  helpRoleOf,
  helpScreenFor,
  hrefOf,
  searchHelp,
} from "@/lib/help";
import { hasModifier, isTyping } from "@/lib/keyboard";
import { PUBLISHER } from "@/lib/legal";
import { homeFor, isRouteAllowed } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useMessages } from "@/i18n/client";

/**
 * Prépare un texte d'aide à l'affichage.
 *
 * - Attache à leur mot les guillemets et le deux-points : sans cela, un
 *   « ou un deux-points peut se retrouver seul en début ou en fin de
 *   ligne dans une colonne étroite. Les textes gardent l'espace simple de
 *   la maison ; seul l'affichage la rend insécable.
 * - Affiche en code, sur une seule ligne, ce qui est entre accents graves
 *   (une commande à taper) : coupée à un tiret, elle ne se recopie plus.
 */
function tidy(text: string): React.ReactNode {
  const typeset = text
    .replaceAll("« ", "«\u00a0")
    .replaceAll(" »", "\u00a0»")
    .replaceAll(" :", "\u00a0:");
  const parts = typeset.split(/`([^`]+)`/);
  if (parts.length === 1) return typeset;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <code
        key={index}
        className="rounded bg-surface-raised px-1 py-0.5 font-mono text-2xs whitespace-nowrap text-primary"
      >
        {part}
      </code>
    ) : (
      part
    ),
  );
}

/** Adresse de l'espace de formation. */
const TRAINING_HREF = "/formation";

type View = "page" | "glossary" | "guide";

/** Terme demandé par une bulle d'information ; un objet neuf par demande. */
interface TermRequest {
  term: GlossaryTerm;
}

/**
 * Aide contextuelle de l'écran courant.
 *
 * Un panneau latéral, à droite, ouvert par le bouton d'aide ou la touche
 * `?` (hors d'un champ de saisie) : à quoi sert l'écran, ses gestes clés,
 * les termes qu'il emploie, de quoi aller plus loin et les raccourcis. Il
 * ne bloque pas la page : on lit l'aide en regardant l'écran qu'elle
 * décrit. Il suit la navigation, et la recherche mène d'un écran à
 * l'autre sans le fermer. Le lien « En savoir plus » d'une bulle
 * d'information l'ouvre sur un terme du glossaire (`openTerm`).
 *
 * Monté sous `TourProvider` : il relance la visite de l'écran.
 */
export function HelpProvider({ children }: { children: React.ReactNode }) {
  // L'ouverture vit hors de l'état du fournisseur, et la valeur du
  // contexte ne change jamais : voir `HelpControls`.
  const [store] = React.useState(createHelpOpenStore);
  const open = React.useSyncExternalStore(
    store.subscribe,
    store.isOpen,
    () => false,
  );
  const [request, setRequest] = React.useState<TermRequest | null>(null);
  const controls = React.useMemo<HelpControls>(
    () => ({
      ...store,
      toggle: () => store.setOpen(!store.isOpen()),
      openTerm: (term) => {
        setRequest({ term });
        store.setOpen(true);
      },
    }),
    [store],
  );

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "?" || hasModifier(event) || isTyping(event.target)) {
        return;
      }
      event.preventDefault();
      controls.toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [controls]);

  return (
    <HelpContext.Provider value={controls}>
      {children}
      <HelpPanel
        open={open}
        onOpenChange={store.setOpen}
        termRequest={request}
      />
    </HelpContext.Provider>
  );
}

function HelpPanel({
  open,
  onOpenChange,
  termRequest,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  termRequest: TermRequest | null;
}) {
  const t = useMessages();
  const text = t.help.panel;
  const pathname = usePathname();
  const router = useRouter();
  const { active } = useSession();
  const { screenTour, mainTour, start, request } = useTour();
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<View>("page");
  const [focusTerm, setFocusTerm] = React.useState<string | null>(null);
  const [guideKey, setGuideKey] = React.useState<string | null>(null);

  const screen = helpScreenFor(active.role, pathname);
  const rolePages = t.help.pages[helpRoleOf(active.role)] as Record<
    string,
    HelpPage
  >;
  const page = screen ? rolePages[screen.key] : undefined;
  const glossary = t.help.glossary as Record<
    string,
    { term: string; definition: string }
  >;
  const roleGuides = React.useMemo(
    () => guidesOf(rolePages, t.help.guides as Record<string, HelpGuide>),
    [rolePages, t.help.guides],
  );
  const results = React.useMemo(
    () => searchHelp(query, rolePages, glossary, roleGuides),
    [query, rolePages, glossary, roleGuides],
  );
  const guide = guideKey ? roleGuides[guideKey] : undefined;

  // « En savoir plus » d'une bulle d'information : le glossaire, ouvert sur
  // son terme. Chaque demande est un objet neuf, traité une seule fois.
  const [handled, setHandled] = React.useState(termRequest);
  if (termRequest !== handled) {
    setHandled(termRequest);
    if (termRequest) {
      setQuery("");
      setFocusTerm(termRequest.term);
      setView("glossary");
    }
  }

  // Un terme choisi dans la recherche, ou demandé par une bulle, s'ouvre
  // dans le glossaire, à sa place. Une image plus tard : le panneau qui
  // s'ouvre à l'instant n'a pas encore monté son contenu.
  React.useEffect(() => {
    if (!open || view !== "glossary" || !focusTerm) return;
    const frame = requestAnimationFrame(() =>
      document
        .getElementById(`aide-terme-${focusTerm}`)
        ?.scrollIntoView({ block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [open, view, focusTerm, handled]);

  const close = () => onOpenChange(false);
  const openGlossary = (term: string | null = null) => {
    setQuery("");
    setFocusTerm(term);
    setView("glossary");
  };
  const openGuide = (key: string) => {
    setQuery("");
    setGuideKey(key);
    setView("guide");
  };
  const goTo = (key: string) => {
    const href = hrefOf(active.role, key, pathname);
    setQuery("");
    setView("page");
    if (href && href !== pathname) router.push(href);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          tabIndex={-1}
          // Le focus va au panneau, pas au bouton de fermeture : la touche
          // `?` le referme aussitôt, et rien ne s'allume sans raison.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            "fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col",
            "border-l border-border-default bg-surface-overlay shadow-overlay",
            "animate-[fade-in_120ms_var(--ease-out-quart)] focus:outline-none",
          )}
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <DialogPrimitive.Title className="text-sm font-semibold">
              {text.title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label={text.close}
              className="flex size-7 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-surface-hover hover:text-primary"
            >
              <X className="size-4" aria-hidden />
            </DialogPrimitive.Close>
          </div>

          <div className="border-b border-border-subtle px-4 py-3">
            {page && (
              <p className="mb-2 text-xs text-tertiary">
                {text.onThisPage}{" "}
                <span className="font-medium text-primary">{page.title}</span>
              </p>
            )}
            <label className="relative block">
              <span className="sr-only">{text.searchLabel}</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={text.searchPlaceholder}
                aria-label={text.searchLabel}
                className="h-9 w-full rounded-lg border border-border-default bg-surface-base pr-3 pl-8 text-sm placeholder:text-tertiary focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 text-sm">
            {query.trim().length >= 2 ? (
              <SearchResults
                results={results}
                onPage={goTo}
                onTerm={(key) => openGlossary(key)}
                onGuide={openGuide}
              />
            ) : view === "guide" && guide ? (
              <GuideView guide={guide} onBack={() => setView("page")} />
            ) : view === "glossary" ? (
              <GlossaryView
                glossary={glossary}
                focus={focusTerm}
                onBack={() => setView("page")}
              />
            ) : (
              <PageView
                page={page}
                screen={screen}
                glossary={glossary}
                more={
                  <ul className="flex flex-col gap-1">
                    {(page?.guides ?? []).map((key) =>
                      roleGuides[key] ? (
                        <MoreItem
                          key={key}
                          icon={ListChecks}
                          label={text.guideLink(roleGuides[key].title)}
                          onSelect={() => openGuide(key)}
                        />
                      ) : null,
                    )}
                    {screenTour ? (
                      <MoreItem
                        icon={Route}
                        label={t.tour.help.replayHere}
                        onSelect={() => {
                          close();
                          start(screenTour.id);
                        }}
                      />
                    ) : mainTour ? (
                      <MoreItem
                        icon={Route}
                        label={t.tour.help.tourOfHome}
                        onSelect={() => {
                          close();
                          request(mainTour.id);
                          router.push(homeFor(active.role));
                        }}
                      />
                    ) : null}
                    {isRouteAllowed(active.role, TRAINING_HREF) && (
                      <li>
                        <Link
                          href={TRAINING_HREF}
                          onClick={close}
                          className={MORE_CLASS}
                        >
                          <GraduationCap
                            className="size-3.5 text-tertiary"
                            aria-hidden
                          />
                          {t.tour.help.training}
                        </Link>
                      </li>
                    )}
                    <MoreItem
                      icon={BookOpen}
                      label={text.openGlossary}
                      onSelect={() => openGlossary()}
                    />
                    {active.role !== "platform_admin" && (
                      <li>
                        <a
                          href={`mailto:${PUBLISHER.contact}`}
                          className={MORE_CLASS}
                        >
                          <Mail
                            className="size-3.5 text-tertiary"
                            aria-hidden
                          />
                          {t.tour.help.contact}
                        </a>
                      </li>
                    )}
                  </ul>
                }
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const MORE_CLASS =
  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-secondary transition-colors hover:bg-surface-hover hover:text-primary";

function MoreItem({
  icon: Icon,
  label,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  onSelect: () => void;
}) {
  return (
    <li>
      <button type="button" onClick={onSelect} className={MORE_CLASS}>
        <Icon className="size-3.5 text-tertiary" aria-hidden />
        {label}
      </button>
    </li>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="label-eyebrow mb-1.5">{children}</h3>;
}

function PageView({
  page,
  screen,
  glossary,
  more,
}: {
  page: HelpPage | undefined;
  screen: HelpScreen | null;
  glossary: Record<string, { term: string; definition: string }>;
  more: React.ReactNode;
}) {
  const t = useMessages();
  const text = t.help.panel;
  return (
    <div className="flex flex-col gap-5">
      {page ? (
        <>
          <section>
            <Heading>{text.purpose}</Heading>
            <p className="leading-relaxed text-secondary">
              {tidy(page.purpose)}
            </p>
          </section>
          <section>
            <Heading>{text.steps}</Heading>
            <ol className="flex flex-col gap-1.5">
              {page.steps.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-2 leading-relaxed text-secondary"
                >
                  <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-muted text-2xs font-semibold text-accent tabular-nums">
                    {index + 1}
                  </span>
                  <span>{tidy(step)}</span>
                </li>
              ))}
            </ol>
          </section>
          {page.terms.length > 0 && (
            <section>
              <Heading>{text.terms}</Heading>
              <dl className="flex flex-col gap-2.5">
                {page.terms.map((key) => {
                  const entry = glossary[key];
                  if (!entry) return null;
                  return (
                    <div key={key}>
                      <dt className="font-medium text-primary">{entry.term}</dt>
                      <dd className="mt-0.5 text-xs leading-relaxed text-secondary">
                        {tidy(entry.definition)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          )}
        </>
      ) : (
        <p className="leading-relaxed text-secondary">{text.noScreen}</p>
      )}
      <section>
        <Heading>{text.more}</Heading>
        {more}
      </section>
      <section>
        <Heading>{text.shortcuts}</Heading>
        <Shortcuts table={screen?.shortcuts.includes("table") ?? false} />
      </section>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border-subtle bg-surface-raised px-1.5 py-0.5 font-sans text-2xs text-secondary">
      {children}
    </kbd>
  );
}

function Shortcuts({ table }: { table: boolean }) {
  const t = useMessages();
  const text = t.help.panel;
  const rows: [React.ReactNode, string][] = [
    [<Key key="q">?</Key>, text.keys.help],
    [
      <span key="k" className="flex gap-1">
        <Key>⌘ K</Key>
        <Key>Ctrl K</Key>
      </span>,
      text.keys.palette,
    ],
    [<Key key="s">/</Key>, text.keys.slash],
    [<Key key="e">{text.escapeKey}</Key>, text.keys.escape],
  ];
  if (table) {
    rows.push(
      [
        <span key="jk" className="flex gap-1">
          <Key>j</Key>
          <Key>k</Key>
        </span>,
        text.keys.browse,
      ],
      [<Key key="enter">{text.enterKey}</Key>, text.keys.open],
    );
  }
  return (
    <dl className="flex flex-col gap-1.5">
      {rows.map(([keys, label]) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <dd className="text-xs text-secondary">{label}</dd>
          <dt className="shrink-0">{keys}</dt>
        </div>
      ))}
    </dl>
  );
}

function SearchResults({
  results,
  onPage,
  onGuide,
  onTerm,
}: {
  results: ReturnType<typeof searchHelp>;
  onPage: (key: string) => void;
  onGuide: (key: string) => void;
  onTerm: (key: string) => void;
}) {
  const t = useMessages();
  const text = t.help.panel;
  if (results.length === 0) {
    return <p className="leading-relaxed text-secondary">{text.noResult}</p>;
  }
  const pages = results.filter((result) => result.kind === "page");
  const terms = results.filter((result) => result.kind === "term");
  const guides = results.filter((result) => result.kind === "guide");
  const group = (
    label: string,
    items: typeof results,
    pick: (key: string) => void,
  ) =>
    items.length > 0 && (
      <section>
        <Heading>{label}</Heading>
        <ul className="flex flex-col gap-1">
          {items.map((result) => (
            <li key={`${result.kind}-${result.key}`}>
              <button
                type="button"
                onClick={() => pick(result.key)}
                className="group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-hover"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-primary">
                    {result.title}
                  </span>
                  <span className="line-clamp-2 text-xs text-secondary">
                    {tidy(result.excerpt)}
                  </span>
                </span>
                <ChevronRight
                  className="mt-0.5 size-3.5 shrink-0 text-tertiary group-hover:text-secondary"
                  aria-hidden
                />
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  return (
    <div className="flex flex-col gap-4">
      {group(text.guides, guides, onGuide)}
      {group(text.resultsPages, pages, onPage)}
      {group(text.resultsTerms, terms, onTerm)}
    </div>
  );
}

/**
 * Un guide pas à pas : ses étapes numérotées d'un bout à l'autre, groupées
 * par lieu (tour de contrôle, poste de la clinique…).
 */
function GuideView({
  guide,
  onBack,
}: {
  guide: HelpGuide;
  onBack: () => void;
}) {
  const t = useMessages();
  const text = t.help.panel;
  // Numéro de la première étape de chaque section : la numérotation court
  // d'un bout à l'autre du guide.
  const starts = guide.sections.map((_, index) =>
    guide.sections
      .slice(0, index)
      .reduce((sum, section) => sum + section.steps.length, 1),
  );
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-xs text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        {text.back}
      </button>
      <div>
        <h3 className="text-base font-semibold text-primary">{guide.title}</h3>
        <p className="mt-1 leading-relaxed text-secondary">
          {tidy(guide.intro)}
        </p>
      </div>
      {guide.sections.map((section, sectionIndex) => (
        <section key={section.title}>
          <Heading>{section.title}</Heading>
          <ol className="flex flex-col gap-1.5">
            {section.steps.map((step, stepIndex) => (
              <li
                key={step}
                className="flex gap-2 leading-relaxed text-secondary"
              >
                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-muted text-2xs font-semibold text-accent tabular-nums">
                  {starts[sectionIndex] + stepIndex}
                </span>
                <span>{tidy(step)}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function GlossaryView({
  glossary,
  focus,
  onBack,
}: {
  glossary: Record<string, { term: string; definition: string }>;
  focus: string | null;
  onBack: () => void;
}) {
  const t = useMessages();
  const text = t.help.panel;
  const entries = Object.entries(glossary).sort(([, a], [, b]) =>
    a.term.localeCompare(b.term, "fr"),
  );
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 self-start text-xs text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        {text.back}
      </button>
      <Heading>{text.glossary}</Heading>
      <dl className="flex flex-col gap-3">
        {entries.map(([key, entry]) => (
          <div
            key={key}
            id={`aide-terme-${key}`}
            className={cn(
              "scroll-mt-2 rounded-md",
              focus === key && "bg-accent-muted px-2 py-1.5",
            )}
          >
            <dt className="font-medium text-primary">{entry.term}</dt>
            <dd className="mt-0.5 text-xs leading-relaxed text-secondary">
              {tidy(entry.definition)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
