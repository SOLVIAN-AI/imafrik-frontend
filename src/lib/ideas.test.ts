import { describe, expect, it } from "vitest";

import { en } from "@/i18n/messages/en";
import { fr } from "@/i18n/messages/fr";
import { demoIdeaInbox, demoMyIdeas } from "@/lib/demo/ideas";
import { DEMO_USER_ID } from "@/lib/demo/studies";
import { dimension } from "@/lib/filters/dimensions";
import {
  IDEA_BENEFITS,
  IDEA_CATEGORIES,
  IDEA_DEVICES,
  IDEA_STATUSES,
  appVersionOf,
  cleanTitle,
  deviceOf,
  ideaScreenOf,
  ideasHref,
  proposesIdeas,
  screenNameOf,
  validateIdea,
} from "@/lib/ideas";
import { isRouteAllowed, navigationFor } from "@/lib/navigation";

describe("contexte d’une idée", () => {
  it("ne retient qu’une clé d’écran connue de l’aide du rôle", () => {
    expect(ideaScreenOf("radiologist", "worklist")?.key).toBe("worklist");
    expect(ideaScreenOf("clinic_staff", "dashboard")?.key).toBe("dashboard");
    // L’écran d’un autre rôle, « Vos idées » elle-même, une adresse : rien.
    expect(ideaScreenOf("radiologist", "dashboard")).toBeNull();
    expect(ideaScreenOf("radiologist", "ideas")).toBeNull();
    expect(ideaScreenOf("radiologist", "/examens?patient=KOFFI")).toBeNull();
    expect(ideaScreenOf("radiologist", ["worklist"])).toBeNull();
    expect(ideaScreenOf("radiologist", undefined)).toBeNull();
  });

  it("mène à « Vos idées » avec la clé de l’écran, jamais une adresse", () => {
    expect(ideasHref("worklist")).toBe("/idees?ecran=worklist");
    expect(ideasHref(null)).toBe("/idees");
    expect(ideasHref("ideas")).toBe("/idees");
    expect(ideasHref("lecture/12?q=x")).toBe("/idees");
  });

  it("nomme l’écran comme l’aide du rôle, dans chaque langue", () => {
    expect(screenNameOf(fr, "radiologist", "worklist")).toBe("À lire");
    expect(screenNameOf(en, "radiologist", "worklist")).toBe("To read");
    expect(screenNameOf(fr, "clinic_staff", "worklist")).toBeNull();
    expect(screenNameOf(fr, "radiologist", "toString")).toBeNull();
    expect(screenNameOf(fr, "radiologist", null)).toBeNull();
  });

  it("déduit le type d’appareil de la fenêtre et du pointeur", () => {
    expect(deviceOf(390, true)).toBe("phone");
    expect(deviceOf(390, false)).toBe("phone");
    expect(deviceOf(820, true)).toBe("tablet");
    expect(deviceOf(820, false)).toBe("desktop");
    expect(deviceOf(1440, true)).toBe("desktop");
  });

  it("lit la version du déploiement, en sept caractères", () => {
    expect(appVersionOf({ VERCEL_GIT_COMMIT_SHA: "4f2c9a1d0e8b" })).toBe(
      "4f2c9a1",
    );
    expect(
      appVersionOf({ NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: "abcdef0123" }),
    ).toBe("abcdef0");
    expect(appVersionOf({})).toBe("dev");
    expect(appVersionOf({ VERCEL_GIT_COMMIT_SHA: "../x y" })).toBe("dev");
  });
});

describe("validation d’une idée", () => {
  const valid = {
    title: "Fenêtrage au clavier",
    body: "Des touches pour les fenêtres usuelles.",
    category: "reading",
  };

  it("accepte une idée complète", () => {
    expect(validateIdea(valid)).toEqual([]);
  });

  it("borne le titre et la description comme le service", () => {
    expect(validateIdea({ ...valid, title: " a  " })).toEqual([
      { field: "title", problem: "short" },
    ]);
    expect(validateIdea({ ...valid, title: "x".repeat(121) })).toEqual([
      { field: "title", problem: "long" },
    ]);
    expect(validateIdea({ ...valid, body: "court" })).toEqual([
      { field: "body", problem: "short" },
    ]);
    expect(validateIdea({ ...valid, body: "x".repeat(2001) })).toEqual([
      { field: "body", problem: "long" },
    ]);
  });

  it("exige une catégorie connue", () => {
    expect(validateIdea({ ...valid, category: null })).toEqual([
      { field: "category", problem: "missing" },
    ]);
    expect(validateIdea({ ...valid, category: "patients" })).toEqual([
      { field: "category", problem: "missing" },
    ]);
  });

  it("met le titre sur une ligne", () => {
    expect(cleanTitle("  Fenêtrage\n au   clavier ")).toBe(
      "Fenêtrage au clavier",
    );
  });
});

describe("textes de « Vos idées »", () => {
  it("nomment chaque catégorie, chaque état, chaque gain et chaque appareil", () => {
    for (const messages of [fr, en]) {
      for (const category of IDEA_CATEGORIES)
        expect(messages.ideas.categories[category]).toBeTruthy();
      for (const status of IDEA_STATUSES) {
        expect(messages.ideas.status[status]).toBeTruthy();
        expect(messages.ideas.statusPlural[status]).toBeTruthy();
      }
      for (const benefit of IDEA_BENEFITS) {
        expect(messages.ideas.benefits[benefit]).toBeTruthy();
        expect(messages.ideas.benefitTags[benefit]).toBeTruthy();
      }
      for (const device of IDEA_DEVICES)
        expect(messages.ideas.devices[device]).toBeTruthy();
    }
  });

  it("n’emploient aucun tiret cadratin", () => {
    expect(JSON.stringify(fr.ideas)).not.toContain("—");
    expect(JSON.stringify(en.ideas)).not.toContain("—");
  });

  it("accordent les nombres de la boîte", () => {
    expect(fr.ideas.inbox.description(1, 0)).toBe(
      "1 idée proposée, dont 0 reçue à lire",
    );
    expect(fr.ideas.inbox.description(12, 3)).toBe(
      "12 idées proposées, dont 3 reçues à lire",
    );
    expect(en.ideas.inbox.description(1, 1)).toBe(
      "1 idea suggested, 1 received and waiting to be read",
    );
  });
});

describe("filtres des idées", () => {
  it("lisent et écrivent l’état et la catégorie en français", () => {
    const state = dimension("ideaState");
    expect(state.param).toBe("etat");
    expect(state.read("recues")).toBe("received");
    expect(state.read("a-l-etude")).toBe("under_review");
    expect(state.read("received")).toBeNull();
    expect(state.write("declined")).toBe("non-retenues");
    const category = dimension("ideaCategory");
    expect(category.read("facturation")).toBe("billing");
    expect(category.read("billing")).toBeNull();
    expect(category.write("reading")).toBe("lecture");
  });
});

describe("accès à « Vos idées »", () => {
  it("est ouvert aux radiologues et aux responsables, pas à l’équipe", () => {
    expect(proposesIdeas("radiologist")).toBe(true);
    expect(proposesIdeas("clinic_staff")).toBe(true);
    expect(proposesIdeas("platform_admin")).toBe(false);
    expect(isRouteAllowed("radiologist", "/idees")).toBe(true);
    expect(isRouteAllowed("clinic_staff", "/idees")).toBe(true);
    expect(isRouteAllowed("platform_admin", "/idees")).toBe(false);
    expect(isRouteAllowed("platform_admin", "/admin/idees")).toBe(true);
    expect(isRouteAllowed("clinic_staff", "/admin/idees")).toBe(false);
  });

  it("figure dans la navigation de chaque rôle", () => {
    const hrefs = (role: Parameters<typeof navigationFor>[0]) =>
      navigationFor(role).flatMap((group) =>
        group.items.map((item) => item.href),
      );
    expect(hrefs("radiologist")).toContain("/idees");
    expect(hrefs("clinic_staff")).toContain("/idees");
    expect(hrefs("platform_admin")).toContain("/admin/idees");
    expect(hrefs("platform_admin")).not.toContain("/idees");
  });
});

describe("idées de démonstration", () => {
  const now = Date.UTC(2026, 9, 30, 12);

  it("séparent les idées de la radiologue et de la responsable", () => {
    const radio = demoMyIdeas("radiologist", now);
    const clinic = demoMyIdeas("clinic_staff", now);
    expect(radio.length).toBeGreaterThan(0);
    expect(clinic.length).toBeGreaterThan(0);
    expect(radio.every((idea) => idea.authorRole === "radiologist")).toBe(true);
    expect(clinic.every((idea) => idea.authorId === DEMO_USER_ID)).toBe(true);
  });

  it("couvrent chaque état et chaque rôle, avec un regroupement", () => {
    const { items, total } = demoIdeaInbox(now);
    expect(total).toBe(items.length);
    expect(new Set(items.map((idea) => idea.status))).toEqual(
      new Set(IDEA_STATUSES),
    );
    const grouped = items.find((idea) => idea.duplicateOf);
    expect(grouped?.grouped).toBe(true);
    expect(grouped?.duplicateOfTitle).toBeTruthy();
    const main = items.find((idea) => idea.id === grouped?.duplicateOf);
    expect(main?.duplicates).toBe(1);
    expect(grouped?.status).toBe(main?.status);
    // Les plus récentes d’abord.
    const dates = items.map((idea) => idea.createdAt.getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it("ne citent que des écrans connus de l’aide du rôle de l’auteur", () => {
    for (const idea of demoIdeaInbox(now).items) {
      if (idea.screen)
        expect(
          screenNameOf(fr, idea.authorRole, idea.screen),
          idea.id,
        ).not.toBeNull();
    }
  });
});
