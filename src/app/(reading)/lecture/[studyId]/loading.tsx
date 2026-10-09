import { WorkspaceSkeleton } from "@/components/editor/workspace-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { getMessages } from "@/i18n/server";

/**
 * Ouverture d'un examen.
 *
 * La forme de l'écran de lecture est posée tout de suite — le volet noir
 * des images, le compte-rendu à droite — pendant que le serveur obtient
 * l'examen et son jeton de visualisation. Le radiologue voit que son clic
 * a porté, et l'écran ne se recompose pas à l'arrivée des données.
 */
export default async function Loading() {
  const { t } = await getMessages();
  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      role="status"
      aria-label={t.reading.page.loading}
    >
      <div className="flex h-13 shrink-0 items-center gap-3 border-b border-border-subtle px-4">
        <Skeleton className="size-8 rounded-md" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-2.5 w-64" />
        </div>
        <Skeleton className="ml-auto h-8 w-36 rounded-md" />
      </div>
      <WorkspaceSkeleton />
    </div>
  );
}
