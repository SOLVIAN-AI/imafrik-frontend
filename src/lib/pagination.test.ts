import { describe, expect, it } from "vitest";

import { CURSOR_PARAM, pageHref, readCursor } from "@/lib/pagination";

describe("readCursor", () => {
  it("relit un curseur base64url", () => {
    expect(readCursor({ [CURSOR_PARAM]: "WyJyZWNlbnQiXQ" })).toBe(
      "WyJyZWNlbnQiXQ",
    );
  });

  it("ignore une valeur absente, vide, trop longue ou hors alphabet", () => {
    expect(readCursor({})).toBeUndefined();
    expect(readCursor({ [CURSOR_PARAM]: "" })).toBeUndefined();
    expect(readCursor({ [CURSOR_PARAM]: "a".repeat(513) })).toBeUndefined();
    expect(readCursor({ [CURSOR_PARAM]: "a b" })).toBeUndefined();
    expect(readCursor({ [CURSOR_PARAM]: "a/b=" })).toBeUndefined();
  });

  it("ne garde que la première valeur d'un paramètre répété", () => {
    expect(readCursor({ [CURSOR_PARAM]: ["premier", "second"] })).toBe(
      "premier",
    );
  });
});

describe("pageHref", () => {
  it("garde les autres paramètres et remplace le curseur", () => {
    expect(
      pageHref(
        "/admin/examens",
        { urgent: "1", [CURSOR_PARAM]: "ancien" },
        "neuf",
      ),
    ).toBe("/admin/examens?urgent=1&apres=neuf");
  });

  it("revient à la première page sans curseur", () => {
    expect(pageHref("/examens", { [CURSOR_PARAM]: "ancien" }, null)).toBe(
      "/examens",
    );
    expect(pageHref("/admin/examens", { urgent: "1" }, null)).toBe(
      "/admin/examens?urgent=1",
    );
  });
});
