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
 */

/** Nature d'un point relevé. */
export type ReviewKind = "laterality" | "placeholder" | "unit" | "repeat";

/** Un point à vérifier. */
export interface ReviewFinding {
  kind: ReviewKind;
  /** Section concernée — la conclusion, pour une latéralité. */
  section: SectionKey;
  /** Ce qui est relevé, en une phrase. */
  message: string;
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

type Side = "droit" | "gauche";

/**
 * Côtés mentionnés dans un texte.
 *
 * « bilatéral » et « des deux côtés » valent les deux. Les formes
 * accordées (droite, droits, gauches) et l'abréviation usuelle des
 * comptes-rendus (« D », « G ») ne sont pas retenues pour les lettres
 * seules : trop ambiguës.
 */
export function sidesIn(text: string): Set<Side> {
  const sides = new Set<Side>();
  const lower = text.toLocaleLowerCase("fr");
  if (/\b(bilat[ée]ral\w*|des deux c[ôo]t[ée]s)\b/.test(lower)) {
    sides.add("droit").add("gauche");
  }
  if (/\bdroite?s?\b/.test(lower)) sides.add("droit");
  if (/\bgauches?\b/.test(lower)) sides.add("gauche");
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

/** Unités admises après une mesure. */
const UNIT =
  /^\s*(mm|cm|m|µm|ml|mL|cc|l|L|cm²|cm2|mm²|mm2|cm³|cm3|mm³|mm3|%|UH|HU|°|g|kg|mg|ans?|mois|j|jours?|h|min|s|sec|mSv|mGy|DLP|SUV|mmHg|cm\/s|m\/s|Hz|kHz|MHz|x|×)\b/;

/** Mesures : un verbe ou un nom de mesure suivi d'un nombre, ou des dimensions « a x b ». */
const MEASURE =
  /\b(?:mesur\w*|diam[èe]tre|[ée]paisseur|taille|longueur|grand axe|petit axe)\s+(?:de\s+|d['’]\s*|à\s+|environ\s+)?(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?/gi;

/** Répétitions légitimes en français. */
const LEGIT_REPEATS = new Set(["nous", "vous", "l", "d", "s"]);

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
        message: `L’indication porte sur le côté ${side}, les résultats ne décrivent que le côté ${OPPOSITE[side]}.`,
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
        message: `La conclusion mentionne le côté ${side}, absent de l’indication et des résultats, qui ne parlent que du côté ${OPPOSITE[side]}.`,
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
        message: `Passage de modèle non complété : « ${match[0]} ».`,
        excerpt: excerpt(text, match.index, match[0].length),
      });
    }

    for (const match of text.matchAll(MEASURE)) {
      const after = text.slice(match.index + match[0].length);
      if (UNIT.test(after)) continue;
      findings.push({
        kind: "unit",
        section: section.key,
        message: `Mesure sans unité : « ${match[0].trim()} ».`,
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
        message: `Mot répété : « ${match[0]} ».`,
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
