import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * État vide : ce qu'un écran affiche quand il n'a rien à montrer.
 *
 * **Il dit ce qui se passe, pas seulement qu'il ne se passe rien.** Une
 * file vide est une bonne nouvelle dans ce métier ; une recherche sans
 * résultat appelle une autre recherche ; une liste encore jamais remplie
 * explique comment elle se remplit. Un état vide générique ressemble à
 * une erreur de chargement, et c'est ainsi qu'il serait lu.
 *
 * L'icône repose dans deux anneaux concentriques à peine tracés : un
 * repère visuel assez présent pour que l'écran ne paraisse pas cassé,
 * assez discret pour ne pas ressembler à une alerte.
 *
 * Un seul composant pour toute l'application : les cinq variantes écrites
 * à la main qu'il remplace avaient déjà commencé à diverger.
 *
 * @param icon   Repère du contenu attendu (examen, compte-rendu…).
 * @param title  Ce qui se passe, en une phrase courte.
 * @param detail Ce qui fera apparaître du contenu, ou quoi faire.
 * @param action Bouton ou lien facultatif, sous le texte.
 */
export function EmptyState({
  icon: Icon,
  title,
  detail,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  detail?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        "animate-[fade-in_300ms_var(--ease-out-quart)]",
        className,
      )}
    >
      <div className="relative mb-5 flex size-20 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full border border-border-subtle"
          aria-hidden
        />
        <span
          className="absolute inset-3 rounded-full border border-border-default bg-surface-sunken/60"
          aria-hidden
        />
        <span
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(closest-side, var(--glow-accent), transparent)",
          }}
          aria-hidden
        />
        <Icon className="relative size-5 text-secondary" aria-hidden />
      </div>
      <p className="text-base font-medium">{title}</p>
      {detail && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-tertiary">
          {detail}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
