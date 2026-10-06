import "server-only";

import { z } from "zod";

import { apiGet } from "@/lib/api/client";
import {
  adminOrganizationSchema,
  contactRequestSchema,
} from "@/lib/api/contracts";
import { isDemoMode } from "@/lib/demo/mode";
import { DEMO_CLINIC_IDS, DEMO_STUDIES } from "@/lib/demo/studies";
import type { OrgKind } from "@/lib/session/types";

/**
 * Une organisation, vue du back-office.
 *
 * L'AE Title d'une clinique n'y figure pas — seulement le fait qu'elle
 * soit raccordée : c'est un secret, et l'écran n'a pas à l'afficher.
 */
export interface AdminOrganization {
  id: string;
  name: string;
  kind: OrgKind;
  city: string;
  active: boolean;
  openToPool: boolean;
  connected: boolean;
  /** Examens envoyés, tous statuts confondus. */
  studyCount: number;
  memberCount: number;
  createdAt: Date;
}

/** Une demande reçue par le formulaire de contact du site. */
export interface ContactRequest {
  id: string;
  fullName: string;
  organization: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  handledAt: Date | null;
  createdAt: Date;
}

/** Organisations de démonstration, dérivées du jeu d'examens. */
function demoOrganizations(): AdminOrganization[] {
  const clinics = Object.entries(DEMO_CLINIC_IDS).map(([name, id]) => ({
    id,
    name,
    kind: "clinic" as const,
    city: name.includes("Kara") ? "Kara" : "Lomé",
    active: true,
    openToPool: true,
    connected: true,
    studyCount: DEMO_STUDIES.filter((study) => study.clinicId === id).length,
    memberCount: 2,
    createdAt: new Date("2026-08-01"),
  }));
  return [
    ...clinics,
    {
      id: "org-radio",
      name: "IMAFRIK Radiologie",
      kind: "radiology_group",
      city: "Lomé",
      active: true,
      openToPool: false,
      connected: false,
      studyCount: 0,
      memberCount: 4,
      createdAt: new Date("2026-08-01"),
    },
  ];
}

/**
 * Toutes les organisations de la plateforme.
 *
 * Réservé à l'équipe IMAFRIK : le service le vérifie en base à chaque
 * appel, quel que soit ce que l'interface affiche.
 */
export async function listOrganizations(): Promise<AdminOrganization[]> {
  if (isDemoMode()) return demoOrganizations();
  const rows = await apiGet(
    "/admin/organizations",
    z.array(adminOrganizationSchema),
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    city: row.city ?? "",
    active: row.is_active,
    openToPool: row.open_to_pool,
    connected: row.has_dicom_aet,
    studyCount: row.study_count,
    memberCount: row.member_count,
    createdAt: new Date(row.created_at),
  }));
}

/** Demandes reçues par le site, les plus récentes d'abord. */
export async function listContactRequests(): Promise<ContactRequest[]> {
  if (isDemoMode()) return [];
  const rows = await apiGet(
    "/admin/contact-requests",
    z.array(contactRequestSchema),
  );
  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    organization: row.organization,
    email: row.email,
    phone: row.phone,
    message: row.message,
    handledAt: row.handled_at ? new Date(row.handled_at) : null,
    createdAt: new Date(row.created_at),
  }));
}
