import { describe, expect, it } from "vitest";

import {
  requesterFromSearch,
  validateContactForm,
  type ContactFormValues,
} from "@/lib/contact-form";

const clinic: ContactFormValues = {
  requesterKind: "clinic",
  name: "Komlan Adjavon",
  organization: "Centre de santé de Tsévié",
  email: "direction@tsevie.example",
  licenseNumber: "",
};

const radiologist: ContactFormValues = {
  requesterKind: "radiologist",
  name: "Sena Akakpo",
  organization: "",
  email: "s.akakpo@exemple.tg",
  licenseNumber: "TG-RAD-0318",
};

describe("formulaire de contact", () => {
  it("accepte une demande complète d’établissement ou de radiologue", () => {
    expect(validateContactForm(clinic)).toEqual([]);
    expect(validateContactForm(radiologist)).toEqual([]);
  });

  it("exige de dire qui écrit", () => {
    expect(validateContactForm({ ...clinic, requesterKind: null })).toEqual([
      "requesterKind",
    ]);
  });

  it("exige l’établissement d’une clinique, pas celui d’un radiologue", () => {
    expect(validateContactForm({ ...clinic, organization: " " })).toEqual([
      "organization",
    ]);
    expect(validateContactForm({ ...radiologist, organization: "" })).toEqual(
      [],
    );
  });

  it("exige le numéro d’ordre d’un radiologue, dans la limite de la base", () => {
    expect(
      validateContactForm({ ...radiologist, licenseNumber: "  " }),
    ).toEqual(["licenseNumber"]);
    expect(
      validateContactForm({ ...radiologist, licenseNumber: "X".repeat(51) }),
    ).toEqual(["licenseNumber"]);
    // Ignoré pour un établissement, comme par le service.
    expect(validateContactForm({ ...clinic, licenseNumber: "" })).toEqual([]);
  });

  it("signale les champs dans l’ordre du formulaire", () => {
    expect(
      validateContactForm({
        requesterKind: "radiologist",
        name: "",
        organization: "",
        email: "pas-une-adresse",
        licenseNumber: "",
      }),
    ).toEqual(["name", "email", "licenseNumber"]);
  });

  it("présélectionne le demandeur depuis l’adresse", () => {
    expect(requesterFromSearch("?profil=radiologue")).toBe("radiologist");
    expect(requesterFromSearch("?profil=etablissement")).toBe("clinic");
    expect(requesterFromSearch("?profil=autre")).toBeNull();
    expect(requesterFromSearch("")).toBeNull();
  });
});
