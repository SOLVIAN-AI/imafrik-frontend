import { describe, expect, it } from "vitest";

import { homeFor, isPublicRoute, isRouteAllowed } from "@/lib/navigation";

describe("isPublicRoute", () => {
  it("ouvre la vitrine, la connexion et la vérification", () => {
    for (const path of [
      "/",
      "/contact",
      "/connexion",
      "/verifier/abc",
      "/robots.txt",
      "/sitemap.xml",
      "/manifest.webmanifest",
    ]) {
      expect(isPublicRoute(path)).toBe(true);
    }
  });

  it("protège tout le reste, y compris les préfixes trompeurs", () => {
    for (const path of [
      "/worklist",
      "/lecture/1",
      "/admin",
      "/contactez",
      "/verifierx",
    ]) {
      expect(isPublicRoute(path)).toBe(false);
    }
  });
});

describe("isRouteAllowed", () => {
  it("cantonne chaque rôle à son portail", () => {
    expect(isRouteAllowed("radiologist", "/worklist")).toBe(true);
    expect(isRouteAllowed("radiologist", "/equipe")).toBe(false);
    expect(isRouteAllowed("clinic_staff", "/worklist")).toBe(false);
    expect(isRouteAllowed("clinic_staff", "/envoyer")).toBe(true);
    expect(isRouteAllowed("platform_admin", "/admin/demandes")).toBe(true);
    expect(isRouteAllowed("clinic_staff", "/admin/organisations")).toBe(false);
  });

  it("partage la mise en service et le mot de passe entre les rôles", () => {
    for (const role of [
      "radiologist",
      "clinic_staff",
      "platform_admin",
    ] as const) {
      expect(isRouteAllowed(role, "/bienvenue/profil")).toBe(true);
      expect(isRouteAllowed(role, "/nouveau-mot-de-passe")).toBe(true);
      expect(isRouteAllowed(role, homeFor(role))).toBe(true);
    }
  });
});
