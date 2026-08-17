"use client";

import {
  Building2,
  ChevronsUpDown,
  FileText,
  LayoutList,
  Settings,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLockup } from "@/components/layout/brand";
import { cn } from "@/lib/utils";

/**
 * Icônes de navigation, résolues côté client.
 *
 * La navigation est déclarée côté serveur mais rendue côté client. Un
 * composant React ne traverse pas cette frontière : on transmet une clé
 * sérialisable, et ce module fait la correspondance.
 */
const NAV_ICONS = {
  worklist: LayoutList,
  studies: Stethoscope,
  reports: FileText,
  settings: Settings,
} satisfies Record<string, LucideIcon>;

export type NavIconKey = keyof typeof NAV_ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconKey;
  /** Compteur affiché à droite. Masqué à zéro : un « 0 » attire l'œil pour rien. */
  count?: number;
  /** Signale que le compteur contient des urgences. */
  urgent?: boolean;
}

export interface CurrentUser {
  name: string;
  role: string;
  organisation: string;
}

/**
 * Sélecteur d'organisation.
 *
 * Un utilisateur peut appartenir à plusieurs organisations, avec un rôle
 * par organisation (AD-7). Le sélecteur reste visible en permanence :
 * savoir sous quelle casquette on agit détermine ce qu'on voit et ce
 * qu'on a le droit de faire — le cacher dans un menu serait une source
 * d'erreur.
 */
function OrganisationSwitcher({ user }: { user: CurrentUser }) {
  return (
    <button
      type="button"
      className={cn(
        "group mx-2 flex h-11 items-center gap-2.5 rounded-lg px-2.5",
        "border border-border-subtle bg-surface-base/60",
        "shadow-edge transition-colors duration-100",
        "hover:border-border-default hover:bg-surface-hover",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-muted">
        <Building2 className="size-3.5 text-accent" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start">
        <span className="w-full truncate text-xs font-medium">
          {user.organisation}
        </span>
        <span className="w-full truncate text-2xs text-tertiary">{user.role}</span>
      </span>
      <ChevronsUpDown
        className="size-3.5 shrink-0 text-tertiary transition-colors group-hover:text-secondary"
        aria-hidden
      />
    </button>
  );
}

/**
 * Identité de l'utilisateur connecté, en pied de navigation.
 *
 * Sa présence n'est pas décorative : dans un outil qui trace chaque
 * accès à un examen, savoir en permanence sous quel compte on agit fait
 * partie du contrat.
 */
function UserCard({ user }: { user: CurrentUser }) {
  const initials = user.name
    .split(" ")
    .filter((part) => /^[A-ZÀ-Ý]/.test(part))
    .slice(-2)
    .map((part) => part[0])
    .join("");

  return (
    <button
      type="button"
      className={cn(
        "mx-2 mb-2 flex h-11 items-center gap-2.5 rounded-lg px-2.5",
        "transition-colors duration-100 hover:bg-surface-hover",
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
        {user.name}
      </span>
    </button>
  );
}

/**
 * Navigation latérale.
 *
 * Fixe et étroite. Un panneau rétractable ferait gagner quelques dizaines
 * de pixels au prix d'un clic à chaque changement de section : mauvais
 * échange pour quelqu'un qui y passe sa journée.
 *
 * L'élément actif est signalé par un rail et une surface, jamais par un
 * aplat d'accent : une zone colorée dans le châssis entrerait en
 * concurrence avec les images médicales affichées à côté.
 */
export function Sidebar({
  items,
  user,
}: {
  items: NavItem[];
  user: CurrentUser;
}) {
  const pathname = usePathname();

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
      <OrganisationSwitcher user={user} />

      <ul className="mt-4 flex flex-1 flex-col gap-0.5 px-2">
        {items.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
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
                      item.urgent
                        ? "bg-urgent-muted text-urgent"
                        : "text-tertiary",
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border-subtle pt-2">
        <UserCard user={user} />
      </div>
    </nav>
  );
}
