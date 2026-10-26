import { describe, expect, it } from "vitest";

import { DEMO_TRAINING_CASES } from "@/lib/demo/training";
import { trainingAttemptSchema, trainingCaseSchema } from "@/lib/api/contracts";
import { toTrainingAttempt, toTrainingCase } from "@/lib/data/training";

const CASE = {
  id: "0b7d3e2a-1f4c-4d8e-9a6b-2c5f7e9d1a3b",
  slug: "irm-cerebrale",
  position: 5,
  modality: "MR",
  body_part: "Encéphale",
  series_count: 5,
  instance_count: 663,
  title: "IRM cérébrale",
  indication: "IRM cérébrale avec injection.",
  instructions: "Lisez les cinq séries.",
  source: {
    name: "ReMIND",
    license: "CC BY 4.0",
    url: "https://doi.org/10.7937/3RAG-D070",
    doi: "10.7937/3RAG-D070",
  },
  state: "submitted",
  attempt_id: "1c8e3a2b-4d5f-4e6a-8b7c-9d0e1f2a3b4c",
  submitted_at: "2026-10-26T10:00:00Z",
  has_reference: true,
  reviewed_by: "Dr Relecteur",
  published: true,
};

/** Consigne et corrigé complet (docs/formation.md du backend, 4.3). */
describe("cas de formation, tels que le service les envoie", () => {
  it("garde la consigne, et l'accepte absente pour un cas plus ancien", () => {
    const parsed = toTrainingCase(trainingCaseSchema.parse(CASE));
    expect(parsed.instructions).toBe("Lisez les cinq séries.");
    const older = toTrainingCase(
      trainingCaseSchema.parse({ ...CASE, instructions: null }),
    );
    expect(older.instructions).toBeNull();
  });

  it("garde les points attendus et le fondement du corrigé", () => {
    const attempt = toTrainingAttempt(
      trainingAttemptSchema.parse({
        id: CASE.attempt_id,
        case_id: CASE.id,
        sections: { conclusion: "<p>Tumeur gliale.</p>" },
        version: 3,
        submitted_at: "2026-10-26T10:00:00Z",
        addenda: [],
        reference: {
          sections: { conclusion: "<p>Glioblastome.</p>" },
          points: ["Localiser la lésion.", "La mesurer."],
          basis: "Fiche clinique de ReMIND-066.",
          author: "Dr Validateur",
          validated_at: "2026-10-25T09:00:00Z",
        },
        created_at: "2026-10-26T09:00:00Z",
        updated_at: "2026-10-26T10:00:00Z",
      }),
    );
    expect(attempt.reference?.points).toEqual([
      "Localiser la lésion.",
      "La mesurer.",
    ]);
    expect(attempt.reference?.basis).toBe("Fiche clinique de ReMIND-066.");
    expect(attempt.reference?.sections.conclusion).toBe("<p>Glioblastome.</p>");
  });

  it("la démonstration montre les sept cas du catalogue, chacun avec sa consigne", () => {
    expect(DEMO_TRAINING_CASES.map((c) => c.slug)).toEqual([
      "radio-thorax",
      "scanner-thorax",
      "irm-foie",
      "scanner-cerebral",
      "irm-cerebrale",
      "irm-rachis-lombaire",
      "radio-bassin",
    ]);
    for (const trainingCase of DEMO_TRAINING_CASES)
      expect(trainingCase.instructions, trainingCase.slug).toBeTruthy();
  });
});
