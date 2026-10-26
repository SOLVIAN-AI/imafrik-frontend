"use client";

import { Crosshair, Pause, Play, Ruler, SunMedium } from "lucide-react";
import * as React from "react";

import { VisualImage } from "@/components/marketing/visual-image";
import { CINE, cineImageNumber, VISUALS } from "@/content/marketing/visuals";
import { cn } from "@/lib/utils";

/** Libellés du visualiseur, dans la langue de la page. */
export interface CineViewerLabels {
  /** Description de l'image, pour les lecteurs d'écran. */
  label: string;
  toolbar: string;
  modality: string;
  sequence: string;
  plane: string;
  /** `{current}` et `{total}` sont remplacés. */
  slice: string;
  thickness: string;
  realSlice: string;
  anterior: string;
  posterior: string;
  play: string;
  pause: string;
}

/** Largeur d'affichage du visualiseur, pour le choix du fichier. */
const SIZES = "(min-width: 1280px) 37rem, (min-width: 1024px) 34rem, 100vw";

/** Requêtes qui demandent l'immobilité. */
const STILL_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Vrai si le visiteur demande moins de mouvement ou des données réduites :
 * le ciné ne démarre alors pas de lui-même, et la vidéo n'est pas
 * téléchargée tant qu'il ne l'a pas demandée.
 */
function prefersStill(): boolean {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return (
    window.matchMedia(STILL_QUERY).matches || connection?.saveData === true
  );
}

/** Suit le réglage « moins de mouvement » s'il change, page ouverte. */
function subscribeStill(onChange: () => void): () => void {
  const query = window.matchMedia(STILL_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Visualiseur de l'accroche : de vraies coupes d'IRM qui défilent, comme
 * sous la molette d'un radiologue.
 *
 * **L'affiche d'abord, la vidéo ensuite.** La première coupe est une image
 * ordinaire, prioritaire : c'est elle que voit le visiteur à l'ouverture,
 * et elle seule compte pour l'affichage du premier écran. La vidéo n'est
 * demandée qu'une fois la page chargée, quand le navigateur est inoccupé,
 * puis prend le relais en fondu lorsqu'elle joue réellement.
 *
 * **Le mouvement se commande.** Un défilement qui dure au-delà de cinq
 * secondes doit pouvoir être arrêté (WCAG 2.2.2) : le bouton de la barre
 * d'outils, celui d'un vrai visualiseur, met le ciné en pause ou le
 * relance. Avec « moins de mouvement » ou l'économiseur de données, rien
 * ne démarre seul ; le bouton reste là pour qui veut le voir. Hors de
 * l'écran ou onglet masqué, la lecture s'interrompt.
 *
 * **Les repères suivent l'image.** Le numéro de coupe et le curseur de
 * position, comme dans un visualiseur DICOM, sont mis à jour à chaque
 * image affichée (`requestVideoFrameCallback`), directement dans le DOM :
 * aucun rendu React douze fois par seconde.
 *
 * Le visualiseur reste noir dans les deux thèmes, comme le volet d'images
 * de l'application : c'est le fond de référence d'une lecture.
 */
export function CineViewer({ labels }: { labels: CineViewerLabels }) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const sliceRef = React.useRef<HTMLSpanElement>(null);
  const thumbRef = React.useRef<HTMLSpanElement>(null);
  // Réglages du visiteur (immobile au rendu serveur, où ils sont
  // inconnus : l'affiche est la même) ; son choix, s'il a touché au
  // bouton ; vidéo demandée ; visualiseur à l'écran ; vidéo qui joue.
  const still = React.useSyncExternalStore(
    subscribeStill,
    prefersStill,
    () => false,
  );
  const [choice, setChoice] = React.useState<"play" | "pause" | null>(null);
  const [source, setSource] = React.useState<string | null>(null);
  const [onScreen, setOnScreen] = React.useState(true);
  const [playing, setPlaying] = React.useState(false);
  const paused = choice === null ? still : choice === "pause";

  const sliceText = React.useCallback(
    (image: number) =>
      labels.slice
        .replace("{current}", String(image))
        .replace("{total}", String(CINE.total)),
    [labels.slice],
  );

  /**
   * Choisit la vidéo à la largeur réellement affichée, densité comprise.
   * L'IRM d'origine ne mesure que 232 pixels : une vidéo un peu plus étroite
   * que l'écran ne perd rien en netteté, et pèse 40 % de moins.
   */
  const pickSource = React.useCallback(() => {
    const width =
      (frameRef.current?.clientWidth ?? 480) * window.devicePixelRatio;
    const fit =
      CINE.videos.find((video) => video.width >= width * 0.7) ??
      CINE.videos[CINE.videos.length - 1];
    setSource(fit.src);
  }, []);

  // Démarrage différé : la page chargée, le processeur libre, puis une
  // seconde encore, sauf si le visiteur préfère l'immobilité. Sur un
  // téléphone modeste, l'hydratation de la page passe avant le ciné : le
  // premier écran répond au doigt dès qu'il s'affiche, et l'affiche tient
  // la place en attendant.
  React.useEffect(() => {
    if (paused || source) return;
    // Safari n'a pas `requestIdleCallback` : un court délai en tient lieu.
    const idle = typeof window.requestIdleCallback === "function";
    let idleHandle: number | undefined;
    let timer: number | undefined;
    const later = () => {
      timer = window.setTimeout(pickSource, 1000);
    };
    const start = () => {
      if (idle)
        idleHandle = window.requestIdleCallback(later, { timeout: 3000 });
      else later();
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);
      window.clearTimeout(timer);
    };
  }, [paused, source, pickSource]);

  // Lecture interrompue hors de l'écran : rien ne tourne pour rien.
  React.useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry.isIntersecting),
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) return;
    if (paused || !onScreen) video.pause();
    // Lecture refusée (économie d'énergie) : l'affiche reste, le bouton
    // propose de lancer le ciné.
    else void video.play().catch(() => setChoice("pause"));
  }, [source, paused, onScreen]);

  // Repères de coupe, image par image.
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) return;
    const update = (mediaTime: number) => {
      const frame = mediaTime * CINE.fps;
      const image = cineImageNumber(frame);
      const progress =
        (image - CINE.firstImage) / (CINE.step * (CINE.slices - 1));
      if (sliceRef.current) sliceRef.current.textContent = sliceText(image);
      thumbRef.current?.style.setProperty("--slice", String(progress));
    };
    if (typeof video.requestVideoFrameCallback === "function") {
      let handle = 0;
      const tick: VideoFrameRequestCallback = (_now, meta) => {
        update(meta.mediaTime);
        handle = video.requestVideoFrameCallback(tick);
      };
      handle = video.requestVideoFrameCallback(tick);
      return () => video.cancelVideoFrameCallback(handle);
    }
    const onTime = () => update(video.currentTime);
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [source, sliceText]);

  const toggle = () => {
    if (!source) pickSource();
    setChoice(source && !paused ? "pause" : "play");
  };
  const running = Boolean(source) && !paused;

  return (
    <div
      ref={frameRef}
      className="theme-dark overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.1_0.012_262)] text-primary shadow-[0_40px_120px_-40px_oklch(0_0_0/0.8),0_0_0_1px_oklch(1_0_0/0.04)]"
    >
      {/* Barre d'outils : les outils d'un visualiseur, le ciné actif. */}
      <div
        role="toolbar"
        aria-label={labels.toolbar}
        className="flex h-11 items-center gap-1 border-b border-white/[0.07] px-2.5"
      >
        <div className="flex items-center gap-0.5 text-tertiary" aria-hidden>
          {[SunMedium, Ruler, Crosshair].map((Icon, index) => (
            <span
              key={index}
              className="flex size-8 items-center justify-center rounded-md"
            >
              <Icon className="size-4" />
            </span>
          ))}
        </div>
        <p
          className="min-w-0 flex-1 truncate px-2 text-center text-2xs text-tertiary"
          aria-hidden
        >
          {labels.modality} · {labels.sequence} · {labels.plane}
        </p>
        <button
          type="button"
          onClick={toggle}
          aria-label={running ? labels.pause : labels.play}
          aria-pressed={running}
          className={cn(
            "flex size-8 items-center justify-center rounded-md transition-colors",
            running
              ? "bg-accent-muted text-accent"
              : "text-secondary hover:bg-white/5 hover:text-primary",
          )}
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      </div>

      <div className="relative aspect-square bg-black">
        <VisualImage
          visual={VISUALS.cinePoster}
          alt={labels.label}
          sizes={SIZES}
          priority
          className="absolute inset-0 size-full"
        />
        {source && (
          <video
            ref={videoRef}
            src={source}
            muted
            loop
            playsInline
            autoPlay={!paused}
            preload="auto"
            disablePictureInPicture
            aria-hidden
            tabIndex={-1}
            onPlaying={() => setPlaying(true)}
            data-playing={playing ? "" : undefined}
            // Un pixel en retrait de l'affiche, invisible sur le noir de
            // l'image : la vidéo, peinte plus tard au même endroit, ne
            // passe pas pour un nouvel « élément le plus grand » aux yeux
            // du navigateur (LCP). Le premier écran est affiché dès
            // l'affiche ; la vidéo n'en est que l'animation.
            className="cine-video absolute inset-px size-[calc(100%-2px)]"
          />
        )}

        {/* Mentions d'angle, comme sur une console de lecture. */}
        <div
          className="pointer-events-none absolute inset-0 font-mono text-[0.6875rem] leading-4 text-[oklch(0.82_0.01_262)]"
          aria-hidden
        >
          <p className="absolute top-3 left-3.5">
            {labels.modality}
            <br />
            {labels.sequence}
          </p>
          <p className="absolute top-3 right-3.5 text-right">
            {labels.plane}
            <br />
            <span className="text-accent">{labels.realSlice}</span>
          </p>
          {/* Mis à jour à chaque image : contenu, pour que le calcul de mise
              en page reste dans ce paragraphe. */}
          <p className="absolute bottom-3 left-3.5 [contain:content]">
            <span ref={sliceRef}>{sliceText(CINE.firstImage)}</span>
          </p>
          <p className="absolute right-3.5 bottom-3 text-right">
            {labels.thickness}
          </p>
          <p className="absolute top-1/2 left-3.5 -translate-y-1/2">
            {labels.anterior}
          </p>
          <p className="absolute top-1/2 right-5 -translate-y-1/2">
            {labels.posterior}
          </p>
          {/* Position dans la pile de coupes. */}
          <span className="absolute top-[30%] right-2 h-[40%] w-0.5 rounded-full bg-white/10">
            {/* Déplacé par une transformation, sans recalcul de mise en
                page : la boîte mesure la piste moins le curseur, et se
                décale d'une fraction de sa propre hauteur. */}
            <span
              ref={thumbRef}
              className="absolute inset-x-0 top-0 h-[calc(100%-1.25rem)] [translate:0_calc(var(--slice,0)*100%)] before:absolute before:inset-x-0 before:top-0 before:h-5 before:rounded-full before:bg-accent"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
