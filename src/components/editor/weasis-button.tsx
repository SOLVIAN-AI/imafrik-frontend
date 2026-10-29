"use client";

import { CircleHelp, ExternalLink, MonitorUp } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMessages } from "@/i18n/client";
import { openInWeasis } from "@/lib/actions/weasis";
import {
  DESKTOP_MEDIA_QUERY,
  WEASIS_DOWNLOAD_URL,
  isDesktopComputer,
} from "@/lib/weasis";

/**
 * Délai après lequel une ouverture restée sans effet propose l'aide.
 *
 * Aucun navigateur ne dit si une adresse `weasis://` a trouvé son
 * application. Quand Weasis s'ouvre, il prend la main et la page perd le
 * focus ; quand il n'est pas installé, rien ne se passe. Trois secondes
 * sans perte de focus valent donc « pas installé, ou demande du
 * navigateur restée sans réponse » : l'aide couvre les deux.
 */
const NO_LAUNCH_DELAY_MS = 3000;

/**
 * Ouvre l'examen dans Weasis, installé sur l'ordinateur du radiologue.
 *
 * Proposé à côté du viewer, qui reste celui de l'écran de lecture, et sur
 * ordinateur seulement : Weasis n'existe ni pour tablette ni pour
 * téléphone. L'adresse `weasis://` est demandée au service au clic, jamais
 * au chargement : il revérifie l'accès, trace l'ouverture et émet un code
 * à usage unique de cinq minutes.
 *
 * Un vrai bouton, encadré, et toujours nommé à l'écran : réduit à une
 * icône dans la barre sous les images, on ne le voyait pas. Secondaire et
 * non plein : Weasis est une option à côté du viewer, le bouton plein reste
 * aux actions principales de l'écran (signer, prendre en charge).
 *
 * Le point d'interrogation ouvre la même aide que celle qui suit une
 * ouverture sans effet : où télécharger Weasis, comment l'installer, et
 * pourquoi le fermer après la lecture.
 *
 * @param studyId Examen ouvert.
 */
export function WeasisButton({ studyId }: { studyId: string }) {
  const labels = useMessages().reading.weasis;
  const desktop = useDesktopComputer();
  const [pending, startTransition] = React.useTransition();
  const [help, setHelp] = React.useState<"help" | "notOpened" | null>(null);
  const stopWatching = React.useRef<(() => void) | null>(null);
  React.useEffect(() => () => stopWatching.current?.(), []);

  if (!desktop) return null;

  const launch = () =>
    startTransition(async () => {
      const result = await openInWeasis(studyId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.info(labels.opening);
      stopWatching.current?.();
      stopWatching.current = watchLaunch(() => setHelp("notOpened"));
      window.location.assign(result.data);
    });

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className="shrink-0 font-medium [&_svg]:text-accent"
        loading={pending}
        aria-label={labels.open}
        title={labels.openHint}
        onClick={launch}
      >
        <MonitorUp aria-hidden />
        {/* Sous 1280 px, le volet d'images est étroit : « Weasis » seul,
            le nom complet restant celui du bouton (aria-label, info-bulle). */}
        <span className="xl:hidden">{labels.openShort}</span>
        <span className="hidden xl:inline">{labels.open}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 px-1.5"
        aria-label={labels.help}
        title={labels.help}
        onClick={() => setHelp("help")}
      >
        <CircleHelp aria-hidden />
      </Button>
      <WeasisHelpDialog
        open={help !== null}
        notOpened={help === "notOpened"}
        onOpenChange={(open) => !open && setHelp(null)}
      />
    </>
  );
}

/**
 * Vrai sur un ordinateur, faux sur tablette et téléphone, et au rendu
 * serveur, qui ne connaît pas l'appareil : le bouton n'apparaît qu'une
 * fois l'écran hydraté.
 */
function useDesktopComputer(): boolean {
  const wide = useMediaQuery(DESKTOP_MEDIA_QUERY, false);
  const subscribe = React.useCallback(() => () => {}, []);
  const computer = React.useSyncExternalStore(
    subscribe,
    () =>
      isDesktopComputer({
        userAgent: navigator.userAgent,
        platform: navigator.platform ?? "",
        maxTouchPoints: navigator.maxTouchPoints ?? 0,
      }),
    () => false,
  );
  return wide && computer;
}

/**
 * Surveille la page après l'ouverture : si elle garde le focus, Weasis ne
 * s'est pas ouvert.
 *
 * @param onNoLaunch Appelé si la page n'a pas perdu le focus à temps.
 * @returns De quoi arrêter la surveillance.
 */
function watchLaunch(onNoLaunch: () => void): () => void {
  let left = false;
  const onLeave = () => {
    left = true;
  };
  const stop = () => {
    window.clearTimeout(timer);
    window.removeEventListener("blur", onLeave);
    document.removeEventListener("visibilitychange", onLeave);
  };
  window.addEventListener("blur", onLeave);
  document.addEventListener("visibilitychange", onLeave);
  const timer = window.setTimeout(() => {
    stop();
    if (!left && document.hasFocus()) onNoLaunch();
  }, NO_LAUNCH_DELAY_MS);
  return stop;
}

/**
 * Aide de Weasis : téléchargement officiel, installation, et conduite à
 * tenir avec les images gardées sur le poste.
 */
function WeasisHelpDialog({
  open,
  notOpened,
  onOpenChange,
}: {
  open: boolean;
  /** Ouverte après une ouverture restée sans effet. */
  notOpened: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const labels = useMessages().reading.weasis;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{labels.dialogTitle}</DialogTitle>
          <DialogDescription>
            {notOpened ? labels.notOpened : labels.dialogIntro}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-5 pb-5 text-xs leading-relaxed text-secondary">
          <p className="font-medium text-primary">{labels.stepsTitle}</p>
          <ol className="flex list-decimal flex-col gap-1.5 pl-4">
            {labels.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <a
            href={WEASIS_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 self-start font-medium text-accent underline"
          >
            {labels.download}
            <ExternalLink className="size-3" aria-hidden />
          </a>
          <p>{labels.oneAtATime}</p>
          <p className="rounded-md border border-border-subtle bg-surface-raised px-3 py-2">
            {labels.privacy}
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="sm">
              {labels.close}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
