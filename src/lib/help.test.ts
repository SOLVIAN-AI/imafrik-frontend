import { describe, expect, it } from "vitest";

import { en } from "@/i18n/messages/en";
import { fr } from "@/i18n/messages/fr";
import {
  type HelpGuide,
  type HelpPage,
  guidesOf,
  helpRoleOf,
  helpScreenFor,
  helpScreensOf,
  hrefOf,
  normalize,
  searchHelp,
} from "@/lib/help";
import { clinicViewPath } from "@/lib/clinic-view";
import { type NavGroup, navigationFor } from "@/lib/navigation";
import type { UserRole } from "@/lib/session/types";

const ROLES: UserRole[] = ["radiologist", "clinic_staff", "platform_admin"];

/** Sous-pages de chaque rôle : elles ont leur aide, distincte de la liste. */
const SUBPAGES: Record<UserRole, string[]> = {
  radiologist: [
    "/lecture/abc",
    "/formation/scanner-thorax",
    "/comptes-rendus/r1",
  ],
  clinic_staff: ["/examens/e1", "/comptes-rendus/r1", "/equipe/regles"],
  platform_admin: [
    "/admin/organisations/org-1",
    "/admin/passerelles/gw-1",
    "/lecture/abc",
    "/formation/scanner-thorax",
    "/comptes-rendus/r1",
    "/admin/vue-clinique",
    "/admin/vue-clinique/org-1/examens/e1",
    "/admin/vue-clinique/org-1/comptes-rendus/r1",
    "/admin/vue-clinique/org-1/equipe/regles",
    "/admin/vue-clinique/org-1/examens/depots/d1",
  ],
};

/** Adresse d'une entrée de navigation, telle que la barre latérale la suit. */
function hrefOfItem(group: NavGroup, href: string): string {
  return group.clinicScoped ? clinicViewPath("org-1", href) : href;
}

function pagesOf(messages: typeof fr, role: UserRole) {
  return messages.help.pages[helpRoleOf(role)] as Record<string, HelpPage>;
}

describe("chaque écran a son aide", () => {
  for (const role of ROLES) {
    it(`reconnaît chaque entrée de la navigation et chaque sous-page (${role})`, () => {
      const hrefs = navigationFor(role).flatMap((group) =>
        group.items.map((item) => hrefOfItem(group, item.href)),
      );
      for (const href of [...hrefs, ...SUBPAGES[role]]) {
        expect(helpScreenFor(role, href), href).not.toBeNull();
      }
    });

    for (const [langue, messages] of [
      ["fr", fr],
      ["en", en],
    ] as const) {
      it(`écrit l’aide de chaque écran, en ${langue} (${role})`, () => {
        const pages = pagesOf(messages, role);
        for (const screen of helpScreensOf(role)) {
          const page = pages[screen.key];
          expect(page, `${role} · ${screen.key}`).toBeDefined();
          expect(page.title.trim()).not.toBe("");
          expect(page.purpose.length).toBeGreaterThan(20);
          expect(page.purpose.length).toBeLessThanOrEqual(320);
          expect(page.steps.length).toBeGreaterThanOrEqual(3);
          expect(page.steps.length).toBeLessThanOrEqual(5);
          for (const step of page.steps)
            expect(step.length).toBeLessThanOrEqual(180);
          expect(page.terms.length).toBeGreaterThanOrEqual(2);
          expect(page.terms.length).toBeLessThanOrEqual(5);
          for (const term of page.terms) {
            expect(
              messages.help.glossary,
              `${screen.key} → ${term}`,
            ).toHaveProperty(term);
          }
        }
      });
    }

    it(`n’a pas de page d’aide orpheline (${role})`, () => {
      const known = new Set(helpScreensOf(role).map((screen) => screen.key));
      expect(
        Object.keys(pagesOf(fr, role)).filter((key) => !known.has(key)),
      ).toEqual([]);
    });
  }

  it("cite les mêmes termes dans les deux langues", () => {
    for (const role of ROLES) {
      const frPages = pagesOf(fr, role);
      const enPages = pagesOf(en, role);
      for (const key of Object.keys(frPages)) {
        expect(enPages[key].terms, key).toEqual(frPages[key].terms);
      }
    }
  });

  it("n’emploie aucun tiret cadratin", () => {
    expect(JSON.stringify(fr.help)).not.toContain("—");
    expect(JSON.stringify(en.help)).not.toContain("—");
  });
});

describe("écrans reconnus", () => {
  it("distingue le cockpit de ses sous-pages", () => {
    expect(helpScreenFor("platform_admin", "/admin")?.key).toBe("cockpit");
    expect(helpScreenFor("platform_admin", "/admin/flux")?.key).toBe("flow");
  });

  it("distingue une liste de sa fiche", () => {
    expect(helpScreenFor("clinic_staff", "/examens")?.key).toBe("studies");
    expect(helpScreenFor("clinic_staff", "/examens/e1")?.key).toBe("study");
    expect(helpScreenFor("platform_admin", "/admin/passerelles")?.key).toBe(
      "gateways",
    );
    expect(helpScreenFor("platform_admin", "/admin/passerelles/gw")?.key).toBe(
      "gateway",
    );
  });

  it("lit la même adresse selon le rôle", () => {
    expect(helpScreenFor("radiologist", "/worklist")?.role).toBe("radiologist");
    expect(helpScreenFor("platform_admin", "/worklist")?.role).toBe("admin");
  });

  it("annonce la navigation au clavier là où elle existe", () => {
    expect(helpScreenFor("radiologist", "/worklist")?.shortcuts).toEqual([
      "table",
    ]);
    expect(helpScreenFor("radiologist", "/modeles")?.shortcuts).toEqual([]);
  });

  it("ne reconnaît pas un écran inconnu", () => {
    expect(helpScreenFor("clinic_staff", "/inconnu")).toBeNull();
  });

  it("mène depuis la recherche à l’adresse sans paramètre", () => {
    expect(hrefOf("clinic_staff", "studies")).toBe("/examens");
    expect(hrefOf("clinic_staff", "study")).toBeNull();
  });

  it("lit les écrans de la vue des cliniques, quelle que soit la clinique", () => {
    const screen = (path: string) => helpScreenFor("platform_admin", path)?.key;
    expect(screen("/admin/vue-clinique")).toBe("clinicViews");
    expect(screen("/admin/vue-clinique/org-1/tableau-de-bord")).toBe(
      "clinicDashboard",
    );
    expect(screen("/admin/vue-clinique/org-2/examens")).toBe("clinicStudies");
    expect(screen("/admin/vue-clinique/org-2/examens/e1")).toBe("clinicStudy");
    // Les dépôts sont sous les examens, avec leur propre aide.
    expect(screen("/admin/vue-clinique/org-2/examens/depots")).toBe(
      "clinicDeposits",
    );
    expect(screen("/admin/vue-clinique/org-2/examens/depots/d1")).toBe(
      "clinicDepositReport",
    );
    expect(screen("/admin/vue-clinique/org-2/equipe")).toBe("clinicTeam");
    expect(screen("/admin/vue-clinique/org-2/equipe/regles")).toBe(
      "clinicTeamRules",
    );
    // Une adresse sans clinique n'est pas un écran de la vue.
    expect(screen("/admin/vue-clinique//examens")).toBeUndefined();
    // Le responsable, lui, n'a pas ces écrans.
    expect(
      helpScreenFor("clinic_staff", "/admin/vue-clinique/org-1/examens"),
    ).toBeNull();
  });

  it("mène depuis la recherche à l’écran de la clinique consultée", () => {
    expect(hrefOf("platform_admin", "clinicViews")).toBe("/admin/vue-clinique");
    expect(hrefOf("platform_admin", "clinicTeam")).toBeNull();
    expect(
      hrefOf(
        "platform_admin",
        "clinicTeam",
        "/admin/vue-clinique/org-1/examens",
      ),
    ).toBe("/admin/vue-clinique/org-1/equipe");
    expect(
      hrefOf("platform_admin", "clinicStudy", "/admin/vue-clinique/org-1"),
    ).toBeNull();
  });
});

describe("recherche dans l’aide", () => {
  const pages: Record<string, HelpPage> = {
    worklist: {
      title: "À lire",
      purpose: "Les examens classés par échéance.",
      steps: ["Prenez en charge un examen."],
      terms: [],
    },
  };
  const glossary = {
    urgence: { term: "Urgence", definition: "Examen signalé urgent." },
    pool: { term: "Pool", definition: "Examens qui attendent un lecteur." },
  };

  it("ignore les accents et la casse", () => {
    expect(normalize("Échéance")).toBe("echeance");
    expect(searchHelp("echeance", pages, glossary).map((r) => r.key)).toEqual([
      "worklist",
    ]);
  });

  it("exige tous les mots saisis", () => {
    expect(
      searchHelp("examens lecteur", pages, glossary).map((r) => r.key),
    ).toEqual(["pool"]);
  });

  it("place un titre qui correspond avant un texte qui correspond", () => {
    const keys = searchHelp("urgent", pages, glossary).map((r) => r.key);
    expect(keys[0]).toBe("urgence");
  });

  it("ne cherche rien en dessous de deux lettres", () => {
    expect(searchHelp("a", pages, glossary)).toEqual([]);
  });
});

describe("guides pas à pas", () => {
  const guidesFr = fr.help.guides as Record<string, HelpGuide>;
  const guidesEn = en.help.guides as Record<string, HelpGuide>;

  it("existe pour chaque guide cité par un écran, dans les deux langues", () => {
    for (const role of ROLES) {
      for (const page of Object.values(pagesOf(fr, role))) {
        for (const key of page.guides ?? []) {
          expect(guidesFr, key).toHaveProperty(key);
          expect(guidesEn, key).toHaveProperty(key);
        }
      }
    }
  });

  it("a les mêmes sections et le même nombre d’étapes en fr et en en", () => {
    for (const [key, guide] of Object.entries(guidesFr)) {
      expect(
        guidesEn[key].sections.map((section) => section.steps.length),
        key,
      ).toEqual(guide.sections.map((section) => section.steps.length));
    }
  });

  it("garde des étapes courtes, en sections de huit au plus", () => {
    for (const guides of [guidesFr, guidesEn]) {
      for (const guide of Object.values(guides)) {
        expect(guide.intro.length).toBeLessThanOrEqual(320);
        for (const section of guide.sections) {
          expect(section.steps.length).toBeGreaterThanOrEqual(1);
          expect(section.steps.length).toBeLessThanOrEqual(8);
          for (const step of section.steps)
            expect(step.length).toBeLessThanOrEqual(230);
        }
      }
    }
  });

  it("n’apparaît qu’aux rôles qui ont un écran qui y mène", () => {
    expect(
      Object.keys(guidesOf(pagesOf(fr, "platform_admin"), guidesFr)),
    ).toContain("onboardClinic");
    expect(
      Object.keys(guidesOf(pagesOf(fr, "clinic_staff"), guidesFr)),
    ).toEqual([]);
  });

  it("se trouve par la recherche", () => {
    const admin = pagesOf(fr, "platform_admin");
    const results = searchHelp(
      "certutil",
      admin,
      fr.help.glossary,
      guidesOf(admin, guidesFr),
    );
    expect(results.map((result) => `${result.kind}:${result.key}`)).toContain(
      "guide:onboardClinic",
    );
  });
});
