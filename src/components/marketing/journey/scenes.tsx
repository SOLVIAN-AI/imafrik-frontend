import {
  Check,
  FileText,
  Lock,
  Minimize2,
  Radio,
  ShieldCheck,
} from "lucide-react";

import { fill } from "@/content/marketing";
import type { MarketingCopy } from "@/content/marketing/types";
import { cn } from "@/lib/utils";

import {
  FRAME_COUNT,
  NODULE_FRAME,
  READING,
  SERIES_IMAGES,
  easeOut,
  frameAt,
  routePath,
  routePoint,
  segment,
  typedLength,
} from "./timeline";
import { KARA, LOME, TOGO_PATH, TOGO_VIEWBOX } from "./togo";

/**
 * Les quatre scènes du parcours.
 *
 * Chacune ne dépend que de son avancement `t` (de 0 à 1) : rien n'y est
 * animé par le temps, sinon de courtes transitions de confort. C'est ce
 * qui permet de la piloter par le défilement, par une minuterie, ou de la
 * figer à sa fin. Toutes sont décoratives (`aria-hidden` sur la scène) :
 * les étapes écrites portent l'information.
 *
 * Seuls `transform` et `opacity` varient d'une image à l'autre : le
 * navigateur les compose sans recalculer la mise en page.
 */

type SceneCopy = MarketingCopy["journey"]["scene"];

/** Mesure du nodule sur sa coupe, dans le repère des images (480 × 432). */
const NODULE = { x1: 368, x2: 400, y: 212 } as const;

/** Adresse d'une coupe de scanner. */
export function frameSrc(index: number): string {
  return `/marketing/parcours/coupe-${String(index).padStart(2, "0")}.webp`;
}

/** Style d'apparition : fondu et léger glissement, selon un avancement. */
function appear(t: number, distance = 10): React.CSSProperties {
  const k = easeOut(t);
  return { opacity: k, transform: `translateY(${(1 - k) * distance}px)` };
}

/** L'étiquette de l'examen, celle qui voyage d'une scène à l'autre. */
export function ExamChip({
  copy,
  className,
  style,
}: {
  copy: SceneCopy;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "rail-urgent flex items-center gap-3 rounded-xl border border-urgent/40 bg-surface-raised px-3.5 py-2.5 shadow-overlay",
        className,
      )}
      style={style}
    >
      <span className="flex min-w-0 flex-col">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
          <span className="whitespace-nowrap">{copy.patient}</span>
          <span className="rounded-full bg-urgent-muted px-1.5 py-px text-2xs font-semibold tracking-wide text-urgent uppercase">
            {copy.urgent}
          </span>
        </span>
        <span className="text-xs text-secondary">{copy.exam}</span>
      </span>
    </div>
  );
}

/** Acte 1 : la passerelle de la clinique reçoit l'examen, coupe après coupe. */
export function GatewayScene({
  t,
  copy,
  imagesReady,
}: {
  t: number;
  copy: SceneCopy;
  imagesReady: boolean;
}) {
  const arrival = segment(t, 0, 0.75);
  const count = Math.round(SERIES_IMAGES * easeOut(arrival));
  // Huit coupes empilées, réparties dans la série.
  const stack = Array.from({ length: 8 }, (_, index) => ({
    index,
    frame: Math.round((index * (FRAME_COUNT - 1)) / 7),
    shown: segment(arrival, index / 9, index / 9 + 0.2),
  }));
  const chip = segment(t, 0.72, 0.95);

  return (
    <div className="flex h-full flex-col gap-5 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-eyebrow">{copy.clinic}</p>
          <p className="mt-1 flex items-center gap-2 text-base font-semibold">
            <Radio className="size-4 text-accent" aria-hidden />
            {copy.gateway}
          </p>
        </div>
        <span className="rounded-full bg-done-muted px-2.5 py-1 text-2xs font-medium text-done tabular-nums">
          {fill(copy.received, { count })}
        </span>
      </div>

      <div className="relative flex min-h-48 flex-1 items-center justify-center">
        {stack.map(({ index, frame, shown }) => (
          <div
            key={index}
            className="absolute aspect-[10/9] w-[46%] max-w-56 overflow-hidden rounded-lg border border-white/10 bg-black shadow-overlay"
            style={{
              opacity: shown,
              transform: `translate(${(index - 3.5) * 9}px, ${(index - 3.5) * -7 + (1 - easeOut(shown)) * 24}px) rotate(${(index - 3.5) * 1.6}deg)`,
              zIndex: index,
            }}
          >
            {imagesReady && (
              // eslint-disable-next-line @next/next/no-img-element -- images décoratives déjà optimisées (WebP)
              <img
                src={frameSrc(frame)}
                alt=""
                width={480}
                height={432}
                decoding="async"
                className="size-full object-cover"
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className="flex items-center gap-2 text-xs text-secondary"
          style={appear(segment(t, 0.35, 0.6))}
        >
          <ShieldCheck className="size-4 text-done" aria-hidden />
          {copy.offline}
        </span>
        <ExamChip
          copy={copy}
          style={{
            opacity: easeOut(chip),
            transform: `translateY(${(1 - easeOut(chip)) * 16}px) scale(${0.96 + 0.04 * easeOut(chip)})`,
          }}
        />
      </div>
    </div>
  );
}

/** Acte 2 : l'examen traverse le pays, compressé et chiffré. */
export function RouteScene({ t, copy }: { t: number; copy: SceneCopy }) {
  const travel = easeOut(segment(t, 0.08, 0.85));
  const marker = routePoint(travel, KARA, LOME);
  const path = routePath(KARA, LOME);
  // Longueur approchée du trajet, pour le tracé progressif.
  const length = 420;
  const badges = segment(t, 0.15, 0.4);

  return (
    <div className="flex h-full items-stretch gap-4 p-5 sm:p-7">
      <svg
        viewBox={`-30 -10 ${TOGO_VIEWBOX.width + 80} ${TOGO_VIEWBOX.height + 30}`}
        className="h-full max-h-[420px] w-auto max-w-[44%] shrink-0"
        aria-hidden
      >
        <path
          d={TOGO_PATH}
          className="fill-accent/[0.06] stroke-accent/45"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <path
          d={path}
          fill="none"
          className="stroke-accent"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - travel)}
        />
        {[KARA, LOME].map((city) => (
          <g key={city.name}>
            <circle cx={city.x} cy={city.y} r={5} className="fill-accent" />
            <text
              x={city.x - 18}
              y={city.y + (city === LOME ? -4 : 5)}
              textAnchor="end"
              className="fill-secondary text-[15px] font-medium"
            >
              {city.name}
            </text>
          </g>
        ))}
        <circle
          cx={marker.x}
          cy={marker.y}
          r={9}
          className="fill-accent"
          style={{ opacity: t > 0.02 ? 1 : 0 }}
        />
        <circle
          cx={marker.x}
          cy={marker.y}
          r={16}
          className="fill-accent/20"
          style={{ opacity: t > 0.02 && travel < 1 ? 1 : 0 }}
        />
      </svg>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-4">
        <p className="label-eyebrow">{copy.route}</p>
        <ExamChip copy={copy} />
        <div className="flex flex-wrap gap-2" style={appear(badges)}>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-2xs font-medium text-secondary">
            <Minimize2 className="size-3.5" aria-hidden />
            {copy.compressed}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-2xs font-medium text-secondary">
            <Lock className="size-3.5" aria-hidden />
            {copy.encrypted}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Acte 3 : l'examen en tête de la file, puis la lecture et la rédaction. */
export function ReadingScene({
  t,
  p,
  copy,
  imagesReady,
}: {
  t: number;
  /** Avancement total : la coupe affichée en dépend (voir frameAt). */
  p: number;
  copy: SceneCopy;
  imagesReady: boolean;
}) {
  const list = 1 - segment(t, 0.2, 0.3);
  const reading = segment(t, 0.22, 0.32);
  const arrival = easeOut(segment(t, 0, 0.14));
  const frame = frameAt(p);
  const written = typedLength(
    copy.conclusion,
    segment(t, READING.typeStart, READING.typeEnd),
  );
  const done = t >= READING.signed;
  // La mesure se trace une fois revenu sur le nodule (voir frameAt).
  const measure = easeOut(segment(t, READING.measureStart, READING.measureEnd));

  return (
    <div className="relative h-full">
      {/* La file : l'examen arrive en tête, les urgences devant. */}
      <div
        className="absolute inset-0 flex flex-col gap-3 p-5 sm:p-7"
        style={{ opacity: list, pointerEvents: "none" }}
      >
        <div className="flex items-baseline justify-between">
          <p className="text-lg font-semibold">{copy.worklist}</p>
          <p className="text-2xs text-tertiary">{copy.byDeadline}</p>
        </div>
        <ExamChip
          copy={copy}
          className="justify-between"
          style={{
            opacity: arrival,
            transform: `translateY(${(1 - arrival) * -18}px)`,
          }}
        />
        {copy.otherRows.map((row, index) => (
          <div
            key={row.name}
            className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-base px-3.5 py-2.5"
            style={{
              transform: `translateY(${(1 - arrival) * -8 * (index + 1)}px)`,
            }}
          >
            <span className="flex flex-col">
              <span className="text-sm font-semibold">{row.name}</span>
              <span className="text-xs text-secondary">{row.exam}</span>
            </span>
            <span className="font-mono text-2xs text-tertiary">
              {row.deadline}
            </span>
          </div>
        ))}
      </div>

      {/* La lecture : images à gauche, compte-rendu à droite, comme l'écran réel. */}
      <div
        className="absolute inset-0 flex flex-col sm:flex-row"
        style={{ opacity: reading }}
      >
        <div className="relative h-40 flex-none overflow-hidden bg-black sm:h-auto sm:flex-1">
          {/* Les coupes et la mesure dans un seul repère SVG (480 × 432),
              mis à l'échelle d'un bloc : la mesure tombe sur le nodule à
              toutes les tailles. */}
          <svg
            viewBox="0 0 480 432"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 size-full"
            aria-hidden
          >
            {imagesReady &&
              Array.from({ length: FRAME_COUNT }, (_, index) => (
                <image
                  key={index}
                  href={frameSrc(index)}
                  width={480}
                  height={432}
                  style={{ opacity: index === frame ? 1 : 0 }}
                />
              ))}
            {/* Le viewer reste noir dans les deux thèmes : la mesure garde
                la teinte de l'accent sombre, lisible sur l'image. */}
            <g style={{ opacity: frame === NODULE_FRAME ? measure : 0 }}>
              <line
                x1={NODULE.x1}
                y1={NODULE.y}
                x2={NODULE.x1 + (NODULE.x2 - NODULE.x1) * measure}
                y2={NODULE.y}
                className="stroke-accent-500"
                strokeWidth={3}
              />
              {[NODULE.x1, NODULE.x2].map((x, index) => (
                <line
                  key={x}
                  x1={x}
                  y1={NODULE.y - 9}
                  x2={x}
                  y2={NODULE.y + 9}
                  className="stroke-accent-500"
                  strokeWidth={3}
                  style={{ opacity: index === 0 || measure >= 1 ? 1 : 0 }}
                />
              ))}
              <text
                x={(NODULE.x1 + NODULE.x2) / 2}
                y={NODULE.y - 22}
                textAnchor="middle"
                className="fill-accent-500 stroke-black text-[24px] font-semibold"
                strokeWidth={4}
                paintOrder="stroke"
                style={{ opacity: measure >= 1 ? 1 : 0 }}
              >
                27 mm
              </text>
            </g>
          </svg>
          <span className="absolute bottom-2 left-3 font-mono text-2xs text-white/80 tabular-nums [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]">
            W 1500 · L −600 · {frame + 1}/{FRAME_COUNT}
          </span>
          <span className="absolute top-2 left-3 text-2xs text-white/80 [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]">
            {copy.patient} · {copy.exam}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 border-t border-border-subtle p-4 sm:gap-3 sm:border-t-0 sm:border-l sm:p-5">
          {[copy.indicationLabel, copy.findingsLabel].map((label, index) => (
            <div key={label} className="hidden flex-col gap-1.5 sm:flex">
              <p className="label-eyebrow">{label}</p>
              <span className="h-1.5 w-[88%] rounded-full bg-border-default" />
              <span
                className="h-1.5 rounded-full bg-border-default"
                style={{ width: index === 0 ? "54%" : "72%" }}
              />
            </div>
          ))}
          <p className="label-eyebrow">{copy.conclusionLabel}</p>
          <p className="min-h-10 text-sm leading-relaxed sm:min-h-16">
            {copy.conclusion.slice(0, written)}
            <span
              className="ml-px inline-block h-4 w-px translate-y-0.5 bg-accent"
              style={{
                opacity:
                  written > 0 && written < copy.conclusion.length ? 1 : 0,
              }}
            />
          </p>
          <p
            className="text-2xs text-tertiary"
            style={appear(segment(t, READING.typeEnd, READING.signed), 4)}
          >
            {copy.saved} · {copy.radiologist}
          </p>
          <span
            className={cn(
              "mt-auto inline-flex h-9 items-center justify-center self-start rounded-lg px-4 text-sm font-semibold transition-colors duration-200",
              done
                ? "bg-done text-surface-base"
                : "bg-accent text-accent-contrast",
            )}
            style={appear(
              segment(t, READING.measureEnd, READING.typeStart + 0.04),
              6,
            )}
          >
            {done ? (
              <span className="flex items-center gap-1.5">
                <Check className="size-4" aria-hidden />
                {copy.signed}
              </span>
            ) : (
              copy.sign
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Code de vérification, dessiné : décoratif, il ne mène nulle part. */
function QrMark() {
  const cells = [
    "1110111",
    "1010101",
    "1110111",
    "0001000",
    "1101011",
    "0110110",
    "1011101",
  ];
  return (
    <svg
      viewBox="0 0 7 7"
      className="size-12"
      aria-hidden
      shapeRendering="crispEdges"
    >
      <rect width="7" height="7" fill="#fff" />
      {cells.flatMap((row, y) =>
        [...row].map((cell, x) =>
          cell === "1" ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill="#111"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

/** Acte 4 : le compte-rendu signé revient à la clinique. */
export function DeliveryScene({ t, copy }: { t: number; copy: SceneCopy }) {
  const sheet = easeOut(segment(t, 0, 0.25));
  const stamp = segment(t, 0.2, 0.38);
  const back = easeOut(segment(t, 0.4, 0.82));
  const path = routePath(LOME, KARA);
  const marker = routePoint(back, LOME, KARA);
  const length = 420;

  return (
    <div className="flex h-full flex-wrap items-center justify-center gap-6 p-5 sm:flex-nowrap sm:p-7">
      <div
        className="relative flex aspect-[1/1.3] w-44 shrink-0 flex-col gap-2 rounded-md bg-white p-4 text-[#111] shadow-overlay sm:w-52"
        style={{
          opacity: sheet,
          transform: `translateY(${(1 - sheet) * 24}px) rotate(${(1 - sheet) * -3}deg)`,
        }}
      >
        <p className="text-[10px] font-bold">{copy.clinic}</p>
        <div className="h-px bg-[#111]" />
        <p className="text-[9px] font-semibold">{copy.reportTitle}</p>
        {[86, 92, 70, 80, 58].map((width, index) => (
          <span
            key={index}
            className="h-1.5 rounded-full bg-[#e3e3de]"
            style={{ width: `${width}%` }}
          />
        ))}
        <div className="mt-auto flex items-end justify-between">
          <p className="text-[8px] leading-snug">
            {copy.radiologist.split(" · ")[0]}
            <br />
            {copy.signedOn}
          </p>
          <QrMark />
        </div>
        <span
          className="absolute top-[42%] right-3 rounded-sm border-2 border-[#11806a] px-1.5 py-0.5 text-[9px] font-bold tracking-[0.14em] text-[#11806a] uppercase"
          style={{
            opacity: stamp,
            transform: `rotate(-8deg) scale(${1.35 - 0.35 * easeOut(stamp)})`,
          }}
        >
          {copy.signed}
        </span>
      </div>

      <div className="flex min-w-0 flex-col items-center gap-3">
        <svg
          viewBox={`-30 -10 ${TOGO_VIEWBOX.width + 80} ${TOGO_VIEWBOX.height + 30}`}
          className="h-44 w-auto sm:h-56"
          aria-hidden
        >
          <path
            d={TOGO_PATH}
            className="fill-accent/[0.06] stroke-accent/45"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            className="stroke-done"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={length}
            strokeDashoffset={length * (1 - back)}
          />
          <circle cx={KARA.x} cy={KARA.y} r={5} className="fill-done" />
          <circle cx={LOME.x} cy={LOME.y} r={5} className="fill-accent" />
          <g style={{ opacity: t > 0.4 && back < 1 ? 1 : 0 }}>
            <circle cx={marker.x} cy={marker.y} r={11} className="fill-done" />
          </g>
          <g
            transform={`translate(${marker.x - 6} ${marker.y - 7})`}
            style={{ opacity: t > 0.4 && back < 1 ? 1 : 0 }}
          >
            <FileText width={12} height={14} className="stroke-surface-base" />
          </g>
        </svg>
        <span
          className="flex items-center gap-2 rounded-full bg-done-muted px-3 py-1.5 text-xs font-semibold text-done"
          style={appear(segment(t, 0.8, 0.95))}
        >
          <Check className="size-4" aria-hidden />
          {copy.delivered}
        </span>
        <span
          className="text-2xs text-tertiary"
          style={appear(segment(t, 0.86, 1), 4)}
        >
          {copy.verify}
        </span>
      </div>
    </div>
  );
}
