import { describe, expect, it } from "vitest";

import { reportSchema, studyPageSchema } from "@/lib/api/contracts";

const study = {
  id: "11111111-1111-4111-8111-111111111111",
  organization_id: "22222222-2222-4222-8222-222222222222",
  clinic_name: "Clinique A",
  study_instance_uid: "1.2.3",
  patient_name: "KOFFI^Ama",
  patient_id_local: "P1",
  patient_birthdate: null,
  patient_sex: null,
  modality: "CT",
  body_part: null,
  study_date: null,
  instance_count: 12,
  series_count: 1,
  status: "received",
  priority: "urgent",
  assigned_to: null,
  assigned_to_name: null,
  clinical_info: null,
  received_at: "2026-10-06T10:00:00Z",
  reported_at: null,
  reported_by_name: null,
  report_id: null,
  due_at: "2026-08-24T12:00:00Z",
};

describe("contrat d'API", () => {
  it("accepte une page d'examens conforme", () => {
    expect(
      studyPageSchema.parse({ items: [study], total: 1 }).items[0].clinic_name,
    ).toBe("Clinique A");
  });

  it("refuse un statut inconnu plutôt que de l'afficher de travers", () => {
    expect(() =>
      studyPageSchema.parse({
        items: [{ ...study, status: "lost" }],
        total: 1,
      }),
    ).toThrow();
  });

  it("exige les addenda d'un compte-rendu", () => {
    const report = {
      id: study.id,
      study_id: study.id,
      author_id: study.id,
      status: "signed",
      sections: { conclusion: "<p>RAS</p>" },
      version: 3,
      signed_at: "2026-10-06T12:00:00Z",
      signed_by: study.id,
      signer_name: "Carla",
      signer_title: "Dr",
      signer_license: "TG-1",
      pdf_sha256: "a".repeat(64),
      verify_token: "tok",
      created_at: "2026-10-06T10:00:00Z",
      updated_at: "2026-10-06T12:00:00Z",
    };
    expect(() => reportSchema.parse(report)).toThrow();
    expect(reportSchema.parse({ ...report, addenda: [] }).version).toBe(3);
  });
});
