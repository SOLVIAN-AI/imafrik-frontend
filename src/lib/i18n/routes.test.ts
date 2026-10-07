import { describe, expect, it } from "vitest";

import {
  isPublicSitePath,
  languageAlternates,
  localeOfPath,
  localizePath,
  resolveLocale,
  translatePath,
} from "@/lib/i18n/routes";

describe("adresses du site public", () => {
  it("déduit la langue de l'adresse", () => {
    expect(localeOfPath("/")).toBe("fr");
    expect(localeOfPath("/securite")).toBe("fr");
    expect(localeOfPath("/en")).toBe("en");
    expect(localeOfPath("/en/security")).toBe("en");
    // Un mot qui commence par « en » n'est pas le préfixe anglais.
    expect(localeOfPath("/envoyer")).toBe("fr");
    expect(localeOfPath("/en-attente")).toBe("fr");
  });

  it("traduit les adresses et les ancres", () => {
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/securite", "en")).toBe("/en/security");
    expect(localizePath("/#tarifs", "en")).toBe("/en#pricing");
    expect(localizePath("/#tarifs", "fr")).toBe("/#tarifs");
    expect(localizePath("/verifier/ABCD-1234", "en")).toBe(
      "/en/verify/ABCD-1234",
    );
  });

  it("laisse l'application en français", () => {
    expect(localizePath("/connexion", "en")).toBe("/connexion");
  });

  it("trouve l'équivalent pour le sélecteur de langue", () => {
    expect(translatePath("/confidentialite", "en")).toBe("/en/privacy");
    expect(translatePath("/en/legal-notice", "fr")).toBe("/mentions-legales");
    expect(translatePath("/en/verify/K7M2", "fr")).toBe("/verifier/K7M2");
    expect(translatePath("/en/terms", "en")).toBe("/en/terms");
    expect(translatePath("/en/inconnue", "fr")).toBe("/");
  });

  it("fournit les alternatives hreflang", () => {
    expect(languageAlternates("/cgu")).toEqual({
      fr: "/cgu",
      en: "/en/terms",
      "x-default": "/cgu",
    });
  });
});

describe("langue des écrans partagés", () => {
  it("suit la langue choisie sur la connexion seulement", () => {
    expect(resolveLocale("/connexion", "en")).toBe("en");
    expect(resolveLocale("/mot-de-passe-oublie", "en")).toBe("en");
    expect(resolveLocale("/connexion", undefined)).toBe("fr");
    expect(resolveLocale("/connexion", "de")).toBe("fr");
    // L'application et les écrans qui suivent la connexion restent en français.
    expect(resolveLocale("/double-authentification", "en")).toBe("fr");
    expect(resolveLocale("/worklist", "en")).toBe("fr");
    expect(resolveLocale("/en/security", undefined)).toBe("en");
    expect(resolveLocale("/securite", "en")).toBe("fr");
  });

  it("reconnaît les pages du site public", () => {
    expect(isPublicSitePath("/")).toBe(true);
    expect(isPublicSitePath("/en/privacy")).toBe(true);
    expect(isPublicSitePath("/verifier/ABC")).toBe(true);
    expect(isPublicSitePath("/connexion")).toBe(false);
    expect(isPublicSitePath("/worklist")).toBe(false);
  });

  it("change la langue d'un écran partagé sans changer son adresse", () => {
    expect(translatePath("/connexion", "en")).toBe("/connexion?langue=en");
  });
});
