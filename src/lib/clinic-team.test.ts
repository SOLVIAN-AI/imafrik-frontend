import { describe, expect, it } from "vitest";

import { common as commonEn } from "@/i18n/messages/en/common";
import { gateways as gatewaysEn } from "@/i18n/messages/en/gateways";
import { session as sessionEn } from "@/i18n/messages/en/session";
import { common as commonFr } from "@/i18n/messages/fr/common";
import { gateways as gatewaysFr } from "@/i18n/messages/fr/gateways";
import { session as sessionFr } from "@/i18n/messages/fr/session";
import {
  EMPTY_PERSON,
  MAX_CLINIC_MANAGERS,
  MAX_CLINIC_RADIOLOGISTS,
  duplicateEmail,
  filledPeople,
} from "@/lib/clinic-team";

describe("équipe d’une clinique à créer", () => {
  it("ignore les lignes restées vides, garde les lignes à moitié remplies", () => {
    expect(
      filledPeople([
        EMPTY_PERSON,
        { fullName: "  ", email: " " },
        { fullName: "Awa", email: "" },
        { fullName: "", email: "radio@lac.tg" },
      ]),
    ).toEqual([
      { fullName: "Awa", email: "" },
      { fullName: "", email: "radio@lac.tg" },
    ]);
  });

  it("repère une adresse saisie deux fois, sans tenir compte de la casse", () => {
    expect(
      duplicateEmail([
        { fullName: "Awa", email: "Direction@Lac.tg" },
        { fullName: "Kossi", email: "radio@lac.tg" },
        { fullName: "Encore", email: " direction@lac.TG " },
      ]),
    ).toBe("direction@lac.tg");
    expect(
      duplicateEmail([
        { fullName: "Awa", email: "direction@lac.tg" },
        { fullName: "Sans adresse", email: "" },
        { fullName: "Autre", email: "" },
      ]),
    ).toBeNull();
  });

  it("borne l’équipe comme le service", () => {
    expect(MAX_CLINIC_MANAGERS).toBe(10);
    expect(MAX_CLINIC_RADIOLOGISTS).toBe(30);
  });

  it("accorde les invitations envoyées et celles à reprendre", () => {
    expect(gatewaysFr.createClinic.done("Clinique du Lac", 1)).toBe(
      "Clinique du Lac créée, 1 invitation envoyée. Raccordez maintenant sa passerelle.",
    );
    expect(gatewaysFr.createClinic.done("Clinique du Lac", 3)).toContain(
      "3 invitations envoyées",
    );
    expect(gatewaysEn.createClinic.done("Lake Clinic", 1)).toContain(
      "1 invitation sent",
    );
    expect(gatewaysEn.createClinic.done("Lake Clinic", 2)).toContain(
      "2 invitations sent",
    );
    expect(gatewaysFr.createClinic.partialDescription("X", 1)).toContain(
      "une invitation n’est pas partie",
    );
    expect(gatewaysFr.createClinic.partialDescription("X", 2)).toContain(
      "2 invitations ne sont pas parties",
    );
    expect(gatewaysEn.createClinic.partialDescription("X", 1)).toContain(
      "one invitation was not sent",
    );
  });
});

describe("le rôle clinic_staff", () => {
  it("se dit « Responsable » partout, en français comme en anglais", () => {
    expect(commonFr.roles.clinic_staff).toBe("Responsable");
    expect(commonEn.roles.clinic_staff).toBe("Manager");
    expect(sessionFr.invitation.roleNames.clinic_staff).toBe(
      "Responsable de l’établissement",
    );
    expect(sessionEn.invitation.roleNames.clinic_staff).toBe(
      "Facility manager",
    );
  });
});
