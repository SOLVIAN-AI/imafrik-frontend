import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Forme de l'espace de lecture, avant qu'il soit utilisable.
 *
 * Purement CSS, donc juste à toute largeur sans attendre le JavaScript :
 * sur un téléphone, le volet des images occupe tout l'écran (l'onglet
 * ouvert par défaut) ; à partir de 1024 px, il prend 56 % et le
 * compte-rendu le reste, comme la disposition côte à côte qui suivra.
 *
 * Sert à l'ouverture d'un examen (`loading.tsx`) et au premier rendu de
 * l'espace de lecture, tant que la largeur de l'écran n'est pas connue :
 * deviner la disposition côté serveur faisait apparaître, sur un
 * téléphone, la disposition côte à côte serrée dans 390 px avant la bonne.
 *
 * `data-pending-layout` signale aux tests de bout en bout que l'écran
 * n'a pas encore sa forme définitive (`settle` attend sa disparition).
 */
export function WorkspaceSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col lg:flex-row"
      data-pending-layout
    >
      <div className="flex min-h-0 flex-1 items-center justify-center bg-black lg:w-[56%] lg:flex-none">
        <Loader2 className="size-5 animate-spin text-ink-600" aria-hidden />
      </div>
      <div className="hidden flex-1 space-y-5 border-l border-border-default p-6 lg:block">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-2.5">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
