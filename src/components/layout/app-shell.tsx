"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useSession } from "@/lib/demo/session";
import { homeFor, isRouteAllowed } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Ramène l'utilisateur chez lui quand il change de casquette.
 *
 * Changer d'organisation change de portail. Rester sur l'écran courant
 * afficherait, dans le meilleur des cas, une page vide — et dans le pire,
 * laisserait croire qu'un écran réservé à un autre rôle est accessible.
 *
 * La redirection remplace l'entrée d'historique au lieu d'en empiler une :
 * revenir en arrière doit ramener où l'on était *avant* la bascule, pas
 * rejouer une redirection en boucle.
 */
function useRoleRouting() {
  const { active, ready } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    // Sans cette attente, l'organisation par défaut — celle du rendu
    // serveur — provoquerait une redirection avant même que le choix
    // réel de l'utilisateur soit lu, et l'on rebondirait d'un portail à
    // l'autre à chaque chargement.
    if (!ready) return;
    if (isRouteAllowed(active.role, pathname)) return;
    router.replace(homeFor(active.role));
  }, [ready, active.role, pathname, router]);
}

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
 *
 * Le châssis ne reçoit rien : navigation et identité viennent de la
 * session, donc du rôle dans l'organisation active. Les passer en
 * propriétés obligerait chaque disposition à les recalculer, et le jour
 * où une page se tromperait, l'utilisateur verrait une navigation qui ne
 * correspond pas à ses droits.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  useRoleRouting();

  return (
    <div className="flex h-dvh overflow-hidden bg-surface-base">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
