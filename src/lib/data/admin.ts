import "server-only";

import { z } from "zod";

import { apiGet } from "@/lib/api/client";
import {
  adminOrganizationSchema,
  contactRequestSchema,
} from "@/lib/api/contracts";
import {
  DEMO_GROUP,
  DEMO_NETWORK,
  demoContactRequests,
  demoFlows,
} from "@/lib/demo/control";
import type { ContactStatus } from "@/lib/contact-status";
import { isDemoMode } from "@/lib/demo/mode";
import type { OrgKind } from "@/lib/session/types";

const DAY = 86_400_000;

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
  /** Examens reçus sur trente jours. */
  received30d: number;
  /**
   * Dernier examen reçu : une passerelle muette se voit ici avant qu'une
   * clinique ne s'en plaigne.
   */
  lastReceivedAt: Date | null;
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
  status: ContactStatus;
  /** Notes de l'équipe IMAFRIK. */
  notes: string | null;
  handledAt: Date | null;
  createdAt: Date;
}

/**
 * Organisations de démonstration : le réseau synthétique de la tour de
 * contrôle, pour que les volumes concordent d'un écran à l'autre.
 */
function demoOrganizations(): AdminOrganization[] {
  const now = Date.now();
  const clinics = DEMO_NETWORK.map((clinic): AdminOrganization => {
    const all = demoFlows(now - clinic.ageDays * DAY, now, clinic.id);
    return {
      id: clinic.id,
      name: clinic.name,
      kind: "clinic",
      city: clinic.city,
      active: true,
      openToPool: true,
      connected: true,
      studyCount: all.length,
      memberCount: clinic.volume > 0 ? 3 : 1,
      received30d: all.filter((flow) => flow.receivedAt >= now - 30 * DAY)
        .length,
      lastReceivedAt: all[0] ? new Date(all[0].receivedAt) : null,
      createdAt: new Date(now - clinic.ageDays * DAY),
    };
  });
  const group: AdminOrganization = {
    id: DEMO_GROUP.id,
    name: DEMO_GROUP.name,
    kind: "radiology_group",
    city: "Lomé",
    active: true,
    openToPool: false,
    connected: false,
    studyCount: 0,
    memberCount: 5,
    received30d: 0,
    lastReceivedAt: null,
    createdAt: new Date(now - 450 * DAY),
  };
  return [...clinics, group].sort((a, b) => a.name.localeCompare(b.name, "fr"));
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
    received30d: row.received_30d,
    lastReceivedAt: row.last_received_at
      ? new Date(row.last_received_at)
      : null,
    createdAt: new Date(row.created_at),
  }));
}

/** Demandes reçues par le site, les plus récentes d'abord. */
export async function listContactRequests(): Promise<ContactRequest[]> {
  const rows = isDemoMode()
    ? demoContactRequests()
    : await apiGet("/admin/contact-requests", z.array(contactRequestSchema));
  return rows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    organization: row.organization,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: row.status,
    notes: row.notes,
    handledAt: row.handled_at ? new Date(row.handled_at) : null,
    createdAt: new Date(row.created_at),
  }));
}
