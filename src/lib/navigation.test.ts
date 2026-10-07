import { describe, expect, it } from "vitest";

import {
  homeFor,
  isActive,
  isPublicRoute,
  isRouteAllowed,
  navigationFor,
} from "@/lib/navigation";

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

describe("tour de contrôle", () => {
  it("ouvre le cockpit à l'administration, et à elle seule", () => {
    expect(homeFor("platform_admin")).toBe("/admin");
    for (const path of [
      "/admin/activite",
      "/admin/flux",
      "/admin/organisations/abc",
      "/admin/utilisateurs",
      "/admin/facturation",
      "/admin/systeme",
      "/admin/audit",
      "/admin/reglages",
    ]) {
      expect(isRouteAllowed("platform_admin", path)).toBe(true);
      expect(isRouteAllowed("radiologist", path)).toBe(false);
      expect(isRouteAllowed("clinic_staff", path)).toBe(false);
    }
  });

  it("n'allume le cockpit que sur sa propre adresse", () => {
    const cockpit = {
      href: "/admin",
      key: "cockpit",
      icon: "cockpit",
      exact: true,
    } as const;
    expect(isActive(cockpit, "/admin")).toBe(true);
    expect(isActive(cockpit, "/admin/flux")).toBe(false);
    const flux = { href: "/admin/flux", key: "flow", icon: "flow" } as const;
    expect(isActive(flux, "/admin/flux")).toBe(true);
    expect(isActive(flux, "/admin/fluxx")).toBe(false);
  });

  it("n'a qu'une entrée active par adresse du portail", () => {
    const items = navigationFor("platform_admin").flatMap(
      (group) => group.items,
    );
    for (const item of items) {
      const active = items.filter((candidate) =>
        isActive(candidate, item.href),
      );
      expect(active.map((entry) => entry.href)).toEqual([item.href]);
    }
  });
});
