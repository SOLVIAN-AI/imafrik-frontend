import { describe, expect, it } from "vitest";

import { anchorFor } from "@/components/marketing/legal-toc";

describe("ancres du sommaire des pages légales", () => {
  it("tire une ancre lisible de l’intitulé", () => {
    expect(anchorFor("2. Données de santé des patients")).toBe(
      "donnees-de-sante-des-patients",
    );
    expect(anchorFor("Transferts hors de l’Union européenne")).toBe(
      "transferts-hors-de-l-union-europeenne",
    );
    expect(anchorFor("Your rights")).toBe("your-rights");
  });
});
