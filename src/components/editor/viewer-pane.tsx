"use client";

import { Archive, ImageOff, Maximize2 } from "lucide-react";

import { DateTime } from "@/components/domain/date-time";
import { SimulatedScan } from "@/components/editor/simulated-scan";
import { Button } from "@/components/ui/button";
import type { Study } from "@/lib/data/studies";
import { cn } from "@/lib/utils";

/**
 * Volet d'affichage des images.
 *
 * Le viewer OHIF est chargé dans une `iframe` plutôt qu'intégré comme
 * bibliothèque : c'est une application à part entière, avec son propre
 * cycle de vie et ses propres dépendances de rendu. L'isoler nous permet
 * de la mettre à jour sans toucher au portail, et lui évite d'entrer en
 * conflit avec React.
 *
 * L'URL est **construite côté serveur** et porte un jeton de visualisation
 * à durée de vie courte (stocké dans Redis, jamais persisté). Elle n'est
 * donc pas devinable et ne survit pas à la session : c'est ce jeton que
 * le plugin d'autorisation d'Orthanc validera à chaque requête DICOMweb.
 *
 * Quand le jeton n'a pas pu être obtenu, `viewerUrl` est absent et le
 * volet affiche un état explicite : un cadre vide laisserait croire à un
 * chargement bloqué. En démonstration, où aucun PACS n'existe, il montre
 * une coupe simulée et signalée comme telle — voir {@link SimulatedScan}.
 *
 * Le cadre est restreint (`sandbox`) à ce dont le viewer a besoin :
 * exécuter ses scripts, appeler son propre serveur, passer en plein
 * écran. Il ne peut ni naviguer la page parente ni ouvrir de fenêtres.
 *
 * @param study     Examen affiché, pour la légende sous l'image.
 * @param viewerUrl URL signée du viewer, ou `null` s'il n'est pas encore
 *                  disponible.
 */
export function ViewerPane({
  study,
  viewerUrl,
  demo = false,
}: {
  study: Study;
  viewerUrl: string | null;
  /** Démonstration : aucun PACS n'existe, l'absence d'images est normale. */
  demo?: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-ink-950">
      {/* Le noir absolu n'est pas décoratif : c'est le fond de référence
          d'une lecture diagnostique. Toute autre teinte autour d'une image
          en niveaux de gris en décalerait la perception. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {viewerUrl ? (
          <iframe
            src={viewerUrl}
            title={`Images de l'examen ${study.studyInstanceUid}`}
            className="size-full border-0"
            allow="fullscreen"
            sandbox="allow-scripts allow-same-origin allow-downloads"
            referrerPolicy="no-referrer"
          />
        ) : demo ? (
          <SimulatedScan study={study} />
        ) : (
          <ViewerUnavailable purgedAt={study.imagesPurgedAt ?? null} />
        )}
      </div>

      <div
        className={cn(
          "flex h-10 shrink-0 items-center gap-3 overflow-hidden border-t border-border-subtle px-3",
          "bg-surface-base text-2xs text-tertiary",
        )}
      >
        <span className="shrink-0 font-medium text-secondary">
          {study.modality}
          {study.bodyPart && ` · ${study.bodyPart}`}
        </span>
        <span aria-hidden className="hidden sm:inline">
          ·
        </span>
        <span className="hidden shrink-0 tabular-nums sm:inline">
          {study.seriesCount} série{study.seriesCount > 1 ? "s" : ""} ·{" "}
          {study.instanceCount.toLocaleString("fr-FR")} coupes
        </span>
        {demo && (
          <span className="ml-auto shrink-0 truncate rounded-full border border-progress/30 px-2 py-0.5 font-medium text-progress">
            Images simulées
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={cn("shrink-0", !demo && "ml-auto")}
          disabled={!viewerUrl}
          aria-label="Ouvrir les images en plein écran"
          onClick={() =>
            viewerUrl && window.open(viewerUrl, "_blank", "noopener")
          }
        >
          <Maximize2 />
          <span className="hidden sm:inline">Plein écran</span>
        </Button>
      </div>
    </div>
  );
}

/**
 * État affiché quand le viewer n'est pas joignable.
 *
 * Il nomme la cause probable et l'action qui remet en marche. Un message
 * qui se contente de dire que quelque chose a échoué laisse l'utilisateur
 * sans recours — et, dans un service, il appellera le support.
 */
function ViewerUnavailable({ purgedAt }: { purgedAt: Date | null }) {
  // Conservation contractuelle échue : un motif connu, pas une panne.
  if (purgedAt) {
    return (
      <div className="flex max-w-xs flex-col items-center gap-2 text-center">
        <Archive className="size-5 text-ink-600" aria-hidden />
        <p className="text-sm font-medium text-ink-300">Images archivées</p>
        <p className="text-xs leading-relaxed text-ink-500">
          La durée de conservation prévue au contrat de la clinique est échue
          depuis le <DateTime date={purgedAt} withTime={false} /> : les images
          ont quitté la plateforme. Le compte-rendu reste consultable, et les
          originaux sont conservés par la clinique.
        </p>
      </div>
    );
  }
  return (
    <div className="flex max-w-xs flex-col items-center gap-2 text-center">
      <ImageOff className="size-5 text-ink-600" aria-hidden />
      <p className="text-sm font-medium text-ink-300">Images indisponibles</p>
      <p className="text-xs leading-relaxed text-ink-500">
        Le jeton de visualisation n’a pas pu être obtenu. Actualisez la page ;
        si le problème persiste, l’examen est peut-être encore en cours de
        transfert depuis la clinique.
      </p>
    </div>
  );
}
