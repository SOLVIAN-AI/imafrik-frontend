import { Panel } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Attente d'un écran des portails.
 *
 * Affichée dès le clic, pendant que le serveur interroge le service : la
 * navigation répond tout de suite, et la silhouette — titre, mesures,
 * lignes — correspond à la forme commune des écrans de liste. Sans elle,
 * l'écran précédent restait figé jusqu'à la réponse, et l'on recliquait.
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      role="status"
      aria-label="Chargement"
    >
      <div className="flex items-end justify-between gap-4 px-6 pt-6 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:px-6 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Panel key={index} className="flex items-center gap-3.5 px-4 py-3.5">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          </Panel>
        ))}
      </div>
      <div className="px-4 pb-6 sm:px-6">
        <Panel className="overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-3">
            <Skeleton className="h-2.5 w-2/3" />
          </div>
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-6 border-b border-border-subtle px-4 py-3 last:border-0"
            >
              <div className="w-40 space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="ml-auto h-3 w-12" />
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
