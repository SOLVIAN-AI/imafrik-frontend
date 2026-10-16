import { describe, expect, it } from "vitest";

import { documentUnderReview } from "@/components/admin/credentials-actions";
import { documentUploadUrl } from "@/lib/credential-upload";
import type { CredentialDocument } from "@/lib/data/credentials";

describe("envoi d’un justificatif", () => {
  const grant = { endpoint: "https://api.test/me/credential-documents" };

  it("passe le nom et la date de fin en paramètres, encodés", () => {
    expect(
      documentUploadUrl(grant, {
        fileName: "attestation 2026 & co.pdf",
        validUntil: "2027-06-30",
      }),
    ).toBe(
      "https://api.test/me/credential-documents?file_name=attestation+2026+%26+co.pdf&valid_until=2027-06-30",
    );
  });

  it("n’envoie pas de date de fin pour un diplôme", () => {
    expect(documentUploadUrl(grant, { fileName: "diplome.jpg" })).toBe(
      "https://api.test/me/credential-documents?file_name=diplome.jpg",
    );
  });
});

/** Justificatif de test. */
function document(overrides: Partial<CredentialDocument>): CredentialDocument {
  return {
    id: "d",
    kind: "diploma",
    fileName: "diplome.pdf",
    contentType: "application/pdf",
    sizeBytes: 1000,
    validUntil: null,
    status: "pending",
    rejectionReason: null,
    uploadedAt: new Date("2026-10-15T08:00:00Z"),
    reviewedAt: null,
    ...overrides,
  };
}

describe("justificatif examiné par l’équipe IMAFRIK", () => {
  it("retient le plus récent de la nature qu’exige l’exercice", () => {
    const documents = [
      document({ id: "attestation", kind: "enrollment_certificate" }),
      document({ id: "diplome" }),
    ];
    expect(documentUnderReview(documents, "registered")?.id).toBe("diplome");
    expect(documentUnderReview(documents, "resident")?.id).toBe("attestation");
  });

  it("n’examine pas un justificatif refusé, ni un exercice non déclaré", () => {
    const documents = [document({ status: "rejected" })];
    expect(documentUnderReview(documents, "registered")).toBeNull();
    expect(documentUnderReview([document({})], null)).toBeNull();
  });

  it("garde un justificatif accepté, après un changement d’identité", () => {
    const documents = [document({ status: "accepted" })];
    expect(documentUnderReview(documents, "registered")?.status).toBe(
      "accepted",
    );
  });
});
