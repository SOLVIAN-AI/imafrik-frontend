"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowRight,
  CornerDownLeft,
  Languages,
  Loader2,
  Moon,
  Search,
  Stethoscope,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  StudyStatusChip,
  UrgentMarker,
} from "@/components/domain/study-status";
import { NAV_ICONS } from "@/components/layout/sidebar";
import { useSession } from "@/components/providers/session-provider";
import {
  searchStudies,
  setListSearch,
  type StudyHit,
} from "@/lib/actions/search";
import { messagesFor } from "@/i18n";
import { useLocale, useMessages } from "@/i18n/client";
import { setLanguage } from "@/lib/actions/profile";
import { formatPatientName } from "@/lib/format";
import { LOCALE_NAMES, LOCALES } from "@/lib/i18n/locale";
import { isTyping } from "@/lib/keyboard";
import { navigationFor } from "@/lib/navigation";
import type { ListSearchScope } from "@/lib/search/list-search";
import type { UserRole } from "@/lib/session/types";
import { cn } from "@/lib/utils";

/**
 * Liste où mène « voir tous les résultats », par portail.
 *
 * La recherche n'y voyage pas dans l'adresse — elle porte un nom de
 * patient — mais par le cookie de la liste (`setListSearch`).
 */
const SEARCH_TARGET: Record<
  UserRole,
  { href: string; scope: ListSearchScope }
> = {
  radiologist: { href: "/worklist", scope: "worklist" },
  clinic_staff: { href: "/examens", scope: "examens" },
  platform_admin: { href: "/admin/examens", scope: "admin-examens" },
};

/**
 * Où ouvrir un examen trouvé.
 *
 * Le radiologue va droit à l'écran de lecture, la clinique à la fiche de
 * suivi. L'équipe IMAFRIK n'a pas d'écran par examen — elle ne lit pas
 * les images — : la liste filtrée sur l'identifiant en tient lieu.
 *
 * @returns L'adresse, et la recherche à appliquer à la liste d'arrivée.
 */
function studyTarget(
  role: UserRole,
  hit: StudyHit,
): { href: string; search?: string } {
  switch (role) {
    case "radiologist":
      return { href: `/lecture/${hit.id}` };
    case "clinic_staff":
      return { href: `/examens/${hit.id}` };
    case "platform_admin":
      return {
        href: SEARCH_TARGET.platform_admin.href,
        search: hit.patientId || hit.patientName,
      };
  }
}

/** Une entrée de la palette, quelle qu'en soit la nature. */
interface Command {
  id: string;
  group: "studies" | "goTo" | "preferences";
  label: string;
  detail?: string;
  icon: LucideIcon;
  hit?: StudyHit;
  run: () => void;
}

/** Normalise pour une comparaison insensible à la casse et aux accents. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Recherche d'examens, avec un délai de frappe.
 *
 * 180 ms : sous ce seuil la palette interrogerait le service à chaque
 * lettre ; au-dessus, la réponse paraît en retard sur la frappe. Une
 * réponse arrivée après une frappe plus récente est ignorée — sans quoi
 * une requête lente pourrait remplacer les bons résultats par d'anciens.
 */
function useStudySearch(query: string) {
  const [hits, setHits] = React.useState<StudyHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const latest = React.useRef(0);

  React.useEffect(() => {
    const needle = query.trim();
    const ticket = ++latest.current;
    if (needle.length < 2) {
      const reset = window.setTimeout(() => {
        setHits([]);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(reset);
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const result = await searchStudies(needle);
      if (ticket !== latest.current) return;
      setHits(result.ok ? result.data : []);
      setLoading(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  return { hits, loading };
}

/**
 * Palette de commandes — ⌘K, Ctrl+K ou `/`.
 *
 * **Un seul geste pour tout atteindre** : un patient, un écran, un
 * réglage. Un radiologue qui enchaîne quarante examens passe sa journée
 * au clavier ; chaque détour par la souris lui coûte. La palette rend la
 * navigation entière accessible sans quitter le clavier, et la recherche
 * d'un patient — le geste le plus fréquent après la lecture elle-même —
 * tient en trois lettres et « Entrée ».
 *
 * Les écrans proposés sont ceux du portail actif, tirés de la même
 * navigation que la barre latérale : la palette ne peut pas ouvrir un
 * écran que le rôle n'autorise pas, et un écran ajouté au menu y apparaît
 * de lui-même.
 *
 * Accessibilité : motif « combobox » — le champ garde le focus, les
 * flèches déplacent la sélection, annoncée par `aria-activedescendant`.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { active } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const t = useMessages();
  const locale = useLocale();
  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState(0);
  const { hits, loading } = useStudySearch(open ? query : "");
  const listRef = React.useRef<HTMLDivElement>(null);

  const close = React.useCallback(() => {
    onOpenChange(false);
    setQuery("");
    setCursor(0);
  }, [onOpenChange]);

  const go = React.useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  /** Ouvre la liste du portail, filtrée sur une recherche. */
  const goSearch = React.useCallback(
    async (search: string) => {
      const target = SEARCH_TARGET[active.role];
      close();
      const result = await setListSearch(target.scope, search);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      router.push(target.href);
    },
    [active.role, close, router],
  );

  /** Ouvre un examen trouvé. */
  const openHit = React.useCallback(
    (hit: StudyHit) => {
      const target = studyTarget(active.role, hit);
      if (target.search) void goSearch(target.search);
      else go(target.href);
    },
    [active.role, go, goSearch],
  );

  const commands = React.useMemo<Command[]>(() => {
    const needle = normalize(query.trim());
    const studies: Command[] = hits.map((hit) => ({
      id: `study-${hit.id}`,
      group: "studies",
      label: formatPatientName(hit.patientName),
      detail: [
        hit.patientId,
        `${hit.modality}${hit.bodyPart ? ` ${hit.bodyPart}` : ""}`,
        hit.clinic,
      ]
        .filter(Boolean)
        .join(" · "),
      icon: Stethoscope,
      hit,
      run: () => openHit(hit),
    }));

    const screens: Command[] = navigationFor(active.role)
      .flatMap((group) => group.items)
      .filter(
        (item) => !needle || normalize(t.nav.items[item.key]).includes(needle),
      )
      .map((item) => ({
        id: `nav-${item.href}`,
        group: "goTo",
        label: t.nav.items[item.key],
        icon: NAV_ICONS[item.icon],
        run: () => go(item.href),
      }));

    const dark = resolvedTheme !== "light";
    const theme: Command = {
      id: "theme",
      group: "preferences",
      label: dark ? t.nav.theme.toLight : t.nav.theme.toDark,
      icon: dark ? Sun : Moon,
      run: () => {
        setTheme(dark ? "light" : "dark");
        close();
      },
    };
    // L'autre langue de l'application, proposée dans cette langue-là.
    const otherLocale = LOCALES.find((candidate) => candidate !== locale)!;
    const language: Command = {
      id: "language",
      group: "preferences",
      label: messagesFor(otherLocale).nav.palette.language(
        LOCALE_NAMES[otherLocale],
      ),
      icon: Languages,
      run: () => {
        close();
        void setLanguage(otherLocale).then((result) => {
          if (result.ok) window.location.reload();
          else toast.error(result.error);
        });
      },
    };
    const preferences = [theme, language].filter(
      (command) => !needle || normalize(command.label).includes(needle),
    );

    return [...studies, ...screens, ...preferences];
  }, [
    hits,
    query,
    active.role,
    resolvedTheme,
    setTheme,
    go,
    close,
    openHit,
    t,
    locale,
  ]);

  const selected = commands[Math.min(cursor, commands.length - 1)];

  // La sélection visible reste dans la zone affichée quand on la déplace
  // au clavier au-delà du bord de la liste.
  React.useEffect(() => {
    if (!selected) return;
    listRef.current
      ?.querySelector(`[data-command="${CSS.escape(selected.id)}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setCursor(
        (current) =>
          (Math.min(current, commands.length - 1) + step + commands.length) %
          Math.max(1, commands.length),
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (selected) selected.run();
      else if (query.trim()) void goSearch(query);
    }
  };

  let lastGroup: Command["group"] | null = null;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink-980/60 backdrop-blur-sm animate-[fade-in_120ms_var(--ease-out-quart)]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed top-[14vh] left-1/2 z-50 w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2",
            "overflow-hidden rounded-2xl border border-border-default bg-surface-overlay shadow-overlay",
            "animate-[palette-in_160ms_var(--ease-out-quart)]",
          )}
          onKeyDown={onKeyDown}
        >
          <DialogPrimitive.Title className="sr-only">
            {t.nav.palette.title}
          </DialogPrimitive.Title>

          <div className="flex items-center gap-3 border-b border-border-subtle px-4">
            {loading ? (
              <Loader2
                className="size-4 shrink-0 animate-spin text-tertiary"
                aria-hidden
              />
            ) : (
              <Search className="size-4 shrink-0 text-tertiary" aria-hidden />
            )}
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCursor(0);
              }}
              placeholder={t.nav.searchPlaceholder}
              className="h-13 min-w-0 flex-1 bg-transparent text-base text-primary placeholder:text-tertiary focus:outline-none"
              role="combobox"
              aria-expanded
              aria-controls="command-list"
              aria-activedescendant={
                selected ? `command-${selected.id}` : undefined
              }
              aria-autocomplete="list"
            />
            <kbd className="rounded border border-border-subtle bg-surface-raised px-1.5 py-0.5 text-2xs text-tertiary">
              {t.nav.palette.escape}
            </kbd>
          </div>

          <div
            ref={listRef}
            id="command-list"
            role="listbox"
            aria-label={t.nav.palette.results}
            className="max-h-[min(26rem,60vh)] overflow-auto p-2"
          >
            {commands.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-tertiary">
                {query.trim().length >= 2 && !loading
                  ? t.nav.palette.noResult
                  : t.nav.palette.typeMore}
              </p>
            ) : (
              commands.map((command, index) => {
                const heading =
                  command.group !== lastGroup ? command.group : null;
                lastGroup = command.group;
                const isSelected = command.id === selected?.id;
                return (
                  <React.Fragment key={command.id}>
                    {heading && (
                      <p className="label-eyebrow px-3 pt-2.5 pb-1.5">
                        {t.nav.palette.groups[heading]}
                      </p>
                    )}
                    <div
                      id={`command-${command.id}`}
                      data-command={command.id}
                      role="option"
                      aria-selected={isSelected}
                      onMouseMove={() => setCursor(index)}
                      onClick={command.run}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2",
                        isSelected
                          ? "bg-surface-active text-primary"
                          : "text-secondary",
                      )}
                    >
                      <command.icon
                        className={cn(
                          "size-4 shrink-0",
                          isSelected ? "text-accent" : "text-tertiary",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {command.label}
                          </span>
                          {command.hit?.urgent && <UrgentMarker />}
                        </span>
                        {command.detail && (
                          <span className="block truncate text-2xs text-tertiary">
                            {command.detail}
                          </span>
                        )}
                      </span>
                      {command.hit && (
                        <StudyStatusChip status={command.hit.status} />
                      )}
                      {isSelected && (
                        <ArrowRight
                          className="size-3.5 shrink-0 text-tertiary"
                          aria-hidden
                        />
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-4 border-t border-border-subtle bg-surface-raised/60 px-4 py-2 text-2xs text-tertiary">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded border border-border-subtle px-1">↑</kbd>
              <kbd className="rounded border border-border-subtle px-1">↓</kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="flex items-center rounded border border-border-subtle px-1">
                <CornerDownLeft className="size-2.5" aria-hidden />
              </kbd>
              ouvrir
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Raccourcis d'ouverture de la palette : ⌘K / Ctrl+K partout, `/` hors
 * d'un champ de saisie — dans un compte-rendu, `/` doit rester un
 * caractère.
 */
export function usePaletteShortcut(open: () => void) {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const combo =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (combo || (event.key === "/" && !isTyping(event.target))) {
        event.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);
}
