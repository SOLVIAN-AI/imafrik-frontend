import { describe, expect, it } from "vitest";

import {
  CLINIC_VIEW_ROOT,
  clinicHref,
  clinicIdOf,
  clinicScreenOf,
  clinicViewPath,
} from "@/lib/clinic-view";
import { isRouteAllowed } from "@/lib/navigation";

describe("adresses de la vue des cliniques", () => {
  it("place les écrans du responsable sous la clinique consultée", () => {
    expect(clinicViewPath("org-stj")).toBe(
      "/admin/vue-clinique/org-stj/tableau-de-bord",
    );
    expect(clinicViewPath("org-stj", "/examens")).toBe(
      "/admin/vue-clinique/org-stj/examens",
    );
    expect(clinicHref({ clinicId: "org-stj" }, "/examens/e1")).toBe(
      "/admin/vue-clinique/org-stj/examens/e1",
    );
    // Le responsable garde ses adresses.
    expect(clinicHref(null, "/examens/e1")).toBe("/examens/e1");
  });

  it("n’écrit dans l’adresse qu’un identifiant, encodé", () => {
    expect(clinicViewPath("a/b c")).toBe(
      "/admin/vue-clinique/a%2Fb%20c/tableau-de-bord",
    );
    expect(clinicIdOf(clinicViewPath("a/b c", "/equipe"))).toBe("a/b c");
  });

  it("relit la clinique d’une adresse de la vue, et seulement d’elle", () => {
    expect(clinicIdOf("/admin/vue-clinique/org-stj/examens/e1")).toBe(
      "org-stj",
    );
    expect(clinicIdOf("/admin/vue-clinique/org-stj")).toBe("org-stj");
    expect(clinicIdOf(CLINIC_VIEW_ROOT)).toBeNull();
    expect(clinicIdOf("/admin/vue-clinique/")).toBeNull();
    expect(clinicIdOf("/admin/organisations/org-stj")).toBeNull();
    expect(clinicIdOf("/examens/e1")).toBeNull();
    expect(clinicIdOf("/admin/vue-clinique/%E0%A4%A")).toBeNull();
  });

  it("garde l’écran en changeant de clinique, sauf une fiche propre à la première", () => {
    expect(clinicScreenOf("/admin/vue-clinique/a/equipe/regles")).toBe(
      "/equipe/regles",
    );
    expect(clinicScreenOf("/admin/vue-clinique/a/examens")).toBe("/examens");
    expect(clinicScreenOf("/admin/vue-clinique/a/examens/e1")).toBe("/examens");
    expect(clinicScreenOf("/admin/vue-clinique/a/comptes-rendus/r1")).toBe(
      "/comptes-rendus",
    );
    expect(clinicScreenOf("/admin/vue-clinique/a")).toBe("/tableau-de-bord");
    expect(clinicScreenOf("/admin")).toBe("/tableau-de-bord");
  });

  it("est réservée à l’équipe IMAFRIK", () => {
    const path = clinicViewPath("org-stj", "/examens");
    expect(isRouteAllowed("platform_admin", path)).toBe(true);
    expect(isRouteAllowed("clinic_staff", path)).toBe(false);
    expect(isRouteAllowed("radiologist", path)).toBe(false);
  });
});
