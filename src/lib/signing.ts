/**
 * Règles de la signature, du cachet et du code personnel du radiologue.
 *
 * Les mêmes que le service (`app/services/signing.py`), qui fait foi :
 * l'écran s'en sert pour refuser d'emblée ce que le service refuserait,
 * sans rien envoyer, et pour dire pourquoi avant que le radiologue ne
 * valide.
 *
 * - **Code personnel** : six chiffres, ni identiques ni en suite
 *   (`123456`, `987654`), obligatoire pour signer et pour ajouter un
 *   addendum. Cinq erreurs le verrouillent quinze minutes.
 * - **Images** : la signature (tracée ou importée) et le cachet
 *   (importé), PNG ou JPEG, 2 Mo au plus. Le service les relit, les
 *   réencode et les soumet à l'équipe IMAFRIK avant qu'elles ne
 *   s'impriment.
 */

/** Nature d'une image apposée sur le compte-rendu. */
export type SigningAssetKind = "signature" | "stamp";

/** Natures, dans l'ordre d'impression au pied du compte-rendu. */
export const SIGNING_ASSET_KINDS: readonly SigningAssetKind[] = [
  "signature",
  "stamp",
];

/** Plus gros fichier accepté, en octets : celui du logo des cliniques. */
export const SIGNING_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

/** Types de fichier acceptés. Ni SVG (scripts possibles) ni PDF. */
export const SIGNING_IMAGE_TYPES = ["image/png", "image/jpeg"] as const;

/**
 * Longueur maximale du fichier une fois encodé en base64.
 *
 * @returns Le nombre de caractères base64 de {@link SIGNING_IMAGE_MAX_BYTES} octets.
 */
export function signingImageMaxBase64Length(): number {
  return Math.ceil(SIGNING_IMAGE_MAX_BYTES / 3) * 4;
}

/** Nombre de chiffres du code personnel. */
export const PIN_LENGTH = 6;

/** Échecs consécutifs qui verrouillent le code (règle du service). */
export const PIN_MAX_FAILURES = 5;

/**
 * Le code a-t-il la forme attendue : six chiffres, rien d'autre ?
 *
 * @param value Saisie.
 */
export function isPinFormat(value: string): boolean {
  return /^\d{6}$/.test(value);
}

/**
 * Le code se devine-t-il d'emblée ?
 *
 * Six chiffres identiques, ou une suite qui monte ou descend d'un pas.
 * Même règle que le service (`is_trivial`).
 *
 * @param value Code de six chiffres.
 */
export function isTrivialPin(value: string): boolean {
  const steps = new Set<number>();
  for (let index = 1; index < value.length; index += 1) {
    steps.add(Number(value[index]) - Number(value[index - 1]));
  }
  if (steps.size !== 1) return false;
  const [step] = steps;
  return step === 0 || step === 1 || step === -1;
}

/** Ce qui empêche d'accepter un code à créer. */
export type NewPinProblem = "format" | "trivial" | "mismatch";

/**
 * Contrôle d'un code à créer, avant tout envoi.
 *
 * @param pin          Code choisi.
 * @param confirmation Seconde saisie.
 * @returns Le premier problème rencontré, ou `null`.
 */
export function newPinProblem(
  pin: string,
  confirmation: string,
): NewPinProblem | null {
  if (!isPinFormat(pin)) return "format";
  if (isTrivialPin(pin)) return "trivial";
  if (pin !== confirmation) return "mismatch";
  return null;
}

/**
 * Code joint à un geste qui engage le radiologue : signature, addendum,
 * dépôt d'une image, changement de code.
 */
export interface PinProof {
  /** Code saisi. */
  pin: string;
  /** Vrai si le code est créé dans ce geste, faute d'en avoir un. */
  definePin?: boolean;
  /** Seconde saisie d'un code créé. */
  pinConfirmation?: string;
}

/**
 * Forme d'un {@link PinProof} reçu du navigateur, contrôlée avant envoi.
 *
 * Une action serveur est un point d'entrée public : la preuve est relue
 * ici, quel que soit le typage.
 *
 * @param value Valeur reçue.
 * @returns La preuve, si elle a la forme attendue.
 */
export function parsePinProof(value: unknown): PinProof | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.pin !== "string" || !isPinFormat(record.pin)) return null;
  if (record.definePin === true) {
    if (typeof record.pinConfirmation !== "string") return null;
    return {
      pin: record.pin,
      definePin: true,
      pinConfirmation: record.pinConfirmation,
    };
  }
  return { pin: record.pin };
}

/**
 * Corps envoyé au service pour une preuve de code.
 *
 * @param proof Preuve contrôlée.
 */
export function pinBody(proof: PinProof): {
  pin: string;
  define_pin: boolean;
  pin_confirmation?: string;
} {
  return proof.definePin
    ? {
        pin: proof.pin,
        define_pin: true,
        pin_confirmation: proof.pinConfirmation,
      }
    : { pin: proof.pin, define_pin: false };
}

/** Codes de refus du service liés au code personnel. */
export type PinRefusal =
  | "pin_not_set"
  | "pin_required"
  | "pin_format"
  | "pin_trivial"
  | "pin_mismatch"
  | "pin_already_set"
  | "pin_wrong"
  | "pin_locked"
  | "pin_unverifiable";

const PIN_REFUSALS = new Set<string>([
  "pin_not_set",
  "pin_required",
  "pin_format",
  "pin_trivial",
  "pin_mismatch",
  "pin_already_set",
  "pin_wrong",
  "pin_locked",
  "pin_unverifiable",
]);

/**
 * Le refus porte-t-il sur le code personnel ?
 *
 * @param code Code machine du refus, s'il y en a un.
 */
export function isPinRefusal(code: string | undefined): code is PinRefusal {
  return code !== undefined && PIN_REFUSALS.has(code);
}

/**
 * Le code est-il verrouillé à cet instant ?
 *
 * @param lockedUntil Fin du verrou, ou `null`.
 * @param now         Instant de référence.
 */
export function isPinLocked(lockedUntil: Date | null, now = new Date()) {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

// ─── Tracé de la signature ──────────────────────────────────────────

/** Un point du tracé, en pixels CSS du cadre, et son instant en ms. */
export interface StrokePoint {
  x: number;
  y: number;
  t: number;
}

/** Durée minimale du tracé : en deçà, un clic ou un trait accidentel. */
export const MIN_DRAWING_MS = 500;

/** Longueur minimale cumulée du tracé, en pixels CSS. */
export const MIN_DRAWING_LENGTH = 80;

/** Côté minimal du rectangle qui contient le tracé, en pixels CSS. */
export const MIN_DRAWING_EXTENT = 30;

/** Ce qui empêche d'envoyer un tracé. */
export type DrawingProblem = "empty" | "tooShort" | "tooSmall";

/**
 * Un tracé ressemble-t-il à une signature ?
 *
 * Contrôle de vraisemblance seulement : un point, un trait accidentel ou
 * un gribouillis d'un dixième de seconde sont refusés avant l'envoi. Le
 * service refuse de son côté une image presque vide, et l'équipe IMAFRIK
 * vérifie l'image avant qu'elle ne s'imprime.
 *
 * @param strokes Traits, chacun une suite de points.
 * @returns Le problème, ou `null` si le tracé peut partir.
 */
export function drawingProblem(
  strokes: readonly (readonly StrokePoint[])[],
): DrawingProblem | null {
  const points = strokes.flat();
  if (points.length < 2) return "empty";
  let duration = 0;
  let length = 0;
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    duration += stroke[stroke.length - 1].t - stroke[0].t;
    for (let index = 1; index < stroke.length; index += 1) {
      length += Math.hypot(
        stroke[index].x - stroke[index - 1].x,
        stroke[index].y - stroke[index - 1].y,
      );
    }
  }
  if (duration < MIN_DRAWING_MS) return "tooShort";
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const extent = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  );
  if (length < MIN_DRAWING_LENGTH || extent < MIN_DRAWING_EXTENT) {
    return "tooSmall";
  }
  return null;
}
