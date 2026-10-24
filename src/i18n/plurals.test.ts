import { describe, expect, it } from "vitest";

import { admin as adminEn } from "@/i18n/messages/en/admin";
import { clinic as clinicEn } from "@/i18n/messages/en/clinic";
import { worklist as worklistEn } from "@/i18n/messages/en/worklist";
import { admin as adminFr } from "@/i18n/messages/fr/admin";
import { worklist as worklistFr } from "@/i18n/messages/fr/worklist";

/**
 * Accords en nombre des textes dont le compte varie.
 *
 * En français, 0 et 1 commandent le singulier ; en anglais, seul 1.
 */
describe("accords en nombre", () => {
  it("décrit la liste de tous les examens au singulier comme au pluriel", () => {
    expect(adminFr.studies.allDescription(1)).toBe(
      "1 examen, toutes organisations confondues",
    );
    expect(adminFr.studies.allDescription(0)).toBe(
      "0 examen, toutes organisations confondues",
    );
    expect(adminFr.studies.allDescription(12)).toBe(
      "12 examens, toutes organisations confondues",
    );
    expect(adminEn.studies.allDescription(1)).toBe(
      "1 examination across all organisations",
    );
    expect(adminEn.studies.allDescription(0)).toBe(
      "0 examinations across all organisations",
    );
    expect(adminEn.studies.allDescription(12)).toBe(
      "12 examinations across all organisations",
    );
  });

  it("accorde le nombre d’établissements de la file", () => {
    expect(worklistFr.scope.count(1)).toBe(
      "File de travail du groupe : 1 établissement",
    );
    expect(worklistFr.supervision.scope.count(3)).toBe(
      "Toute la plateforme, en consultation : 3 établissements",
    );
    expect(worklistEn.supervision.scope.count(1)).toBe(
      "The whole platform, read-only: 1 facility",
    );
    expect(worklistEn.supervision.scope.count(0)).toBe(
      "The whole platform, read-only: 0 facilities",
    );
  });

  it("accorde les totaux de la tour de contrôle", () => {
    expect(adminFr.organisations.totalStudies(1)).toBe("1 examen au total");
    expect(adminFr.organisations.totalStudies(0)).toBe("0 examen au total");
    expect(adminFr.cockpit.signedTodayHint(1, 1)).toBe("1 reçu · 1 remis");
    expect(clinicEn.reports.descriptionAdmin(0)).toBe(
      "0 reports across all clinics, drafts in progress included",
    );
  });
});
