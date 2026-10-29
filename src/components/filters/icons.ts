import {
  CalendarRange,
  CircleDot,
  Hospital,
  type LucideIcon,
  ScanLine,
  Siren,
  Stethoscope,
} from "lucide-react";

import type { DimensionKey } from "@/lib/filters/dimensions";

/** Pictogramme de chaque dimension, sur son bouton ou sa puce. */
export const DIMENSION_ICONS: Record<DimensionKey, LucideIcon> = {
  clinic: Hospital,
  radiologist: Stethoscope,
  modality: ScanLine,
  state: CircleDot,
  urgency: Siren,
  period: CalendarRange,
};
