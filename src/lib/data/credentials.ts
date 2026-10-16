import "server-only";

import { z } from "zod";

import { apiGet } from "@/lib/api/client";
import { credentialDocumentSchema } from "@/lib/api/contracts";
import type { DocumentKind } from "@/lib/credentials";
import { demoCredentialDocuments } from "@/lib/demo/control";
import { isDemoMode } from "@/lib/demo/mode";

/**
 * Un justificatif déposé, et la décision de l'équipe IMAFRIK.
 *
 * Jamais d'adresse du fichier : le radiologue ne la reçoit pas, et
 * l'équipe IMAFRIK l'obtient à la demande, pour quelques minutes, par
 * une consultation tracée (`viewCredentialDocument`).
 */
export interface CredentialDocument {
  id: string;
  kind: DocumentKind;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  /** Attestation : dernier jour de validité (`AAAA-MM-JJ`). */
  validUntil: string | null;
  status: "pending" | "accepted" | "rejected";
  /** Motif d'un refus, écrit pour le radiologue. */
  rejectionReason: string | null;
  uploadedAt: Date;
  reviewedAt: Date | null;
}

/** Convertit un justificatif tel que le service le renvoie. */
function toDocument(
  row: z.output<typeof credentialDocumentSchema>,
): CredentialDocument {
  return {
    id: row.id,
    kind: row.kind,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    validUntil: row.valid_until ?? null,
    status: row.status,
    rejectionReason: row.rejection_reason ?? null,
    uploadedAt: new Date(row.uploaded_at),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
  };
}

/** Justificatifs du radiologue connecté, du plus récent au plus ancien. */
export async function getMyCredentialDocuments(): Promise<
  CredentialDocument[]
> {
  if (isDemoMode()) return [];
  const rows = await apiGet(
    "/me/credential-documents",
    z.array(credentialDocumentSchema),
  );
  return rows.map(toDocument);
}

/**
 * Justificatifs d'un compte, pour l'équipe IMAFRIK.
 *
 * @param profileId Compte examiné.
 */
export async function getUserCredentialDocuments(
  profileId: string,
): Promise<CredentialDocument[]> {
  if (isDemoMode()) return demoCredentialDocuments(profileId).map(toDocument);
  const rows = await apiGet(
    `/admin/users/${encodeURIComponent(profileId)}/credential-documents`,
    z.array(credentialDocumentSchema),
  );
  return rows.map(toDocument);
}
