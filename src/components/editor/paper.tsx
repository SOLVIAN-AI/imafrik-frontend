"use client";

import { FileText, LayoutList, Lock, QrCode } from "lucide-react";
import * as React from "react";

import { BrandMark, Wordmark } from "@/components/brand/brand";
import {
  REPORT_LAYOUTS,
  type ReportLayout,
} from "@/components/editor/sections";
import { InfoTip } from "@/components/ui/info-tip";
import { messagesFor } from "@/i18n";
import { useMessages } from "@/i18n/client";
import type { Letterhead } from "@/lib/data/reports";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * La feuille autour du texte : ce que le service ajoute seul au document.
 *
 * **Le radiologue rédige sous l'en-tête qu'il signera.** Dans les deux
 * mises en page, la feuille montre, verrouillés, l'en-tête de la clinique
 * (nom, ville, logo), l'identité du patient et l'examen, puis, sous le
 * texte, la place de la signature, du cachet et du QR de vérification, et
 * le logo IMAFRIK. Rien de tout cela n'est un champ : le texte rédigé ne
 * peut ni le modifier ni le retirer, et le PDF signé le relit en base.
 *
 * **Discret, à dessein.** La feuille est sombre (voir `ReportEditor`) et
 * voisine de l'image : le logo de la clinique y est montré en niveaux de
 * gris, petit, et les mentions en texte tertiaire. Le PDF, lui, l'imprime
 * en filigrane pâle sur chaque page.
 */

/** Ce que la feuille sait de l'examen et du signataire. */
export interface PaperContext {
  /** En-tête lu sur le service ; `null` s'il n'a pu l'être. */
  letterhead: Letterhead | null;
  /** Nom de la clinique, à défaut d'en-tête. */
  clinic: string;
  patient: {
    /** Nom, déjà mis en forme (`NOM Prénom`). */
    name: string;
    id: string;
    /** `AAAA-MM-JJ`, ou `null`. */
    birthDate: string | null;
    /** Modalité et région, celles qui sont connues. */
    exam: string;
  };
  /** Signataire et images apposées : le pied de la feuille d'un auteur. */
  signer?: {
    name: string;
    signature?: string;
    stamp?: string;
  };
}

/** Mois anglais : une date anglaise s'écrit en toutes lettres, comme sur le PDF. */
const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Date imprimée, dans la langue du compte-rendu, sans fuseau : la même
 * forme que le PDF (`06/10/2026`, ou `6 October 2026`).
 *
 * @param iso    Date `AAAA-MM-JJ`.
 * @param locale Langue du compte-rendu.
 */
export function printedDate(iso: string, locale: Locale): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  if (locale === "en") return `${day} ${MONTHS_EN[month - 1]} ${year}`;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/** Mention « Automatique », et ce qu'elle couvre, dans une bulle ⓘ. */
function AutomaticChip() {
  const labels = useMessages().reading.letterhead;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-active py-0.5 pr-1 pl-2 text-2xs font-medium text-secondary">
      <Lock className="size-3" aria-hidden />
      {labels.automatic}
      <InfoTip
        label={labels.locked}
        title={labels.locked}
        text={labels.automaticInfo}
        term="feuilleBlanche"
        side="bottom"
      />
    </span>
  );
}

/**
 * En-tête de la feuille : clinique, ville, logo, puis l'identité du
 * patient et l'examen, aux intitulés du PDF.
 */
export function PaperHead({
  paper,
  language,
}: {
  paper: PaperContext;
  /** Langue du compte-rendu, celle des intitulés imprimés. */
  language: Locale;
}) {
  const labels = useMessages().reading.letterhead;
  const print = messagesFor(language).reading.letterhead.print;
  const head = paper.letterhead;
  const name = head?.organizationName ?? paper.clinic;
  const fields: [string, string | null][] = [
    [print.patient, paper.patient.name],
    [print.identifier, paper.patient.id || null],
    [
      print.birth,
      paper.patient.birthDate
        ? printedDate(paper.patient.birthDate, language)
        : null,
    ],
    [print.exam, paper.patient.exam || null],
    [
      print.date,
      head?.studyDate ? printedDate(head.studyDate, language) : null,
    ],
  ];
  return (
    <header
      aria-label={labels.locked}
      className="border-b border-border-subtle px-5 pt-5 pb-4 select-none sm:px-10 sm:pt-6"
    >
      <div className="flex items-start gap-3">
        {head?.logo && (
          // Niveaux de gris : rien de saturé à côté de l'image. Le PDF,
          // lui, l'imprime en couleur, en filigrane pâle.
          // eslint-disable-next-line @next/next/no-img-element -- image embarquée
          <img
            src={head.logo}
            alt={labels.logoAlt(name)}
            className="size-10 shrink-0 rounded-md bg-white object-contain p-1 opacity-85 grayscale"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-2xs text-tertiary">
            {[head?.city, head?.customHeader ? labels.customHeader : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <AutomaticChip />
      </div>
      <dl
        lang={language}
        className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 rounded-lg bg-surface-sunken/60 px-3 py-2 text-2xs sm:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]"
      >
        {fields.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="text-tertiary">{label}</dt>
            <dd
              className={cn(
                "min-w-0 truncate",
                value ? "text-secondary" : "text-tertiary italic",
              )}
            >
              {value ?? print.missing}
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </header>
  );
}

/**
 * Pied de la feuille : la place de la signature et du cachet, le QR de
 * vérification et le logo IMAFRIK. Rien ne s'y écrit.
 */
export function PaperFoot({
  paper,
  language,
}: {
  paper: PaperContext;
  language: Locale;
}) {
  const t = useMessages();
  const labels = t.reading.letterhead;
  const print = messagesFor(language).reading.letterhead.print;
  const signer = paper.signer;
  if (!signer) return null;
  const images = [
    signer.signature && {
      src: signer.signature,
      alt: t.reading.signPin.signatureAlt,
    },
    signer.stamp && { src: signer.stamp, alt: t.reading.signPin.stampAlt },
  ].filter((image): image is { src: string; alt: string } => !!image);

  return (
    <footer
      aria-label={labels.locked}
      className="border-t border-border-subtle px-5 py-4 text-2xs text-tertiary select-none sm:px-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1 basis-48">
          {images.length > 0 ? (
            <div className="mb-2 inline-flex items-end gap-2 rounded-md bg-white px-2 py-1.5">
              {images.map((image) => (
                // eslint-disable-next-line @next/next/no-img-element -- image embarquée
                <img
                  key={image.alt}
                  src={image.src}
                  alt={image.alt}
                  className="h-8 w-auto max-w-28 object-contain"
                />
              ))}
            </div>
          ) : null}
          <p className="font-medium text-secondary">{signer.name}</p>
          <p>{labels.signatureSlot}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2" lang={language}>
          <QrCode className="size-7" aria-hidden />
          <span>
            {labels.qr}
            <span className="block">{print.verify}</span>
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <BrandMark variant="micro" className="size-3.5" title="" />
        <Wordmark className="h-2.5" title="IMAFRIK" />
        <span className="min-w-0 truncate">{labels.issuedBy}</span>
      </div>
    </footer>
  );
}

/**
 * Choix de la mise en page : découpe proposée ou feuille blanche.
 *
 * Deux boutons radio plutôt qu'un interrupteur : ce sont deux façons de
 * rédiger, nommées, pas un réglage qu'on allume. Les flèches passent de
 * l'une à l'autre, comme dans tout groupe radio.
 *
 * @param value    Mise en page affichée.
 * @param onChange Demande de changement ; l'appelant convertit le texte,
 *                 et demande confirmation quand il le faut.
 */
export function LayoutSwitch({
  value,
  onChange,
}: {
  value: ReportLayout;
  onChange: (layout: ReportLayout) => void;
}) {
  const labels = useMessages().reading.layout;
  const labelId = React.useId();
  const refs = React.useRef(new Map<ReportLayout, HTMLButtonElement>());
  const icons = { structured: LayoutList, free: FileText } as const;

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    )
      return;
    event.preventDefault();
    const next = value === "structured" ? "free" : "structured";
    refs.current.get(next)?.focus();
    onChange(next);
  };

  return (
    <div
      data-tour="layout"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border-subtle px-5 py-3 sm:px-10"
    >
      <span id={labelId} className="label-eyebrow">
        {labels.label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={onKeyDown}
        className="inline-flex rounded-lg border border-border-subtle bg-surface-sunken p-0.5"
      >
        {REPORT_LAYOUTS.map((layout) => {
          const Icon = icons[layout];
          const checked = layout === value;
          return (
            <button
              key={layout}
              ref={(element) => {
                if (element) refs.current.set(layout, element);
                else refs.current.delete(layout);
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => !checked && onChange(layout)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-2xs font-medium whitespace-nowrap transition-colors",
                checked
                  ? "bg-surface-active text-primary shadow-edge"
                  : "text-tertiary hover:text-secondary",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {labels.names[layout]}
            </button>
          );
        })}
      </div>
      <InfoTip
        label={labels.label}
        title={labels.label}
        text={labels.info}
        term="feuilleBlanche"
        className="-ml-2"
      />
    </div>
  );
}
