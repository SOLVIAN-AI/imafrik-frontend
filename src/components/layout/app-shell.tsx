"use client";

import {
  FileText,
  LayoutList,
  Settings,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Icônes disponibles pour la navigation.
 *
 * La navigation est définie côté serveur, mais rendue côté client. Un
 * composant React ne traverse pas cette frontière : on transmet donc une
 * clé — sérialisable — et c'est ce module qui résout l'icône.
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
  /** Compteur affiché à droite — nombre d'examens en attente, par exemple. */
  count?: number;
}

/**
 * Barre de navigation latérale.
 *
 * Étroite et fixe. Un panneau rétractable ferait gagner quelques dizaines
 * de pixels au prix d'un clic et d'une hésitation à chaque changement de
 * section : mauvais échange pour quelqu'un qui y passe sa journée.
 *
 * L'élément actif est signalé par un rail vertical, pas par un fond
 * coloré. Un aplat d'accent dans le châssis entrerait en concurrence avec
 * les images médicales affichées juste à côté.
 */
function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="flex h-full w-56 shrink-0 flex-col border-r border-border-subtle bg-surface-raised"
    >
      <div className="flex h-12 items-center gap-2 px-4">
        <Mark />
        <span className="text-sm font-semibold tracking-tight">IMAFRIK</span>
      </div>

      <ul className="flex flex-1 flex-col gap-0.5 px-2 py-2">
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
                  "group relative flex h-8 items-center gap-2.5 rounded-md pr-2 pl-3",
                  "text-sm transition-colors duration-100 ease-(--ease-out-quart)",
                  active
                    ? "bg-surface-hover font-medium text-primary"
                    : "text-secondary hover:bg-surface-hover hover:text-primary",
                )}
              >
                {active && (
                  <span
                    className="absolute top-1.5 bottom-1.5 -left-2 w-0.5 rounded-full bg-accent"
                    aria-hidden
                  />
                )}
                <Icon className="size-4 shrink-0" aria-hidden />
                <span className="flex-1 truncate">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="text-2xs text-tertiary tabular-nums">
                    {item.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Marque de l'application.
 *
 * Un carré traversé d'une diagonale claire : la coupe d'un plan de scanner.
 * Assez abstrait pour rester lisible à 20 px, assez spécifique pour ne pas
 * ressembler au logo d'un outil de gestion de projet.
 */
function Mark() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-5 shrink-0"
      aria-hidden
      fill="none"
    >
      <rect
        x="1.5"
        y="1.5"
        width="17"
        height="17"
        rx="4"
        className="stroke-border-strong"
        strokeWidth="1.5"
      />
      <path d="M5 14.5 15 5.5" className="stroke-accent" strokeWidth="2" strokeLinecap="round" />
      <circle cx="7" cy="7" r="1.5" className="fill-accent" />
    </svg>
  );
}

/**
 * En-tête de page.
 *
 * Le titre reste discret : dans un outil qu'on utilise huit heures par
 * jour, on sait où l'on est. La place va aux actions et aux filtres, pas
 * à un titre décoratif.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border-subtle px-5">
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="truncate text-xs text-tertiary">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/**
 * Ossature de l'application : navigation à gauche, contenu à droite.
 *
 * La hauteur est bloquée à celle de la fenêtre et le défilement confié à
 * la zone de contenu. Une page qui défile entièrement ferait disparaître
 * la navigation et les filtres — inacceptable dans une liste longue.
 */
export function AppShell({
  nav,
  children,
}: {
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-surface-base">
      <Sidebar items={nav} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
