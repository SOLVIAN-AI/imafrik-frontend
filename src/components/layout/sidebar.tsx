"use client";

import {
  Activity,
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  ChevronsUpDown,
  FileStack,
  FileText,
  Gauge,
  GraduationCap,
  Hospital,
  Inbox,
  LayoutDashboard,
  LayoutList,
  Loader2,
  LogOut,
  type LucideIcon,
  Receipt,
  Router,
  ScrollText,
  Server,
  Settings,
  SlidersHorizontal,
  Stethoscope,
  Upload,
  User,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { BrandLockup } from "@/components/brand/brand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/components/providers/session-provider";
import {
  CLINIC_VIEW_ROOT,
  clinicIdOf,
  clinicScreenOf,
  clinicViewPath,
  type ViewableClinic,
} from "@/lib/clinic-view";
import { formatPersonName } from "@/lib/format";
import { clearLocalData } from "@/lib/local-data";
import {
  isActive,
  navigationBlocks,
  navigationFor,
  type NavBlock,
  type NavCounts,
  type NavItem,
} from "@/lib/navigation";
import { setActiveMembership, signOut } from "@/lib/session/actions";
import type { Membership } from "@/lib/session/types";
import { cn } from "@/lib/utils";
import { useMessages } from "@/i18n/client";

/**
 * Icônes de navigation, résolues par clé.
 *
 * La navigation est déclarée comme une donnée (`src/lib/navigation.ts`),
 * pas comme du JSX : un composant React ne se sérialise pas, et cette
 * table est ce qui permet de décrire un menu sans importer d'icônes là
 * où on décrit des routes.
 */
export const NAV_ICONS = {
  worklist: LayoutList,
  studies: Stethoscope,
  reports: FileText,
  templates: FileStack,
  dashboard: LayoutDashboard,
  send: Upload,
  team: Users,
  settings: Settings,
  inbox: Inbox,
  cockpit: Gauge,
  analytics: BarChart3,
  flow: Activity,
  organizations: Building2,
  gateways: Router,
  users: UserCog,
  billing: Receipt,
  system: Server,
  audit: ScrollText,
  controls: SlidersHorizontal,
  training: GraduationCap,
} satisfies Record<string, LucideIcon>;

export type NavIconKey = keyof typeof NAV_ICONS;

/** Icône distinguant les deux natures d'organisation. */
const ORG_ICONS = {
  clinic: Hospital,
  radiology_group: Building2,
} as const;

/**
 * Sélecteur d'organisation.
 *
 * **C'est la pièce maîtresse du châssis.** Un utilisateur peut appartenir
 * à plusieurs organisations avec un rôle différent dans chacune (AD-7) ;
 * changer d'organisation ne change pas seulement un filtre, cela change
 * le portail entier — la navigation, les écrans, les droits.
 *
 * Il reste donc visible en permanence et affiche le rôle sous le nom :
 * savoir sous quelle casquette on agit détermine ce qu'on voit et ce
 * qu'on a le droit de faire. Le cacher dans un menu serait une source
 * d'erreur.
 */
function OrganisationSwitcher() {
  const { memberships, active } = useSession();
  const t = useMessages();
  const [pending, startTransition] = React.useTransition();
  const ActiveIcon = ORG_ICONS[active.organizationKind];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group mx-2 flex h-11 items-center gap-2.5 rounded-lg px-2.5",
            "border border-border-subtle bg-surface-base/60",
            "shadow-edge transition-colors duration-100",
            "hover:border-border-default hover:bg-surface-hover",
            "data-[state=open]:border-border-default data-[state=open]:bg-surface-hover",
          )}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-muted">
            <ActiveIcon className="size-3.5 text-accent" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start">
            <span className="w-full truncate text-xs font-medium">
              {active.organizationName}
            </span>
            <span className="w-full truncate text-2xs text-tertiary">
              {t.common.roles[active.role]}
            </span>
          </span>
          {/* Le nom accessible commence par le texte visible (WCAG 2.5.3) :
              une commande vocale « cliquer sur Clinique A » doit trouver
              ce bouton. L'action vient ensuite, pour les lecteurs d'écran. */}
          <span className="sr-only">{t.nav.switchOrganisation}</span>
          {pending ? (
            <Loader2
              className="size-3.5 shrink-0 animate-spin text-accent"
              aria-hidden
            />
          ) : (
            <ChevronsUpDown
              className="size-3.5 shrink-0 text-tertiary transition-colors group-hover:text-secondary"
              aria-hidden
            />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{t.nav.myOrganisations}</DropdownMenuLabel>
        {memberships.map((membership) => (
          <OrganisationItem
            key={membership.id}
            membership={membership}
            selected={membership.id === active.id}
            onSelect={() =>
              startTransition(async () => {
                const result = await setActiveMembership(membership.id);
                if (!result.ok) toast.error(result.error);
              })
            }
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Une organisation dans le sélecteur. */
function OrganisationItem({
  membership,
  selected,
  onSelect,
}: {
  membership: Membership;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useMessages();
  const Icon = ORG_ICONS[membership.organizationKind];

  return (
    <DropdownMenuItem onSelect={onSelect}>
      <Icon className="size-3.5 shrink-0 text-tertiary" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium">
          {membership.organizationName}
        </span>
        <span className="truncate text-2xs text-tertiary">
          {t.common.roles[membership.role]} · {membership.city}
        </span>
      </span>
      {selected && (
        <Check className="size-3.5 shrink-0 text-accent" aria-hidden />
      )}
    </DropdownMenuItem>
  );
}

/**
 * Identité de l'utilisateur connecté, en pied de navigation.
 *
 * Sa présence n'est pas décorative : dans un outil qui trace chaque
 * accès à un examen, savoir en permanence sous quel compte on agit fait
 * partie du contrat. Le menu qu'elle ouvre porte la déconnexion — seule
 * action irréversible du châssis, et donc la dernière du menu.
 */
function UserCard() {
  const { user } = useSession();
  const t = useMessages();
  const router = useRouter();

  const initials = user.fullName
    .split(" ")
    .filter((part) => /^[A-ZÀ-Ý]/.test(part))
    .slice(-2)
    .map((part) => part[0])
    .join("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "mx-2 mb-2 flex h-12 w-[calc(100%-1rem)] items-center gap-2.5 rounded-lg px-2.5",
            "transition-colors duration-100 hover:bg-surface-hover",
            "data-[state=open]:bg-surface-hover",
          )}
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full",
              "bg-linear-to-br from-accent-500 to-accent-700",
              "text-2xs font-semibold text-white",
            )}
            aria-hidden
          >
            {initials}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-xs font-medium">
              {formatPersonName(user.title, user.fullName)}
            </span>
            <span className="block truncate text-2xs text-tertiary">
              {user.email}
            </span>
          </span>
          <ChevronsUpDown
            className="size-3.5 shrink-0 text-tertiary"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel>
          {formatPersonName(user.title, user.fullName)}
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/parametres">
            <User className="size-3.5 text-tertiary" aria-hidden />
            {t.nav.myProfile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-urgent"
          onSelect={() => {
            // Brouillons et copies de secours vivent dans le navigateur :
            // sur un poste partagé, ils ne doivent pas survivre à la
            // session de celui qui les a saisis.
            clearLocalData();
            void signOut().then(() => {
              router.push("/connexion");
              router.refresh();
            });
          }}
        >
          <LogOut className="size-3.5" aria-hidden />
          {t.nav.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Choix de la clinique consultée, en tête de la vue des cliniques.
 *
 * La clinique est dans l'adresse (`/admin/vue-clinique/{clinique}/...`) :
 * la choisir, c'est y aller. On garde l'écran où l'on est (l'équipe d'une
 * clinique mène à l'équipe d'une autre) ; une fiche propre à la première
 * (un examen, un compte-rendu) ramène à sa liste.
 *
 * @param clinics  Cliniques proposées, par nom.
 * @param current  Clinique consultée, lue dans l'adresse ; `null` hors de la vue.
 * @param pathname Adresse courante.
 */
function ClinicPicker({
  clinics,
  current,
  pathname,
}: {
  clinics: readonly ViewableClinic[];
  current: string | null;
  pathname: string;
}) {
  const t = useMessages().clinicView.picker;
  const selected = clinics.find((clinic) => clinic.id === current);
  const label = current ? (selected?.name ?? t.label) : t.choose;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="clinic-picker"
          className={cn(
            "group mb-1 flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5",
            "border border-border-subtle text-sm transition-colors duration-100",
            "hover:border-border-default hover:bg-surface-hover",
            "data-[state=open]:border-border-default data-[state=open]:bg-surface-hover",
            current ? "font-medium text-primary" : "text-secondary",
          )}
        >
          <Hospital className="size-4 shrink-0 text-accent" aria-hidden />
          {/* Le nom accessible commence par le texte visible (WCAG 2.5.3). */}
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
          <span className="sr-only">{t.change}</span>
          <ChevronsUpDown
            className="size-3.5 shrink-0 text-tertiary transition-colors group-hover:text-secondary"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{t.label}</DropdownMenuLabel>
        {clinics.length === 0 ? (
          <DropdownMenuItem disabled>{t.empty}</DropdownMenuItem>
        ) : (
          clinics.map((clinic) => (
            <DropdownMenuItem key={clinic.id} asChild>
              {/* Jamais préchargé : ouvrir la vue d'une clinique se trace au
                  journal, ce que le simple survol d'une liste ne doit pas
                  faire. Un lien, et non un clic programmé : le tiroir du
                  téléphone se referme sur un lien suivi. */}
              <Link
                href={clinicViewPath(clinic.id, clinicScreenOf(pathname))}
                prefetch={false}
                aria-current={clinic.id === current ? "page" : undefined}
              >
                <Hospital
                  className="size-3.5 shrink-0 text-tertiary"
                  aria-hidden
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-medium">
                    {clinic.name}
                  </span>
                  {clinic.city && (
                    <span className="truncate text-2xs text-tertiary">
                      {clinic.city}
                    </span>
                  )}
                </span>
                {clinic.id === current && (
                  <Check
                    className="size-3.5 shrink-0 text-accent"
                    aria-hidden
                  />
                )}
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Une entrée de navigation. */
function NavLink({
  item,
  active,
  counts,
}: {
  item: NavItem;
  active: boolean;
  counts: NavCounts | null;
}) {
  const t = useMessages();
  const Icon = NAV_ICONS[item.icon];
  const count = item.count && counts ? counts[item.count] : 0;
  // Intention d'ouvrir la page : survol, focus clavier ou premier contact
  // tactile. C'est alors seulement qu'elle se précharge en entier.
  const [intent, setIntent] = React.useState(false);
  const showIntent = () => setIntent(true);
  const urgent =
    item.urgentCount && counts ? counts[item.urgentCount] > 0 : false;

  return (
    <Link
      href={item.href}
      // Préchargée en entier, données comprises, dès que l'on montre
      // l'intention de l'ouvrir : le survol précède le clic de 100 à 300 ms,
      // assez pour que la page soit prête. Pas avant : préchargées d'office,
      // les pages du menu étaient toutes relues à chaque rafraîchissement
      // de la file (cinq requêtes au lieu d'une, toutes les 30 secondes).
      // La page courante ne se précharge jamais. Gardée 30 s au plus
      // (staleTimes, next.config.ts).
      prefetch={active ? false : intent ? true : null}
      onMouseEnter={showIntent}
      onFocus={showIntent}
      onTouchStart={showIntent}
      aria-current={active ? "page" : undefined}
      data-tour={`nav-${item.key}`}
      className={cn(
        "group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5",
        "text-sm transition-all duration-100 ease-(--ease-out-quart)",
        // L'élément actif porte la teinte de marque plutôt qu'un simple
        // gris : c'est une surface de quelques centaines de pixels, très
        // loin des images, et c'est ce qui fait qu'on retrouve sa place
        // d'un coup d'œil dans une journée de travail.
        active
          ? "bg-accent-muted font-medium text-primary"
          : "text-secondary hover:bg-surface-hover hover:text-primary",
      )}
    >
      {active && (
        <span
          className="absolute top-2 bottom-2 -left-2 w-[3px] rounded-r-full bg-accent"
          aria-hidden
        />
      )}
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-accent" : "text-tertiary group-hover:text-secondary",
        )}
        aria-hidden
      />
      <span className="flex-1 truncate">{t.nav.items[item.key]}</span>
      {count > 0 && (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-2xs font-medium tabular-nums",
            urgent ? "bg-urgent-muted text-urgent" : "text-tertiary",
          )}
          aria-label={urgent ? t.nav.countWithUrgent(count) : String(count)}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

/** Préfixe des préférences d'ouverture des blocs repliables, suivi du bloc. */
const FOLD_PREFIX = "imafrik-navigation:";

/** Aucun abonnement : un choix fait dans cet onglet passe par l'état du bloc. */
const noSubscribe = () => () => {};

/**
 * Le dernier choix d'ouverture d'un bloc sur cet appareil. Le stockage peut
 * être refusé (navigation privée, données du site bloquées) : le bloc reste
 * alors replié par défaut.
 */
function readFold(key: string): boolean {
  try {
    return window.localStorage.getItem(FOLD_PREFIX + key) === "open";
  } catch {
    return false;
  }
}

function writeFold(key: string, open: boolean): void {
  try {
    window.localStorage.setItem(FOLD_PREFIX + key, open ? "open" : "closed");
  } catch {
    // Stockage refusé : le choix vaut pour la page en cours.
  }
}

/**
 * Un bloc de la navigation : son titre, puis ses paquets d'entrées séparés
 * d'un filet.
 *
 * Un bloc repliable s'ouvre de lui-même sur l'une de ses pages, pour qu'on
 * voie toujours où l'on est ; ailleurs, il suit le dernier choix fait sur
 * cet appareil. Un clic sur son titre l'emporte, le temps de la page.
 */
function NavBlockView({
  block: declared,
  counts,
  pathname,
  clinics,
}: {
  block: NavBlock;
  counts: NavCounts | null;
  pathname: string;
  clinics: readonly ViewableClinic[];
}) {
  const t = useMessages();
  const listId = React.useId();
  // Vue des cliniques : ses entrées mènent aux écrans de la clinique
  // consultée, et n'existent pas tant qu'aucune n'est choisie.
  const clinicId = declared.clinicScoped ? clinicIdOf(pathname) : null;
  const block = declared.clinicScoped
    ? {
        ...declared,
        sections: clinicId
          ? declared.sections.map((items) =>
              items.map((item) => ({
                ...item,
                href: clinicViewPath(clinicId, item.href),
              })),
            )
          : [],
      }
    : declared;
  const remembered = React.useSyncExternalStore(
    noSubscribe,
    () => (block.key ? readFold(block.key) : false),
    () => false,
  );
  const [choice, setChoice] = React.useState<{
    open: boolean;
    path: string;
  } | null>(null);
  const containsActive =
    (block.clinicScoped && pathname.startsWith(`${CLINIC_VIEW_ROOT}/`)) ||
    block.sections.some((items) =>
      items.some((item) => isActive(item, pathname)),
    );
  const open =
    !block.collapsible ||
    (choice?.path === pathname ? choice.open : containsActive || remembered);
  const title = block.key ? t.nav.groups[block.key] : null;

  const toggle = () => {
    setChoice({ open: !open, path: pathname });
    if (block.key) writeFold(block.key, !open);
  };

  return (
    <div>
      {title &&
        (block.collapsible ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={toggle}
            data-tour={block.key ? `nav-group-${block.key}` : undefined}
            className="label-eyebrow mb-1 flex w-full items-center justify-between rounded-md px-2.5 py-0.5 text-left transition-colors hover:text-secondary"
          >
            {title}
            <ChevronDown
              className={cn(
                "size-3 shrink-0 transition-transform duration-150",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        ) : (
          <p className="label-eyebrow mb-1 px-2.5">{title}</p>
        ))}
      <div id={listId} hidden={!open}>
        {block.clinicScoped && (
          <ClinicPicker
            clinics={clinics}
            current={clinicId}
            pathname={pathname}
          />
        )}
        {block.sections.map((items, index) => (
          <React.Fragment key={items[0]?.href ?? index}>
            {index > 0 && (
              <div
                className="mx-2.5 my-1.5 border-t border-border-subtle"
                aria-hidden
              />
            )}
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    counts={counts}
                    active={isActive(item, pathname)}
                  />
                </li>
              ))}
            </ul>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * Navigation latérale.
 *
 * Fixe et étroite. Un panneau rétractable ferait gagner quelques dizaines
 * de pixels au prix d'un clic à chaque changement de section : mauvais
 * échange pour quelqu'un qui y passe sa journée. L'écran de lecture, lui,
 * s'en passe entièrement — c'est là que les pixels comptent vraiment.
 *
 * Son contenu vient du **rôle dans l'organisation active** : la clinique
 * et le radiologue ne voient pas la même chose, et changer d'organisation
 * change le portail sans recharger la page. Les compteurs viennent du
 * service, calculés sur le périmètre réel de l'utilisateur ; `null` quand
 * il est injoignable — la navigation reste utilisable, sans chiffres.
 *
 * L'élément actif est signalé par un rail et une surface, jamais par un
 * aplat d'accent : une zone colorée dans le châssis entrerait en
 * concurrence avec les images médicales affichées à côté.
 */
export function Sidebar({
  counts,
  clinics = [],
  className,
}: {
  counts: NavCounts | null;
  /** Équipe IMAFRIK : les cliniques de la vue des cliniques. */
  clinics?: readonly ViewableClinic[];
  className?: string;
}) {
  const pathname = usePathname();
  const { active } = useSession();
  const t = useMessages();
  const groups = navigationFor(active.role);

  return (
    <nav
      aria-label={t.nav.mainNavigation}
      className={cn(
        "flex h-full w-60 shrink-0 flex-col",
        "border-r border-border-subtle",
        className,
        // Dégradé très léger de haut en bas : la navigation paraît
        // éclairée par le haut, comme le reste de l'interface.
        "bg-linear-to-b from-surface-raised to-surface-base",
      )}
    >
      <BrandLockup />
      <OrganisationSwitcher />

      <div className="mt-4 flex flex-1 flex-col gap-5 overflow-y-auto px-2">
        {navigationBlocks(groups).map((block, index) => (
          <NavBlockView
            key={block.key ?? index}
            block={block}
            counts={counts}
            pathname={pathname}
            clinics={clinics}
          />
        ))}
      </div>

      <div className="border-t border-border-subtle pt-2">
        <UserCard />
      </div>
    </nav>
  );
}
