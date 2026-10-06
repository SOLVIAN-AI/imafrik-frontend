"use client";

import * as React from "react";

import type { Study } from "@/lib/data/studies";
import { formatDemographics, formatPatientName } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Coupe axiale simulée, pour la démonstration.
 *
 * **Pourquoi la simuler.** Une démonstration sans PACS affichait un volet
 * vide — précisément l'écran que l'on montre à un radiologue pour le
 * convaincre. Une coupe dessinée, avec les surimpressions d'une console
 * de lecture, lui montre l'ergonomie réelle : l'image à gauche, le texte
 * à droite, le contexte du patient dans les coins.
 *
 * **Pourquoi elle ne trompe personne.** Le dessin est schématique — des
 * ellipses, pas une anatomie — et un bandeau « Images simulées » reste
 * affiché en permanence. Rien ici ne passe par le viewer, ni ne prétend
 * le remplacer : en production, ce composant n'est jamais rendu. La
 * mention est portée par la barre sous l'image (`ViewerPane`), hors des
 * surimpressions, pour ne jamais les recouvrir.
 *
 * La molette fait défiler les coupes, comme dans OHIF ; la silhouette des
 * poumons varie avec la coupe pour que le geste ait un effet visible.
 * Tout est en niveaux de gris sur fond noir : la règle du volet d'images
 * vaut aussi pour une simulation.
 */
export function SimulatedScan({
  study,
  interactive = true,
}: {
  study: Study;
  /**
   * Défilement des coupes à la molette. Désactivé pour un aperçu dans une
   * page qui défile : il y capturerait la molette et bloquerait la page.
   */
  interactive?: boolean;
}) {
  const total = Math.max(
    1,
    Math.round(study.instanceCount / Math.max(1, study.seriesCount)),
  );
  const [slice, setSlice] = React.useState(() => Math.ceil(total / 2));
  const ref = React.useRef<HTMLDivElement>(null);
  // Identifiants propres à l'instance : des `id` fixes entreraient en
  // conflit dès que deux coupes sont rendues sur la même page, et une
  // copie masquée rendrait les autres invisibles.
  const uid = React.useId().replace(/:/g, "");
  const id = (name: string) => `${uid}-${name}`;

  // Écouteur natif, non passif : React enregistre `onWheel` en passif, ce
  // qui interdit d'empêcher le défilement de la page pendant le geste.
  React.useEffect(() => {
    const node = ref.current;
    if (!node || !interactive) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setSlice((current) =>
        Math.min(total, Math.max(1, current + Math.sign(event.deltaY))),
      );
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [total, interactive]);

  // Position relative dans le volume, de 0 à 1 : elle module la taille des
  // poumons, plus larges au milieu du thorax qu'aux apex et aux bases.
  const depth = total > 1 ? (slice - 1) / (total - 1) : 0.5;
  const lung = 0.55 + Math.sin(depth * Math.PI) * 0.45;
  const demographics = formatDemographics(
    study.patientSex,
    study.patientBirthDate,
    study.receivedAt,
  );

  return (
    <div
      ref={ref}
      className={cn(
        "relative size-full overflow-hidden bg-black select-none",
        interactive && "cursor-ns-resize",
      )}
      role="img"
      aria-label={`Coupe simulée ${slice} sur ${total} — démonstration`}
    >
      <svg
        viewBox="0 0 512 512"
        className="absolute inset-0 m-auto size-full max-h-full max-w-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <radialGradient id={id("scan-soft")} cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#8a8a8a" />
            <stop offset="100%" stopColor="#5e5e5e" />
          </radialGradient>
          <radialGradient id={id("scan-lung")} cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#1c1c1c" />
            <stop offset="100%" stopColor="#0b0b0b" />
          </radialGradient>
          <filter id={id("scan-soft-edge")}>
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id={id("scan-grain")} x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed={slice}
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.24" />
            </feComponentTransfer>
          </filter>
        </defs>

        {/* Table d'examen */}
        <path
          d="M70 438 Q256 470 442 438"
          stroke="#3a3a3a"
          strokeWidth="6"
          fill="none"
        />
        <g filter={`url(#${id("scan-soft-edge")})`}>
          {/* Peau et graisse sous-cutanée */}
          <ellipse cx="256" cy="268" rx="196" ry="152" fill="#4f4f4f" />
          <ellipse cx="256" cy="268" rx="184" ry="141" fill="#383838" />
          {/* Paroi musculaire */}
          <ellipse
            cx="256"
            cy="268"
            rx="170"
            ry="128"
            fill={`url(#${id("scan-soft")})`}
            opacity="0.85"
          />
          {/* Côtes, sur le pourtour de la cage thoracique */}
          {RIBS.map(([x, y, rotate]) => (
            <ellipse
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              rx="9"
              ry="5"
              transform={`rotate(${rotate} ${x} ${y})`}
              fill="#d2d2d2"
            />
          ))}
          {/* Poumons */}
          <ellipse
            cx={256 - 78}
            cy="252"
            rx={62 * lung + 12}
            ry={92 * lung + 10}
            fill={`url(#${id("scan-lung")})`}
          />
          <ellipse
            cx={256 + 80}
            cy="252"
            rx={58 * lung + 12}
            ry={90 * lung + 10}
            fill={`url(#${id("scan-lung")})`}
          />
          {/* Vaisseaux pulmonaires : ils bougent d'une coupe à l'autre */}
          {vessels(slice, lung).map(([x, y, r], index) => (
            <circle key={index} cx={x} cy={y} r={r} fill="#5a5a5a" />
          ))}
          {/* Médiastin : cœur et aorte */}
          <ellipse cx="248" cy="252" rx="46" ry="40" fill="#7c7c7c" />
          <ellipse cx="236" cy="246" rx="18" ry="14" fill="#8e8e8e" />
          <circle cx="282" cy="306" r="15" fill="#9a9a9a" />
          {/* Muscles paravertébraux */}
          <ellipse cx="222" cy="372" rx="24" ry="16" fill="#6c6c6c" />
          <ellipse cx="290" cy="372" rx="24" ry="16" fill="#6c6c6c" />
          {/* Vertèbre : corps, canal, arc postérieur */}
          <circle cx="256" cy="340" r="22" fill="#d8d8d8" />
          <circle cx="256" cy="340" r="13" fill="#b0b0b0" />
          <path
            d="M236 356 Q256 384 276 356"
            stroke="#d0d0d0"
            strokeWidth="6"
            fill="none"
          />
          <circle cx="256" cy="366" r="6" fill="#2a2a2a" />
          <rect x="252" y="380" width="8" height="18" rx="3" fill="#c8c8c8" />
          {/* Sternum */}
          <rect x="244" y="128" width="24" height="12" rx="4" fill="#c4c4c4" />
        </g>
        {/* Grain d'acquisition */}
        <rect width="512" height="512" filter={`url(#${id("scan-grain")})`} />
      </svg>

      {/* Surimpressions, aux quatre coins, comme sur une console. */}
      <Overlay className="top-3 left-3">
        <span className="text-ink-200">
          {formatPatientName(study.patientName)}
        </span>
        <span>{study.patientId}</span>
        {demographics && <span>{demographics}</span>}
      </Overlay>
      <Overlay className="top-3 right-3 items-end text-right">
        <span>{study.clinic}</span>
        <span>
          {study.modality}
          {study.bodyPart && ` · ${study.bodyPart}`}
        </span>
      </Overlay>
      <Overlay className="bottom-3 left-3">
        <span>Série 2 · Axial</span>
        <span className="tabular-nums">
          Im {slice} / {total}
        </span>
      </Overlay>
      <Overlay className="right-3 bottom-3 items-end text-right">
        <span>F 400 · N 40</span>
        <span>Ép. 1,0 mm</span>
      </Overlay>
      <span className="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-[11px] text-ink-400">
        D
      </span>
      <span className="absolute top-1/2 right-3 -translate-y-1/2 font-mono text-[11px] text-ink-400">
        G
      </span>
    </div>
  );
}

/** Côtes : position et inclinaison, sur le pourtour du thorax. */
const RIBS: [number, number, number][] = [
  [104, 210, -60],
  [96, 268, -88],
  [110, 328, 60],
  [150, 372, 35],
  [408, 210, 60],
  [416, 268, 88],
  [402, 328, -60],
  [362, 372, -35],
  [150, 156, -30],
  [362, 156, 30],
];

/**
 * Vaisseaux pulmonaires d'une coupe : petits points clairs dans chaque
 * poumon.
 *
 * Positions pseudo-aléatoires mais **déterministes** — dérivées du numéro
 * de coupe — pour que le rendu serveur et le rendu client tracent la même
 * image, et qu'une coupe revisitée soit identique.
 */
function vessels(slice: number, lung: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const random = (seed: number) => {
    const x = Math.sin(seed * 12.9898 + slice * 78.233) * 43_758.5453;
    return x - Math.floor(x);
  };
  for (let index = 0; index < 36; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const angle = random(index) * Math.PI * 2;
    const radius = Math.sqrt(random(index + 100)) * 0.85;
    points.push([
      256 + side * 79 + Math.cos(angle) * radius * (60 * lung + 12),
      252 + Math.sin(angle) * radius * (90 * lung + 10),
      0.8 + random(index + 200) * 2.2,
    ]);
  }
  return points;
}

/** Bloc de surimpression : texte mono, discret, posé sur l'image.
 *
 * Limité à 45 % de la largeur, lignes tronquées : deux coins opposés ne
 * peuvent pas se rejoindre, même sur un téléphone.
 */
function Overlay({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`pointer-events-none absolute flex max-w-[45%] flex-col gap-0.5 font-mono text-[11px] leading-tight text-ink-400 *:truncate ${className}`}
    >
      {children}
    </div>
  );
}
