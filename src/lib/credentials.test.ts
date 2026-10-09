import { describe, expect, it } from "vitest";

import {
  credentialBlock,
  credentialStatus,
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

describe("validation du numéro d’ordre", () => {
  it("distingue un numéro validé, en attente ou manquant", () => {
    expect(
      credentialStatus({ hasLicenseNumber: true, credentialsVerified: true }),
    ).toBe("verified");
    expect(
      credentialStatus({ hasLicenseNumber: true, credentialsVerified: false }),
    ).toBe("pending");
    expect(
      credentialStatus({ hasLicenseNumber: false, credentialsVerified: false }),
    ).toBe("missing");
  });

  it("ne tient pas pour valide une validation sans numéro", () => {
    expect(
      credentialStatus({ hasLicenseNumber: false, credentialsVerified: true }),
    ).toBe("missing");
  });

  it("ne bloque qu’un radiologue non validé", () => {
    expect(credentialBlock(radiologist({}))).toBeNull();
    expect(credentialBlock(radiologist({ credentialsVerified: false }))).toBe(
      "pending",
    );
    expect(
      credentialBlock(
        radiologist({ hasLicenseNumber: false, credentialsVerified: false }),
      ),
    ).toBe("missing");
    // Le personnel d'une clinique et l'équipe IMAFRIK n'ont pas de numéro
    // d'ordre à faire valider.
    expect(credentialBlock(demoSession("m-clinic"))).toBeNull();
    expect(credentialBlock(demoSession("m-admin"))).toBeNull();
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

  it("les espaces de bord ou l’absence de numéro ne changent rien", () => {
    expect(
      identityChangeResetsValidation(signer, {
        ...signer,
        fullName: " Kodjo Mensah ",
        title: " Dr ",
      }),
    ).toBe(false);
    expect(
      identityChangeResetsValidation(
        { ...signer, licenseNumber: "" },
        { ...signer, licenseNumber: "", fullName: "Autre Nom" },
      ),
    ).toBe(false);
  });
});
