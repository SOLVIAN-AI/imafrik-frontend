"use client";

import { ImageOff, Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Ce qu'il faut connaître d'un examen pour l'afficher et l'ouvrir. */
export interface ViewerStudy {
  /** Study Instance UID DICOM — l'identifiant que comprend le viewer. */
  studyInstanceUid: string;
  seriesCount: number;
  instanceCount: number;
  description: string | null;
}

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
 * Tant que ce jeton n'est pas branché, `viewerUrl` est absent et le volet
 * affiche un état explicite. Un cadre vide laisserait croire à un
 * chargement bloqué.
 *
 * @param study     Examen affiché, pour la légende sous l'image.
 * @param viewerUrl URL signée du viewer, ou `null` s'il n'est pas encore
 *                  disponible.
 */
export function ViewerPane({
  study,
  viewerUrl,
}: {
  study: ViewerStudy;
  viewerUrl: string | null;
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
          />
        ) : (
          <ViewerUnavailable />
        )}
      </div>

      <div
        className={cn(
          "flex h-9 shrink-0 items-center gap-3 border-t border-border-subtle px-3",
          "bg-surface-base text-2xs text-tertiary",
        )}
      >
        <span className="truncate">
          {study.description ?? "Sans description"}
        </span>
        <span aria-hidden>·</span>
        <span className="shrink-0 tabular-nums">
          {study.seriesCount} série{study.seriesCount > 1 ? "s" : ""} ·{" "}
          {study.instanceCount.toLocaleString("fr-FR")} coupes
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto shrink-0"
          disabled={!viewerUrl}
          onClick={() =>
            viewerUrl && window.open(viewerUrl, "_blank", "noopener")
          }
        >
          <Maximize2 />
          Plein écran
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
function ViewerUnavailable() {
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
