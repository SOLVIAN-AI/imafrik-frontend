import {
  Sidebar,
  type CurrentUser,
  type NavItem,
} from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

export type {
  NavItem,
  NavIconKey,
  CurrentUser,
} from "@/components/layout/sidebar";

/**
 * En-tête de page.
 *
 * Le titre porte enfin du poids typographique : dans la version
 * précédente il se confondait avec le corps de texte, et l'écran
 * paraissait inachevé. La hiérarchie doit se voir même sans lire.
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
    <header className="flex shrink-0 items-end justify-between gap-4 px-6 pt-5 pb-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-[-0.015em]">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 truncate text-xs text-tertiary">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

/**
 * Conteneur d'une surface élevée : carte, panneau, tableau.
 *
 * Regroupe les trois attributs qui donnent son épaisseur à une surface —
 * fond, bordure et arête claire supérieure. Les répéter à la main
 * finirait par produire des variations involontaires d'un écran à
 * l'autre.
 */
export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-surface-raised shadow-raised",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Ossature de l'application.
 *
 * Hauteur bloquée à celle de la fenêtre, défilement confié au contenu :
 * une page qui défile entièrement ferait disparaître la navigation et les
 * filtres, inacceptable dans une liste longue.
 */
export function AppShell({
  nav,
  user,
  children,
}: {
  nav: NavItem[];
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-surface-base">
      <Sidebar items={nav} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
