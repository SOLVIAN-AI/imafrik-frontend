import { describe, expect, it } from "vitest";

import {
  credentialBlock,
  credentialStatus,
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
