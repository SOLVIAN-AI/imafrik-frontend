"use client";

import { Archive, ImageOff, Maximize2, Minimize2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { DateTime } from "@/components/domain/date-time";
import { SimulatedScan } from "@/components/editor/simulated-scan";
import { WeasisButton } from "@/components/editor/weasis-button";
import { Button } from "@/components/ui/button";
import {
  type ViewerSession,
  useViewerSession,
} from "@/hooks/use-viewer-session";
import { useLocale, useMessages } from "@/i18n/client";
import type { Study } from "@/lib/data/studies";
import { formatCount } from "@/lib/format";
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
 * Le jeton est **prolongé tant que l'examen reste ouvert** (voir
 * {@link useViewerSession}) : émis pour quinze minutes, il expirait
 * pendant la rédaction, et le viewer refusait ensuite toute série non
 * encore chargée (signalé le 21 octobre 2026).
 *
 * Le cadre est restreint (`sandbox`) à ce dont le viewer a besoin :
 * exécuter ses scripts, appeler son propre serveur, passer en plein
 * écran, copier dans le presse-papiers (le détail d'une erreur, à
 * transmettre au support : sans cette permission, le bouton « Copier »
 * du viewer échouait à son tour). Il ne peut ni naviguer la page parente,
 * ni ouvrir de fenêtres, ni **télécharger un fichier** : aucune image
 * d'un examen ne sort d'IMAFRIK (demandé le 29 octobre 2026). Sans
 * `allow-downloads`, le navigateur refuse lui-même tout téléchargement
 * lancé depuis le viewer. Le presse-papiers reste ouvert au texte ; une
 * image y est refusée par la configuration d'OHIF, côté backend.
 *
 * Sur ordinateur, le radiologue et l'équipe IMAFRIK peuvent aussi ouvrir
 * l'examen dans Weasis, installé sur le poste (voir {@link WeasisButton}) ;
 * le viewer reste celui de l'écran.
 *
 * @param study     Examen affiché, pour la légende sous l'image.
 * @param viewerUrl URL signée du viewer, ou `null` s'il n'est pas encore
 *                  disponible.
 * @param session   Prolongation et réouverture du jeton.
 * @param weasis    Propose l'ouverture dans Weasis.
 */
export function ViewerPane({
  study,
  viewerUrl,
  demo = false,
  session,
  weasis = false,
}: {
  study: Study;
  viewerUrl: string | null;
  /** Démonstration : aucun PACS n'existe, l'absence d'images est normale. */
  demo?: boolean;
  session?: ViewerSession;
  weasis?: boolean;
}) {
  const labels = useMessages().reading.viewer;
  const { url, reopened } = useViewerSession(viewerUrl, session);
  React.useEffect(() => {
    if (reopened === "ok") toast.info(labels.reopened);
    if (reopened === "failed") toast.error(labels.reopenFailed);
  }, [labels, reopened]);
  const locale = useLocale();
  const { pane, fullscreen, inWindow, toggleFullscreen } = useFullscreen();
  return (
    <div
      ref={pane}
      data-tour="viewer"
      data-fullscreen={inWindow ? "window" : fullscreen ? "native" : undefined}
      className={cn(
        "flex h-full min-h-0 flex-col bg-ink-950",
        // Repli quand le navigateur refuse le plein écran : le volet couvre
        // toute la fenêtre, au-dessus du reste de l'application.
        inWindow && "fixed inset-0 z-[80] h-dvh w-screen",
      )}
    >
      {/* Le noir absolu n'est pas décoratif : c'est le fond de référence
          d'une lecture diagnostique. Toute autre teinte autour d'une image
          en niveaux de gris en décalerait la perception. */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        {url ? (
          <iframe
            src={url}
            title={labels.frameTitle(study.studyInstanceUid)}
            className="size-full border-0"
            allow="fullscreen; clipboard-write"
            sandbox="allow-scripts allow-same-origin"
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
          {labels.series(study.seriesCount)} ·{" "}
          {labels.images(
            study.instanceCount,
            formatCount(study.instanceCount, locale),
          )}
        </span>
        {demo && (
          <span className="ml-auto shrink-0 truncate rounded-full border border-progress/30 px-2 py-0.5 font-medium text-progress">
            {labels.simulated}
          </span>
        )}
        <div
          className={cn("flex shrink-0 items-center gap-1", !demo && "ml-auto")}
        >
          {weasis && !study.imagesPurgedAt && (
            <WeasisButton studyId={study.id} />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            // Le volet entier passe en plein écran : la coupe simulée de la
            // démonstration aussi.
            disabled={!url && !demo}
            aria-label={
              fullscreen ? labels.closeFullscreen : labels.openFullscreen
            }
            aria-pressed={fullscreen}
            onClick={toggleFullscreen}
          >
            {fullscreen ? <Minimize2 /> : <Maximize2 />}
            <span className="hidden sm:inline">
              {fullscreen ? labels.exitFullscreen : labels.fullscreen}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Plein écran du volet d'images, dans la page.
 *
 * Le volet entier passe en plein écran (images et barre du bas) : on en
 * sort par Échap ou par le même bouton, et l'on retrouve l'examen et le
 * compte-rendu exactement où on les avait laissés. L'ancien bouton
 * ouvrait le viewer dans un nouvel onglet, sans aucun chemin de retour
 * vers IMAFRIK : signalé le 15 octobre 2026.
 *
 * **Repli dans la fenêtre.** Certains navigateurs de téléphone n'offrent
 * pas le plein écran d'un élément, ou le refusent : celui qu'ouvre une
 * messagerie (lien reçu par WhatsApp), Safari sur iPhone. Le bouton ne
 * faisait alors rien (signalé le 17 octobre 2026). Le volet couvre
 * désormais toute la fenêtre dans ce cas, et le même bouton, ou Échap,
 * l'y remet.
 */
function useFullscreen() {
  const pane = React.useRef<HTMLDivElement>(null);
  const [native, setNative] = React.useState(false);
  const [inWindow, setInWindow] = React.useState(false);

  React.useEffect(() => {
    // Suit l'état réel : Échap, ou la sortie imposée par le navigateur,
    // ne passent pas par le bouton.
    const sync = () => setNative(document.fullscreenElement === pane.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  React.useEffect(() => {
    if (!inWindow) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInWindow(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [inWindow]);

  const toggleFullscreen = React.useCallback(() => {
    if (inWindow) {
      setInWindow(false);
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    const element = pane.current;
    if (!element?.requestFullscreen || !document.fullscreenEnabled) {
      setInWindow(true);
      return;
    }
    element.requestFullscreen().catch(() => setInWindow(true));
  }, [inWindow]);

  return { pane, fullscreen: native || inWindow, inWindow, toggleFullscreen };
}

/**
 * État affiché quand le viewer n'est pas joignable.
 *
 * Il nomme la cause probable et l'action qui remet en marche. Un message
 * qui se contente de dire que quelque chose a échoué laisse l'utilisateur
 * sans recours — et, dans un service, il appellera le support.
 */
function ViewerUnavailable({ purgedAt }: { purgedAt: Date | null }) {
  const labels = useMessages().reading.viewer;
  // Conservation contractuelle échue : un motif connu, pas une panne.
  if (purgedAt) {
    return (
      <div className="flex max-w-xs flex-col items-center gap-2 text-center">
        <Archive className="size-5 text-ink-600" aria-hidden />
        <p className="text-sm font-medium text-ink-300">
          {labels.archivedTitle}
        </p>
        <p className="text-xs leading-relaxed text-ink-500">
          {labels.archivedBefore} <DateTime date={purgedAt} withTime={false} />
          {labels.archivedAfter}
        </p>
      </div>
    );
  }
  return (
    <div className="flex max-w-xs flex-col items-center gap-2 text-center">
      <ImageOff className="size-5 text-ink-600" aria-hidden />
      <p className="text-sm font-medium text-ink-300">
        {labels.unavailableTitle}
      </p>
      <p className="text-xs leading-relaxed text-ink-500">
        {labels.unavailableDetail}
      </p>
    </div>
  );
}
