import { describe, expect, it } from "vitest";

import { messagesFor } from "@/i18n";
import { blockedReason, remediesFor } from "@/lib/assignment-blocker";

const keys = (remedies: { key: string }[]) => remedies.map((r) => r.key);

describe("quoi faire quand personne ne peut recevoir un examen", () => {
  it("mène l’équipe au geste qui lève chaque cause", () => {
    expect(remediesFor("team", "clinic_inactive", "org-esp")).toEqual([
      { key: "reactivate", href: "/admin/organisations/org-esp" },
    ]);
    expect(remediesFor("team", "no_reader", "org-esp")).toEqual([
      { key: "openToPool", href: "/admin/organisations/org-esp" },
      { key: "attachRadiologist", href: "/admin/utilisateurs" },
    ]);
    // Habiliter un radiologue : les justificatifs à valider.
    expect(remediesFor("team", "not_credentialed", "org-esp")[0]).toEqual({
      key: "validateCredentials",
      href: "/admin/utilisateurs?validation=attente",
    });
    expect(keys(remediesFor("team", "modality_not_read", "org-esp"))).toEqual([
      "setModalities",
      "openToPool",
    ]);
  });

  it("sans raison connue, propose les vérifications les plus courantes", () => {
    expect(keys(remediesFor("team", null, "org-esp"))).toEqual([
      "setModalities",
      "openToPool",
    ]);
  });

  it("encode la clinique dans l’adresse, et se passe d’elle si inconnue", () => {
    expect(remediesFor("team", "clinic_inactive", "a/b")[0].href).toBe(
      "/admin/organisations/a%2Fb",
    );
    expect(remediesFor("team", "clinic_inactive", null)[0].href).toBe(
      "/admin/organisations",
    );
  });

  it("donne au responsable les vérifications à sa portée", () => {
    expect(remediesFor("clinic", "no_reader", "org-stj")).toEqual([
      { key: "checkTeam", href: "/equipe" },
      { key: "askTeam", href: null },
    ]);
  });
});

describe("pourquoi personne ne peut recevoir un examen", () => {
  const fr = messagesFor("fr").assignment;
  const en = messagesFor("en").assignment;

  it("nomme la modalité qui manque, dans la langue de l’utilisateur", () => {
    expect(blockedReason(fr, "modality_not_read", "MG")).toBe(
      "Aucun radiologue habilité ne lit « Mammographie » pour cette clinique.",
    );
    expect(blockedReason(en, "modality_not_read", "CT")).toBe(
      "No credentialed radiologist reads “CT” for this clinic.",
    );
    expect(blockedReason(fr, "modality_not_read", null)).toBe(
      fr.blocked.reasons.modality_not_read,
    );
  });

  it("dit chaque autre cause, et une phrase prudente sans raison", () => {
    expect(blockedReason(fr, "not_credentialed", "CR")).toMatch(
      /pas encore habilités/,
    );
    expect(blockedReason(fr, "no_reader", "CR")).toMatch(/Aucun radiologue/);
    expect(blockedReason(fr, null, "CR")).toBe(fr.blocked.unknown);
  });
});
