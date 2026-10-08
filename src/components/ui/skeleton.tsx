import { cn } from "@/lib/utils";

/**
 * Bloc d'attente : la silhouette d'un contenu en cours de chargement.
 *
 * **Une silhouette plutôt qu'une roue.** Elle annonce la forme de ce qui
 * arrive — un tableau, des mesures — et l'écran ne « saute » pas quand le
 * contenu la remplace. Une roue centrée sur une page vide donne
 * l'impression que rien ne se passe, et la mise en page change d'un coup
 * à l'arrivée des données.
 *
 * Le reflet qui la parcourt est lent et peu contrasté : il dit « en
 * cours », sans attirer l'œil d'un radiologue qui regarde ailleurs.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-active/70",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:animate-[shimmer_1.6s_var(--ease-in-out-quart)_infinite]",
        "after:bg-linear-to-r after:from-transparent after:via-white/[0.045] after:to-transparent",
        className,
      )}
      aria-hidden
    />
  );
}
