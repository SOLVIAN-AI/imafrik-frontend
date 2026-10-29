import {
  BellOff,
  Building2,
  FileX,
  Router,
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
  gatewayStatus: Router,
  account: UserCheck,
  urgency: Siren,
  mute: BellOff,
  noPlan: FileX,
  mfa: ShieldAlert,
  period: CalendarRange,
};
