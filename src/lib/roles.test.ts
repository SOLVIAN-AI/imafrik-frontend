import { describe, expect, it } from "vitest";

import { ROLES_BY_KIND, roleFitsOrganization } from "@/lib/roles";

describe("rôles par nature d'organisation", () => {
  it("reprend exactement la règle du service", () => {
    // Même table que `ROLES_BY_ORGANIZATION_KIND` (app/models.py).
    expect(ROLES_BY_KIND).toEqual({
      clinic: ["clinic_staff", "radiologist"],
      radiology_group: ["radiologist", "platform_admin"],
    });
  });

  it("accepte le radiologue employé par une clinique", () => {
    expect(roleFitsOrganization("radiologist", "clinic")).toBe(true);
  });

  it("refuse l'équipe IMAFRIK dans une clinique, le personnel dans un groupe", () => {
    expect(roleFitsOrganization("platform_admin", "clinic")).toBe(false);
    expect(roleFitsOrganization("clinic_staff", "radiology_group")).toBe(false);
  });

  it("propose d'abord le rôle le plus courant", () => {
    expect(ROLES_BY_KIND.clinic[0]).toBe("clinic_staff");
    expect(ROLES_BY_KIND.radiology_group[0]).toBe("radiologist");
  });
});
