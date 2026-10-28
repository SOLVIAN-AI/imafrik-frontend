import { describe, expect, it } from "vitest";

import { fr } from "@/i18n/messages/fr";
import {
  describeModalities,
  MODALITY_GROUPS,
  MODALITY_SLUGS,
  modalityGroupOf,
  readModalityGroup,
} from "@/lib/modalities";

describe("groupes de modalités", () => {
  it("classe les codes DICOM comme `public.modality_group`", () => {
    expect(modalityGroupOf("CR")).toBe("radiography");
    // L'HSG est une radiographie.
    expect(modalityGroupOf("RF")).toBe("radiography");
    expect(modalityGroupOf("XA")).toBe("radiography");
    expect(modalityGroupOf("MG")).toBe("mammography");
    expect(modalityGroupOf("us")).toBe("ultrasound");
    expect(modalityGroupOf("CT\\SR")).toBe("ct");
    expect(modalityGroupOf("MR")).toBe("mri");
    expect(modalityGroupOf("PT")).toBe("other");
    expect(modalityGroupOf(null)).toBe("other");
    expect(modalityGroupOf("")).toBe("other");
  });

  it("met le groupe dans l’adresse par un mot court, et le relit", () => {
    const slugs = Object.values(MODALITY_SLUGS);
    expect(new Set(slugs).size).toBe(MODALITY_GROUPS.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z]+$/);
    for (const group of MODALITY_GROUPS)
      expect(readModalityGroup(MODALITY_SLUGS[group])).toBe(group);
    // Absent ou inconnu : toutes les modalités.
    expect(readModalityGroup(undefined)).toBeUndefined();
    expect(readModalityGroup("hsg")).toBeUndefined();
    expect(readModalityGroup(["scanner", "irm"])).toBeUndefined();
  });

  it("dit en clair ce que lit un radiologue", () => {
    const labels = fr.assignment.modalities;
    expect(describeModalities(null, labels)).toBe("Toutes les modalités");
    expect(describeModalities(["ct", "mri"], labels)).toBe("Scanner, IRM");
  });
});
