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
  /** Renseignement clinique, affiché en légende. */
  clinicalInfo: string | null;
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
 * Quand le jeton n'a pas pu être obtenu — ou en démonstration, où aucun
 * PACS n'existe — `viewerUrl` est absent et le volet affiche un état
 * explicite. Un cadre vide laisserait croire à un chargement bloqué.
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
  study: ViewerStudy;
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
        ) : (
          <ViewerUnavailable demo={demo} />
        )}
      </div>

      <div
        className={cn(
          "flex h-9 shrink-0 items-center gap-3 border-t border-border-subtle px-3",
          "bg-surface-base text-2xs text-tertiary",
        )}
      >
        <span className="truncate">
          {study.clinicalInfo ?? "Sans renseignement clinique"}
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
function ViewerUnavailable({ demo }: { demo: boolean }) {
  return (
    <div className="flex max-w-xs flex-col items-center gap-2 text-center">
      <ImageOff className="size-5 text-ink-600" aria-hidden />
      <p className="text-sm font-medium text-ink-300">Images indisponibles</p>
      <p className="text-xs leading-relaxed text-ink-500">
        {demo
          ? "Démonstration : aucun serveur d’images n’est branché sur cet aperçu."
          : "Le jeton de visualisation n’a pas pu être obtenu. Actualisez la page ; si le problème persiste, l’examen est peut-être encore en cours de transfert depuis la clinique."}
      </p>
    </div>
  );
}
