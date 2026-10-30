import { describe, expect, it } from "vitest";

import { clinicViewPath } from "@/lib/clinic-view";
import { publicSitePaths } from "@/lib/i18n/routes";
import {
  activeHref,
  homeFor,
  isActive,
  isPublicRoute,
  isRouteAllowed,
  navigationBlocks,
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

  it("ouvre chaque page du site public, dans chaque langue", () => {
    // Une page ajoutée au site l'est aussi ici : `/apercu/parcours` menait
    // à la connexion quand la liste était tenue en double.
    const pages = publicSitePaths();
    expect(pages).toContain("/apercu/parcours");
    for (const path of pages) {
      expect(isPublicRoute(path), path).toBe(true);
    }
  });

  it("protège tout le reste, y compris les préfixes trompeurs", () => {
    for (const path of [
      "/worklist",
      "/lecture/1",
      "/admin",
      "/contactez",
      "/verifierx",
      "/apercu",
      "/apercu/parcoursx",
      // L'accueil d'un invité exige la session ouverte par son lien.
      "/invitation",
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

  it("réserve l'activité et la facturation de la clinique à ses responsables", () => {
    expect(isRouteAllowed("clinic_staff", "/activite")).toBe(true);
    expect(isRouteAllowed("radiologist", "/activite")).toBe(false);
    expect(isRouteAllowed("platform_admin", "/activite")).toBe(false);
  });

  it("ouvre la consultation des images à l'administration", () => {
    expect(isRouteAllowed("platform_admin", "/lecture/1")).toBe(true);
  });

  it("ouvre l'espace de formation aux radiologues et à l'équipe, pas aux cliniques", () => {
    for (const path of ["/formation", "/formation/scanner-thorax"]) {
      expect(isRouteAllowed("radiologist", path)).toBe(true);
      expect(isRouteAllowed("platform_admin", path)).toBe(true);
      expect(isRouteAllowed("clinic_staff", path)).toBe(false);
    }
    expect(isRouteAllowed("radiologist", "/formation/x/pdf")).toBe(true);
  });

  it("ouvre les portails des radiologues à l'administration, en consultation", () => {
    for (const path of ["/worklist", "/comptes-rendus/r-1", "/modeles"]) {
      expect(isRouteAllowed("platform_admin", path)).toBe(true);
    }
    // Ce qui n'est qu'à soi ou qu'à la clinique reste fermé.
    for (const path of ["/mes-examens", "/envoyer", "/equipe"]) {
      expect(isRouteAllowed("platform_admin", path)).toBe(false);
    }
  });

  it("partage la mise en service, les engagements, l'accueil et le mot de passe entre les rôles", () => {
    for (const role of [
      "radiologist",
      "clinic_staff",
      "platform_admin",
    ] as const) {
      expect(isRouteAllowed(role, "/bienvenue/profil")).toBe(true);
      expect(isRouteAllowed(role, "/engagements")).toBe(true);
      expect(isRouteAllowed(role, "/engagements/contrat-radiologue/pdf")).toBe(
        true,
      );
      expect(isRouteAllowed(role, "/nouveau-mot-de-passe")).toBe(true);
      expect(isRouteAllowed(role, "/invitation")).toBe(true);
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
      "/admin/vue-clinique",
      "/admin/vue-clinique/org-1/examens/e1",
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

  it.each(["platform_admin", "clinic_staff", "radiologist"] as const)(
    "allume une seule entrée, la sienne, sur chaque adresse (%s)",
    (role) => {
      // Les entrées de la vue des cliniques mènent sous la clinique
      // consultée, comme la barre latérale les résout.
      const items = navigationFor(role).flatMap((group) =>
        group.clinicScoped
          ? group.items.map((item) => ({
              ...item,
              href: clinicViewPath("org-1", item.href),
            }))
          : group.items,
      );
      for (const item of items) {
        expect(activeHref(items, item.href)).toBe(item.href);
        // Une fiche sous l'écran : c'est encore lui.
        expect(activeHref(items, `${item.href}/x`)).toBe(
          item.exact ? null : item.href,
        );
      }
    },
  );

  it("préfère l’entrée la plus précise : le planning à l’équipe, les dépôts aux examens", () => {
    const items = navigationFor("clinic_staff").flatMap((group) => group.items);
    expect(activeHref(items, "/equipe")).toBe("/equipe");
    expect(activeHref(items, "/equipe/regles")).toBe("/equipe/regles");
    expect(activeHref(items, "/examens/e1")).toBe("/examens");
    expect(activeHref(items, "/examens/depots")).toBe("/examens/depots");
    expect(activeHref(items, "/examens/depots/d1")).toBe("/examens/depots");
    expect(activeHref(items, "/admin")).toBeNull();
  });
});

describe("navigation du responsable", () => {
  const groups = navigationFor("clinic_staff");
  const hrefs = (key?: string) =>
    groups
      .filter((group) => group.key === key)
      .flatMap((group) => group.items.map((item) => item.href));

  it("met le dépôt d’images en tête, avec l’envoi d’un examen", () => {
    expect(hrefs(undefined)).toEqual([
      "/tableau-de-bord",
      "/envoyer",
      "/examens/depots",
    ]);
    const depot = groups[0].items[2];
    expect(depot.key).toBe("depositImages");
    // La même icône que les dépôts de la console.
    expect(depot.icon).toBe("deposits");
  });

  it("met le planning dans l’établissement, juste après l’équipe", () => {
    expect(hrefs("facility").slice(0, 2)).toEqual([
      "/equipe",
      "/equipe/regles",
    ]);
    const planning = groups
      .flatMap((group) => group.items)
      .find((item) => item.href === "/equipe/regles");
    // Ses conflits de la semaine, en ambre, nommés pour les lecteurs d'écran.
    expect(planning).toMatchObject({
      key: "planning",
      icon: "planning",
      count: "planConflicts",
      tone: "warning",
      countLabel: "planConflicts",
    });
  });

  it("ne donne ni planning ni dépôt au radiologue de la clinique", () => {
    const radiologue = navigationFor("radiologist").flatMap((group) =>
      group.items.map((item) => item.href),
    );
    expect(radiologue).not.toContain("/equipe/regles");
    expect(radiologue).not.toContain("/examens/depots");
    expect(isRouteAllowed("radiologist", "/equipe/regles")).toBe(false);
  });
});

describe("blocs de la barre latérale", () => {
  it("garde tous les outils de l’équipe dans un seul bloc, sans rien entre eux", () => {
    const blocks = navigationBlocks(navigationFor("platform_admin"));
    expect(blocks.map((block) => block.key)).toEqual([
      "administration",
      "clinicView",
      "radiologistView",
      "account",
    ]);
    const administration = blocks[0].sections.flat().map((item) => item.href);
    expect(administration.every((href) => href.startsWith("/admin"))).toBe(
      true,
    );
    const ailleurs = blocks
      .slice(1)
      .flatMap((block) => block.sections.flat())
      .map((item) => item.href);
    expect(ailleurs.some((href) => href.startsWith("/admin"))).toBe(false);
  });

  it("découpe l’administration en trois paquets : pilotage, réseau, plateforme", () => {
    const [administration] = navigationBlocks(navigationFor("platform_admin"));
    expect(administration.collapsible).toBe(false);
    expect(administration.sections.map((items) => items[0].href)).toEqual([
      "/admin",
      "/admin/organisations",
      "/admin/facturation",
    ]);
  });

  it("replie les lectures, en consultation", () => {
    const vue = navigationBlocks(navigationFor("platform_admin")).find(
      (block) => block.key === "radiologistView",
    );
    expect(vue?.collapsible).toBe(true);
    expect(vue?.sections.flat().map((item) => item.href)).toEqual([
      "/worklist",
      "/comptes-rendus",
      "/modeles",
      "/formation",
    ]);
  });

  it("replie la vue des cliniques, sur les écrans du responsable sans ses gestes", () => {
    const vue = navigationBlocks(navigationFor("platform_admin")).find(
      (block) => block.key === "clinicView",
    );
    expect(vue?.collapsible).toBe(true);
    expect(vue?.clinicScoped).toBe(true);
    const ecrans = vue?.sections.flat().map((item) => item.href) ?? [];
    expect(ecrans).toEqual([
      "/tableau-de-bord",
      "/examens/depots",
      "/examens",
      "/comptes-rendus",
      "/equipe",
      "/equipe/regles",
      "/activite",
    ]);
    // Sans compteur : ceux de la navigation sont ceux de l'équipe.
    expect(vue?.sections.flat().some((item) => item.count)).toBe(false);
    // Ce sont des écrans du responsable : il les a tous dans sa navigation.
    const responsable = navigationFor("clinic_staff")
      .flatMap((group) => group.items)
      .map((item) => item.href);
    expect(ecrans.every((href) => responsable.includes(href))).toBe(true);
    expect(ecrans).not.toContain("/envoyer");
    expect(ecrans).not.toContain("/parametres");
    // Seule la vue des cliniques porte le choix d'une clinique.
    const autres = navigationBlocks(navigationFor("platform_admin")).filter(
      (block) => block.key !== "clinicView",
    );
    expect(autres.some((block) => block.clinicScoped)).toBe(false);
  });

  it("ne change rien aux portails sans suite ni repli", () => {
    for (const role of ["radiologist", "clinic_staff"] as const) {
      const groups = navigationFor(role);
      const blocks = navigationBlocks(groups);
      expect(blocks).toHaveLength(groups.length);
      expect(blocks.every((block) => !block.collapsible)).toBe(true);
      expect(blocks.every((block) => block.sections.length === 1)).toBe(true);
    }
  });

  it("rattache une suite au bloc précédent, et ouvre un bloc sinon", () => {
    const item = (href: string) =>
      ({ href, key: "cockpit", icon: "cockpit" }) as const;
    expect(
      navigationBlocks([
        { items: [item("/a")] },
        { continues: true, items: [item("/b")] },
        { key: "account", items: [item("/c")] },
      ]).map((block) =>
        block.sections.map((items) => items.map((i) => i.href)),
      ),
    ).toEqual([[["/a"], ["/b"]], [["/c"]]]);
  });
});
