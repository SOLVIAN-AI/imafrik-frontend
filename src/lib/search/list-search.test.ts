import { describe, expect, it } from "vitest";

import {
  decodeListSearch,
  encodeListSearch,
  isListSearchScope,
  LIST_SEARCH_MAX_LENGTH,
  listSearchCookie,
  normalizeListSearch,
} from "@/lib/search/list-search";

const owner = {
  userId: "7d1f0c3e-2b4a-4c8e-9f10-1a2b3c4d5e6f",
  membershipId: "0b9e8d7c-6f5a-4e3d-8c2b-1a0f9e8d7c6b",
};

describe("recherche des listes d'examens", () => {
  it("ne reconnaît que les listes déclarées", () => {
    expect(isListSearchScope("worklist")).toBe(true);
    expect(isListSearchScope("admin-examens")).toBe(true);
    expect(isListSearchScope("utilisateurs")).toBe(false);
    expect(isListSearchScope(42)).toBe(false);
  });

  it("donne un cookie distinct à chaque liste", () => {
    expect(listSearchCookie("worklist")).not.toBe(listSearchCookie("examens"));
  });

  it("normalise la saisie", () => {
    expect(normalizeListSearch("  KOFFI \t  Ama\n")).toBe("KOFFI Ama");
    expect(normalizeListSearch("a\u0000b")).toBe("a b");
    expect(normalizeListSearch("x".repeat(500))).toHaveLength(
      LIST_SEARCH_MAX_LENGTH,
    );
    expect(normalizeListSearch("   ")).toBe("");
  });

  it("relit la recherche de son propriétaire", () => {
    const value = encodeListSearch(owner, "KOFFI Ama; é.");
    expect(decodeListSearch(value, owner)).toBe("KOFFI Ama; é.");
  });

  it("ne livre rien à un autre compte ni après une bascule d'organisation", () => {
    const value = encodeListSearch(owner, "KOFFI");
    expect(
      decodeListSearch(value, { ...owner, userId: "autre-compte" }),
    ).toBeUndefined();
    expect(
      decodeListSearch(value, { ...owner, membershipId: "autre-org" }),
    ).toBeUndefined();
  });

  it("ignore une valeur absente, tronquée ou mal encodée", () => {
    expect(decodeListSearch(undefined, owner)).toBeUndefined();
    expect(decodeListSearch("abc", owner)).toBeUndefined();
    expect(
      decodeListSearch(`${owner.userId}.${owner.membershipId}.%E0%A4%A`, owner),
    ).toBeUndefined();
  });
});
