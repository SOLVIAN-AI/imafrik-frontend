import {
  Building2,
  Cable,
  CircleCheck,
  Shapes,
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
  kind: Shapes,
  organization: Building2,
  radiologist: Stethoscope,
  role: UserRound,
  modality: ScanLine,
  state: CircleDot,
  standing: CircleCheck,
  link: Cable,
  account: UserCheck,
  urgency: Siren,
  mfa: ShieldAlert,
  period: CalendarRange,
};
