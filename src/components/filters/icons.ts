import {
  Building2,
  CalendarRange,
  CircleDot,
  Hospital,
  type LucideIcon,
  ScanLine,
  ShieldAlert,
  Siren,
  Stethoscope,
  UserCheck,
  UserRound,
} from "lucide-react";

import type { DimensionKey } from "@/lib/filters/dimensions";

/** Pictogramme de chaque dimension, sur son bouton ou sa puce. */
export const DIMENSION_ICONS: Record<DimensionKey, LucideIcon> = {
  clinic: Hospital,
  organization: Building2,
  radiologist: Stethoscope,
  role: UserRound,
  modality: ScanLine,
  state: CircleDot,
  account: UserCheck,
  urgency: Siren,
  mfa: ShieldAlert,
  period: CalendarRange,
};
