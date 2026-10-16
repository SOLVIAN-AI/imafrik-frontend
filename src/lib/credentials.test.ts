import { describe, expect, it } from "vitest";

import {
  credentialBlock,
  credentialNeedsAction,
  daysUntil,
  identityChangeResetsValidation,
  licenseChangeResetsValidation,
} from "@/lib/credentials";
import { demoSession } from "@/lib/session/demo";
import type { Session } from "@/lib/session/types";

/** Session de radiologue, au profil ajusté. */
function radiologist(user: Partial<Session["user"]>): Session {
  const session = demoSession("m-radio");
  return { ...session, user: { ...session.user, ...user } };
}

describe("habilitation du radiologue", () => {
  it("ne bloque qu’un radiologue non habilité", () => {
    expect(credentialBlock(radiologist({}))).toBeNull();
    expect(credentialBlock(radiologist({ credentialState: "pending" }))).toBe(
      "pending",
    );
    expect(credentialBlock(radiologist({ credentialState: "expired" }))).toBe(
      "expired",
    );
    // L'habilitation ne concerne que les radiologues.
    expect(credentialBlock(demoSession("m-clinic"))).toBeNull();
    expect(credentialBlock(demoSession("m-admin"))).toBeNull();
  });

  it("dit quand le radiologue a quelque chose à faire", () => {
    expect(credentialNeedsAction("undeclared")).toBe(true);
    expect(credentialNeedsAction("license_missing")).toBe(true);
    expect(credentialNeedsAction("documents_missing")).toBe(true);
    expect(credentialNeedsAction("expired")).toBe(true);
    expect(credentialNeedsAction("pending")).toBe(false);
    expect(credentialNeedsAction("verified")).toBe(false);
  });

  it("compte les jours avant la fin d’une attestation", () => {
    expect(daysUntil("2026-11-14", "2026-10-15")).toBe(30);
    expect(daysUntil("2026-10-15", "2026-10-15")).toBe(0);
    expect(daysUntil("2026-10-14", "2026-10-15")).toBe(-1);
    expect(daysUntil(null, "2026-10-15")).toBeNull();
  });

  it("annonce la nouvelle vérification quand un numéro en remplace un autre", () => {
    expect(licenseChangeResetsValidation("TG-1", "TG-2")).toBe(true);
    expect(licenseChangeResetsValidation("TG-1", "")).toBe(true);
    expect(licenseChangeResetsValidation("TG-1", " TG-1 ")).toBe(false);
    // Premier numéro : rien de validé à perdre.
    expect(licenseChangeResetsValidation("", "TG-1")).toBe(false);
    expect(licenseChangeResetsValidation("  ", "TG-1")).toBe(false);
  });
});

describe("identité du signataire", () => {
  const signer = {
    fullName: "Kodjo Mensah",
    title: "Dr",
    licenseNumber: "TG-002",
  };

  it("un nouveau nom ou un nouveau titre annule la validation", () => {
    expect(
      identityChangeResetsValidation(signer, {
        ...signer,
        fullName: "Autre Nom",
      }),
    ).toBe(true);
    expect(
      identityChangeResetsValidation(signer, { ...signer, title: "Pr" }),
    ).toBe(true);
  });

  it("vider le titre l’efface, et annule donc la validation", () => {
    expect(
      identityChangeResetsValidation(signer, { ...signer, title: "" }),
    ).toBe(true);
    expect(
      identityChangeResetsValidation(signer, { ...signer, title: "   " }),
    ).toBe(true);
    // Rien à effacer : aucun changement.
    expect(
      identityChangeResetsValidation(
        { ...signer, title: "" },
        { ...signer, title: " " },
      ),
    ).toBe(false);
  });

  it("les espaces de bord ne changent rien", () => {
    expect(
      identityChangeResetsValidation(signer, {
        ...signer,
        fullName: " Kodjo Mensah ",
        title: " Dr ",
      }),
    ).toBe(false);
  });
});
