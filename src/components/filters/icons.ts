import { Hospital, type LucideIcon, ScanLine, Siren } from "lucide-react";

import type { DimensionKey } from "@/lib/filters/dimensions";

/** Pictogramme de chaque dimension, sur son bouton ou sa puce. */
export const DIMENSION_ICONS: Record<DimensionKey, LucideIcon> = {
  clinic: Hospital,
  modality: ScanLine,
  urgency: Siren,
};
