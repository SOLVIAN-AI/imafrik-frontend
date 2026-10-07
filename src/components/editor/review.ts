import type { AppMessages } from "@/i18n";
import {
  REPORT_SECTIONS,
  type ReportSections,
  type SectionKey,
} from "@/components/editor/sections";

/**
 * Relecture automatique d'un compte-rendu, avant signature.
 *
 * Le correcteur du navigateur trouve les fautes d'orthographe ; il ne
 * voit pas les erreurs qui comptent en radiologie, celles qui se
 * glissent quand on rédige vite à partir d'un modèle :
 *
 * - **la latéralité** — un genou droit demandé, un genou gauche décrit.
 *   C'est l'erreur de compte-rendu la plus citée dans les retours
 *   d'expérience, et la plus lourde de conséquences ;
 * - **le reste d'un modèle** — « [à compléter] », « XX mm », « ___ »
 *   imprimés tels quels sous une signature ;
 * - **une mesure sans unité** — « mesurant 12 », « 34 x 21 » : millimètres
 *   ou centimètres, le facteur dix change la conduite à tenir ;
 * - **un mot répété** — « le le », trace d'une dictée reprise.
 *
 * Ce sont des **signalements**, jamais des blocages : la règle peut se
 * tromper (« pas d'anomalie à droite ni à gauche »), et le radiologue
 * reste seul juge de son texte. Fonction pure, testée à part.
 *
 * **Deux langues, deux rôles.** La détection lit le texte du
 * compte-rendu ; les messages, eux, s'écrivent dans la langue de
 * l'utilisateur ({@link describeFinding}). Un point relevé porte donc des
 * données (côtés, passage en cause), pas une phrase toute faite.
 *
 * La détection reconnaît le français **et** l'anglais, quelle que soit la
 * langue de l'interface : une clinique anglophone reçoit des
 * comptes-rendus anglais, rédigés parfois par un radiologue dont
 * l'interface est en français.
 */

/** Nature d'un point relevé. */
export type ReviewKind = "laterality" | "placeholder" | "unit" | "repeat";

/** Côté du patient, tel que la relecture le repère. */
export type Side = "droit" | "gauche";

/** Un point à vérifier. */
export interface ReviewFinding {
  kind: ReviewKind;
  /**
   * Section concernée. Pour une latéralité : les résultats quand ils
   * contredisent l'indication, la conclusion quand elle contredit les deux.
   */
  section: SectionKey;
  /** Latéralité : le côté en cause, et le seul côté rencontré ailleurs. */
  sides?: { side: Side; other: Side };
  /** Passage relevé tel qu'il est écrit : reste de modèle, mesure, mot répété. */
  match?: string;
  /** Extrait du texte, pour le retrouver d'un coup d'œil. */
  excerpt?: string;
}

/** Texte brut d'un fragment HTML : balises ôtées, entités courantes rendues. */
export function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h3|li|td|th|tr)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

/**
 * Côtés mentionnés dans un texte.
 *
 * « bilatéral » et « des deux côtés » valent les deux, comme « bilateral »
 * et « both sides » en anglais. Les formes accordées (droite, droits,
 * gauches) sont reconnues ; les abréviations usuelles (« D », « G »,
 * « R », « L ») ne le sont pas : trop ambiguës seules.
 */
export function sidesIn(text: string): Set<Side> {
  const sides = new Set<Side>();
  const lower = text.toLocaleLowerCase("fr");
  if (/\b(bilat[ée]ral\w*|des deux c[ôo]t[ée]s|both sides)\b/.test(lower)) {
    sides.add("droit").add("gauche");
  }
  if (/\b(droite?s?|right)\b/.test(lower)) sides.add("droit");
  if (/\b(gauches?|left)\b/.test(lower)) sides.add("gauche");
  return sides;
}

const OPPOSITE: Record<Side, Side> = { droit: "gauche", gauche: "droit" };

/** Extrait autour d'une position, sur une ligne. */
function excerpt(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 24);
  const end = Math.min(text.length, index + length + 24);
  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end).replace(/\s+/g, " ").trim() +
    (end < text.length ? "…" : "")
  );
}

/**
 * Restes de modèle : crochets, X ou tirets bas laissés à la place d'une
 * valeur, points d'interrogation doublés.
 */
const PLACEHOLDER =
  /\[[^\]\n]{0,40}\]|\b[xX]{2,}\b|_{3,}|\?{2,}|\.\.\.\s*mm\b|…\s*mm\b/g;

/** Unités admises après une mesure, en français et en anglais. */
const UNIT =
  /^\s*(mm|cm|m|µm|ml|mL|cc|l|L|cm²|cm2|mm²|mm2|cm³|cm3|mm³|mm3|%|UH|HU|°|g|kg|mg|ans?|mois|j|jours?|years?|months?|weeks?|days?|h|min|s|sec|mSv|mGy|DLP|SUV|mmHg|cm\/s|m\/s|Hz|kHz|MHz|x|×)\b/;

/**
 * Mesures : un verbe ou un nom de mesure suivi d'un nombre, ou des
 * dimensions « a x b ». En français et en anglais.
 */
const MEASURE =
  /\b(?:mesur\w*|diam[èe]tre|[ée]paisseur|taille|longueur|grand axe|petit axe|measur\w*|diameter|thickness|size|length|long axis|short axis)\s+(?:de\s+|d['’]\s*|à\s+|environ\s+|of\s+|about\s+|approximately\s+|up to\s+)?(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?/gi;

/** Répétitions légitimes, en français et en anglais (« that that », « had had »). */
const LEGIT_REPEATS = new Set(["nous", "vous", "l", "d", "s", "that", "had"]);

/**
 * Relit un compte-rendu.
 *
 * @param sections Contenu des sections, en HTML.
 * @returns Les points à vérifier, dans l'ordre du document — latéralité
 *          en tête, parce que c'est la plus grave.
 */
export function reviewReport(sections: ReportSections): ReviewFinding[] {
  const texts = Object.fromEntries(
    REPORT_SECTIONS.map((section) => [
      section.key,
      plainText(sections[section.key] ?? ""),
    ]),
  ) as Record<SectionKey, string>;
  const findings: ReviewFinding[] = [];

  // ─── Latéralité ──────────────────────────────────────────────────
  const asked = sidesIn(texts.indication);
  const described = sidesIn(texts.resultats);
  const concluded = sidesIn(texts.conclusion);

  // Une seule latéralité demandée, l'autre seule décrite.
  if (asked.size === 1 && described.size === 1) {
    const [side] = asked;
    if (described.has(OPPOSITE[side])) {
      findings.push({
        kind: "laterality",
        section: "resultats",
        sides: { side, other: OPPOSITE[side] },
      });
    }
  }
  // Un côté conclu qui n'apparaît nulle part avant, alors que l'autre si.
  for (const side of concluded) {
    const before = new Set([...asked, ...described]);
    if (!before.has(side) && before.has(OPPOSITE[side])) {
      findings.push({
        kind: "laterality",
        section: "conclusion",
        sides: { side, other: OPPOSITE[side] },
      });
    }
  }

  // ─── Par section : modèle, unités, répétitions ──────────────────
  for (const section of REPORT_SECTIONS) {
    const text = texts[section.key];
    if (!text.trim()) continue;

    for (const match of text.matchAll(PLACEHOLDER)) {
      findings.push({
        kind: "placeholder",
        section: section.key,
        match: match[0],
        excerpt: excerpt(text, match.index, match[0].length),
      });
    }

    for (const match of text.matchAll(MEASURE)) {
      const after = text.slice(match.index + match[0].length);
      if (UNIT.test(after)) continue;
      findings.push({
        kind: "unit",
        section: section.key,
        match: match[0].trim(),
        excerpt: excerpt(text, match.index, match[0].length),
      });
    }

    // Bornes de mot en Unicode : `\b` ne connaît que l'ASCII, et
    // « été été » lui échapperait.
    for (const match of text.matchAll(/(?<!\p{L})(\p{L}+)\s+\1(?!\p{L})/giu)) {
      if (LEGIT_REPEATS.has(match[1].toLocaleLowerCase("fr"))) continue;
      findings.push({
        kind: "repeat",
        section: section.key,
        match: match[0],
        excerpt: excerpt(text, match.index, match[0].length),
      });
    }
  }

  const order: Record<ReviewKind, number> = {
    laterality: 0,
    placeholder: 1,
    unit: 2,
    repeat: 3,
  };
  const position = (key: SectionKey) =>
    REPORT_SECTIONS.findIndex((section) => section.key === key);
  return findings.sort(
    (a, b) =>
      order[a.kind] - order[b.kind] ||
      position(a.section) - position(b.section),
  );
}

/**
 * Message d'un point relevé, dans la langue de l'utilisateur.
 *
 * @param finding  Point relevé par {@link reviewReport}.
 * @param messages Textes de la relecture (`reading.review`), dans la
 *                 langue de l'utilisateur.
 * @returns Une phrase, par exemple « Mesure sans unité : « 12 ». ».
 */
export function describeFinding(
  finding: ReviewFinding,
  messages: AppMessages["reading"]["review"],
): string {
  const match = finding.match ?? "";
  switch (finding.kind) {
    case "laterality": {
      const side = messages.sides[finding.sides?.side ?? "droit"];
      const other = messages.sides[finding.sides?.other ?? "gauche"];
      return finding.section === "conclusion"
        ? messages.lateralityConclusion(side, other)
        : messages.lateralityFindings(side, other);
    }
    case "placeholder":
      return messages.placeholder(match);
    case "unit":
      return messages.unit(match);
    case "repeat":
      return messages.repeat(match);
  }
}
