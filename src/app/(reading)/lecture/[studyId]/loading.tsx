import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Ouverture d'un examen.
 *
 * La forme de l'écran de lecture est posée tout de suite — le volet noir
 * des images, le compte-rendu à droite — pendant que le serveur obtient
 * l'examen et son jeton de visualisation. Le radiologue voit que son clic
 * a porté, et l'écran ne se recompose pas à l'arrivée des données.
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      role="status"
      aria-label="Ouverture de l’examen"
    >
      <div className="flex h-13 shrink-0 items-center gap-3 border-b border-border-subtle px-4">
        <Skeleton className="size-8 rounded-md" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-2.5 w-64" />
        </div>
        <Skeleton className="ml-auto h-8 w-36 rounded-md" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[56%] items-center justify-center bg-black">
          <Loader2 className="size-5 animate-spin text-ink-600" aria-hidden />
        </div>
        <div className="flex-1 space-y-5 border-l border-border-default p-6">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2.5">
              <Skeleton className="h-2.5 w-28" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
