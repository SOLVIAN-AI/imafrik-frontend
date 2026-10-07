import { describe, expect, it } from "vitest";

import { countWords } from "@/components/editor/report-editor";
import {
  filterSlashItems,
  SLASH_ITEMS,
} from "@/components/editor/slash-commands";

describe("filterSlashItems", () => {
  it("propose tout sans saisie", () => {
    expect(filterSlashItems("")).toHaveLength(SLASH_ITEMS.length);
  });

  it("ignore casse et accents, et cherche aussi dans les mots-clés", () => {
    const titles = filterSlashItems("PLEU").map((item) => item.title);
    expect(titles).toContain("Absence d’épanchement pleural ou péricardique.");
    expect(
      filterSlashItems("epanchement peritoneal").map((item) => item.id),
    ).toEqual(["peritoneum"]);
    expect(filterSlashItems("epanchement genou")).toHaveLength(0);
    expect(filterSlashItems("ascite").map((item) => item.id)).toEqual([
      "peritoneum",
    ]);
  });

  it("cherche dans les intitulés de la langue de l'écran, phrases types comprises", () => {
    expect(
      filterSlashItems("measurement table", "en").map((item) => item.id),
    ).toEqual(["table"]);
    expect(filterSlashItems("pleu", "en").map((item) => item.id)).toEqual([
      "pleura",
    ]);
  });

  it("insère les phrases dans la langue du compte-rendu, pas de l'écran", () => {
    const [english] = filterSlashItems("pleura", "fr", "en");
    expect(english.title).toBe("No pleural or pericardial effusion.");
    // L'intitulé du groupe, lui, reste dans la langue de l'écran.
    expect(english.groupLabel).toBe("Phrases types");
    const [french] = filterSlashItems("plevre", "en", "fr");
    expect(french.title).toBe("Absence d’épanchement pleural ou péricardique.");
  });

  it("propose les mêmes phrases dans les deux langues", () => {
    const ids = (language: "fr" | "en") =>
      filterSlashItems("", "fr", language)
        .filter((item) => item.group === "phrases")
        .map((item) => item.id);
    expect(ids("en")).toEqual(ids("fr"));
  });

  it("exige chaque mot tapé", () => {
    expect(filterSlashItems("tableau mesures").map((item) => item.id)).toEqual([
      "table",
    ]);
  });
});

describe("countWords", () => {
  it("compte les mots du texte, pas le balisage", () => {
    expect(
      countWords("<p>Foyer <strong>basal</strong> droit.</p><p></p>"),
    ).toBe(3);
    expect(countWords("<p>&nbsp;</p>")).toBe(0);
    expect(
      countWords("<table><tr><td>14 mm</td><td>stable</td></tr></table>"),
    ).toBe(3);
  });
});
