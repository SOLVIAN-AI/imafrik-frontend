"use client";

import {
  Building2,
  Check,
  ChevronsUpDown,
  FileStack,
  FileText,
  Hospital,
  LayoutDashboard,
  LayoutList,
  LogOut,
  Settings,
  Stethoscope,
  Upload,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLockup } from "@/components/layout/brand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, useSession, type Membership } from "@/lib/demo/session";
import { navigationFor, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Icônes de navigation, résolues par clé.
 *
 * La navigation est déclarée comme une donnée (`src/lib/navigation.ts`),
 * pas comme du JSX : un composant React ne se sérialise pas, et cette
 * table est ce qui permet de décrire un menu sans importer d'icônes là
 * où on décrit des routes.
 */
const NAV_ICONS = {
  worklist: LayoutList,
  studies: Stethoscope,
  reports: FileText,
  templates: FileStack,
  dashboard: LayoutDashboard,
  send: Upload,
  team: Users,
  settings: Settings,
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
  const { memberships, active, setActive } = useSession();
  const ActiveIcon = ORG_ICONS[active.organizationKind];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Changer d'organisation"
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
              {ROLE_LABELS[active.role]}
            </span>
          </span>
          <ChevronsUpDown
            className="size-3.5 shrink-0 text-tertiary transition-colors group-hover:text-secondary"
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Mes organisations</DropdownMenuLabel>
        {memberships.map((membership) => (
          <OrganisationItem
            key={membership.id}
            membership={membership}
            selected={membership.id === active.id}
            onSelect={() => setActive(membership.id)}
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
  const Icon = ORG_ICONS[membership.organizationKind];

  return (
    <DropdownMenuItem onSelect={onSelect}>
      <Icon className="size-3.5 shrink-0 text-tertiary" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium">
          {membership.organizationName}
        </span>
        <span className="truncate text-2xs text-tertiary">
          {ROLE_LABELS[membership.role]} · {membership.city}
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
            "mx-2 mb-2 flex h-11 w-[calc(100%-1rem)] items-center gap-2.5 rounded-lg px-2.5",
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
          <span className="min-w-0 flex-1 truncate text-left text-xs font-medium">
            {user.fullName}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/parametres">
            <User className="size-3.5 text-tertiary" aria-hidden />
            Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-urgent">
          <LogOut className="size-3.5" aria-hidden />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Une entrée de navigation. */
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = NAV_ICONS[item.icon];

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-8.5 items-center gap-2.5 rounded-md px-2.5",
        "text-sm transition-all duration-100 ease-(--ease-out-quart)",
        active
          ? "bg-surface-hover font-medium text-primary shadow-edge"
          : "text-secondary hover:bg-surface-hover/60 hover:text-primary",
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
      <span className="flex-1 truncate">{item.label}</span>
      {item.count !== undefined && item.count > 0 && (
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-2xs font-medium tabular-nums",
            item.urgent ? "bg-urgent-muted text-urgent" : "text-tertiary",
          )}
        >
          {item.count}
        </span>
      )}
    </Link>
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
 * change le portail sans recharger la page.
 *
 * L'élément actif est signalé par un rail et une surface, jamais par un
 * aplat d'accent : une zone colorée dans le châssis entrerait en
 * concurrence avec les images médicales affichées à côté.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { active } = useSession();
  const groups = navigationFor(active.role);

  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        "flex h-full w-60 shrink-0 flex-col",
        "border-r border-border-subtle",
        // Dégradé très léger de haut en bas : la navigation paraît
        // éclairée par le haut, comme le reste de l'interface.
        "bg-linear-to-b from-surface-raised to-surface-base",
      )}
    >
      <BrandLockup />
      <OrganisationSwitcher />

      <div className="mt-4 flex flex-1 flex-col gap-5 overflow-y-auto px-2">
        {groups.map((group, index) => (
          <div key={group.label ?? index}>
            {group.label && (
              <p className="label-eyebrow mb-1 px-2.5">{group.label}</p>
            )}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`)
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border-subtle pt-2">
        <UserCard />
      </div>
    </nav>
  );
}
