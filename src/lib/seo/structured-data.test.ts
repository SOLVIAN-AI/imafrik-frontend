import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { homeStructuredData, serializeJsonLd } from "@/lib/seo/structured-data";

describe("données structurées de l'accueil", () => {
  // Indépendant de l'environnement (.env.local, CI) : le domaine public.
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://imafrik.tech/"));
  afterEach(() => vi.unstubAllEnvs());

  it("présentent le site et son éditeur, reliés par leur identifiant", () => {
    const data = homeStructuredData("fr", "Téléradiologie");
    const [site, organization] = data["@graph"];
    expect(site).toMatchObject({ "@type": "WebSite", name: "IMAFRIK" });
    expect(organization).toMatchObject({
      "@type": "Organization",
      name: "IMAFRIK",
      description: "Téléradiologie",
    });
    expect(site.publisher).toEqual({ "@id": organization["@id"] });
  });

  it("n'emploient que des adresses absolues sur le domaine public", () => {
    const text = JSON.stringify(homeStructuredData("en", "Teleradiology"));
    const urls = text.match(/https?:\/\/[^"]+/g) ?? [];
    const site = urls.filter((url) => !url.startsWith("https://schema.org"));
    expect(site.length).toBeGreaterThan(0);
    for (const url of site) expect(url).toMatch(/^https:\/\/imafrik\.tech\//);
  });

  it("dirigent le contact vers la page de la bonne langue", () => {
    const [, fr] = homeStructuredData("fr", "x")["@graph"];
    const [, en] = homeStructuredData("en", "x")["@graph"];
    expect(fr).toMatchObject({
      contactPoint: { url: "https://imafrik.tech/contact" },
    });
    expect(en).toMatchObject({
      contactPoint: { url: "https://imafrik.tech/en/contact" },
    });
  });

  it("ne laissent aucune balise fermer le script", () => {
    const serialized = serializeJsonLd({ name: "</script><script>alert(1)" });
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual({
      name: "</script><script>alert(1)",
    });
  });
});
