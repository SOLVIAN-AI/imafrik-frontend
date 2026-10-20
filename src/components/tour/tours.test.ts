import { describe, expect, it } from "vitest";

import { mainTourFor, tourFor, TOUR_IDS, TOURS } from "@/components/tour/tours";
import { messagesFor } from "@/i18n";
import { homeFor } from "@/lib/navigation";
import type { UserRole } from "@/lib/session/types";

const ROLES: UserRole[] = ["radiologist", "clinic_staff", "platform_admin"];

/** Forme d'identifiant qu'accepte `mark_tour_completed`, et sa longueur maximale. */
const DB_TOUR_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe("visites guidées", () => {
  it("ont des identifiants uniques, acceptés par la base", () => {
    expect(new Set(TOUR_IDS).size).toBe(TOUR_IDS.length);
    for (const id of TOUR_IDS) {
      expect(id).toMatch(DB_TOUR_ID);
      expect(id.length).toBeLessThanOrEqual(40);
    }
  });

  it("ont des étapes uniques dans chaque visite", () => {
    for (const tour of TOURS) {
      const ids = tour.steps.map((step) => step.id);
      expect(new Set(ids).size, tour.id).toBe(ids.length);
    }
  });

  it.each(["fr", "en"] as const)(
    "ont leurs textes en %s, ni plus ni moins que leurs étapes",
    (locale) => {
      const texts = messagesFor(locale).tour.tours as Record<
        string,
        Record<string, { title: string; body: string }>
      >;
      expect(Object.keys(texts).sort()).toEqual([...TOUR_IDS].sort());
      for (const tour of TOURS) {
        expect(Object.keys(texts[tour.id]).sort(), tour.id).toEqual(
          tour.steps.map((step) => step.id).sort(),
        );
        for (const step of tour.steps) {
          const text = texts[tour.id][step.id];
          expect(text.title.trim(), `${tour.id}.${step.id}`).not.toBe("");
          expect(text.body.trim(), `${tour.id}.${step.id}`).not.toBe("");
          // Aucun tiret cadratin dans les textes : règle de rédaction.
          expect(text.body, `${tour.id}.${step.id}`).not.toContain("—");
        }
      }
    },
  );

  it.each(ROLES)(
    "donnent au rôle %s une visite de son écran d'accueil",
    (role) => {
      const tour = mainTourFor(role);
      expect(tour).not.toBeNull();
      expect(tour?.roles).toContain(role);
      expect(tour?.matches(homeFor(role))).toBe(true);
      expect(tourFor(homeFor(role), role)?.id).toBe(tour?.id);
    },
  );

  it("rattachent la visite de lecture aux examens et aux exercices", () => {
    expect(tourFor("/lecture/abc", "radiologist")?.id).toBe("lecture");
    expect(tourFor("/formation/radio-thorax", "radiologist")?.id).toBe(
      "lecture",
    );
    // Le PDF spécimen et la liste des exercices n'ont pas d'écran de lecture.
    expect(tourFor("/formation/radio-thorax/pdf", "radiologist")).toBeNull();
    expect(tourFor("/formation", "radiologist")).toBeNull();
  });

  it("ne montrent pas à un rôle la visite d'un autre", () => {
    // L'équipe IMAFRIK ouvre la file et les exercices pour les vérifier :
    // ce n'est pas son écran de travail.
    expect(tourFor("/worklist", "platform_admin")).toBeNull();
    expect(tourFor("/formation/radio-thorax", "platform_admin")).toBeNull();
    expect(tourFor("/lecture/abc", "clinic_staff")).toBeNull();
    expect(tourFor("/admin", "radiologist")).toBeNull();
  });

  it("ne confondent pas un écran avec ses sous-écrans", () => {
    expect(tourFor("/admin/utilisateurs", "platform_admin")).toBeNull();
    expect(tourFor("/worklist/autre", "radiologist")).toBeNull();
    expect(tourFor("/lectures", "radiologist")).toBeNull();
  });
});
