import type { AppMessages } from "@/i18n";
import type { ModalityGroup } from "@/lib/api/contracts";

/**
 * Groupes de modalités qu'un radiologue lit, dans l'ordre de l'écran.
 *
 * Ceux du service (`ModalityGroup`, rangés en base par
 * `public.modality_group`) : radiographie (CR, DX, RF, XA, donc l'HSG),
 * mammographie (MG), échographie (US), scanner (CT), IRM (MR), et tout le
 * reste.
 */
export const MODALITY_GROUPS: readonly ModalityGroup[] = [
  "radiography",
  "mammography",
  "ultrasound",
  "ct",
  "mri",
  "other",
];

/**
 * Ce qu'un radiologue lit, en clair : « Toutes les modalités », ou la
 * liste de ses groupes.
 *
 * @param modalities Groupes lus ; `null` pour tous.
 * @param labels     Noms des groupes.
 */
export function describeModalities(
  modalities: readonly ModalityGroup[] | null,
  labels: AppMessages["assignment"]["modalities"],
): string {
  if (modalities === null) return labels.all;
  return modalities.map((group) => labels[group]).join(", ");
}

/**
 * Groupe d'une modalité DICOM, comme `public.modality_group` en base :
 * l'HSG (RF, XA) est une radiographie, un code inconnu ou absent va dans
 * « Autres ». Pour le jeu de démonstration ; le service, lui, classe en
 * base.
 *
 * @param code Code DICOM de l'examen (`CT`, `MR`…), ou `null`.
 */
export function modalityGroupOf(code: string | null): ModalityGroup {
  switch ((code ?? "").split("\\")[0].toUpperCase()) {
    case "CR":
    case "DX":
    case "RF":
    case "XA":
      return "radiography";
    case "MG":
      return "mammography";
    case "US":
      return "ultrasound";
    case "CT":
      return "ct";
    case "MR":
      return "mri";
    default:
      return "other";
  }
}

/** Paramètre d'adresse du groupe de modalités d'une liste d'examens. */
export const MODALITY_PARAM = "modalite";

/**
 * Le groupe de modalités dans l'adresse : un mot court, en français. Il ne
 * dit rien d'un patient ; le lien se partage.
 */
export const MODALITY_SLUGS: Readonly<Record<ModalityGroup, string>> = {
  radiography: "radiographie",
  mammography: "mammographie",
  ultrasound: "echographie",
  ct: "scanner",
  mri: "irm",
  other: "autres",
};

/**
 * Le groupe de modalités demandé par l'adresse.
 *
 * @param value Valeur du paramètre `modalite`.
 * @returns Le groupe, ou `undefined` pour toutes les modalités (valeur
 *          absente ou inconnue).
 */
export function readModalityGroup(
  value: string | string[] | undefined,
): ModalityGroup | undefined {
  return MODALITY_GROUPS.find((group) => MODALITY_SLUGS[group] === value);
}
