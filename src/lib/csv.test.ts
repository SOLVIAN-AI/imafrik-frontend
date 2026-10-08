import { describe, expect, it } from "vitest";

import { CSV_BOM, csvCell, toCsv } from "@/lib/csv";

describe("csvCell", () => {
  it("neutralise tout début de formule", () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe(
      '"\'=HYPERLINK(""http://x"")"',
    );
    expect(csvCell("+33 6")).toBe("'+33 6");
    expect(csvCell("-2+3")).toBe("'-2+3");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\tcmd")).toBe("'\tcmd");
  });

  it("laisse les nombres en nombres, à la française", () => {
    expect(csvCell(-3)).toBe("-3");
    expect(csvCell(2.5)).toBe("2,5");
    expect(csvCell(Number.NaN)).toBe("");
  });

  it("met entre guillemets ce qui contient un séparateur", () => {
    expect(csvCell("Lomé; Togo")).toBe('"Lomé; Togo"');
    expect(csvCell('dit "oui"')).toBe('"dit ""oui"""');
    expect(csvCell("ligne\nsuivante")).toBe('"ligne\nsuivante"');
    expect(csvCell(null)).toBe("");
  });
});

describe("toCsv", () => {
  it("assemble un document lisible par un tableur français", () => {
    expect(toCsv(["Clinique", "Actes"], [["Saint-Joseph", 12]])).toBe(
      `${CSV_BOM}Clinique;Actes\r\nSaint-Joseph;12\r\n`,
    );
  });
});
