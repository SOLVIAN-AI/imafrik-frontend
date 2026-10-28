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
