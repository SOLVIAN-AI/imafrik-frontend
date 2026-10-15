import { describe, expect, it } from "vitest";

import { withoutTitle } from "@/components/admin/invite-requester-button";

describe("nom proposé à l'invitation", () => {
  it.each([
    ["Dr Sena Akakpo", "Sena Akakpo"],
    ["dr. Sena Akakpo", "Sena Akakpo"],
    ["Docteur Sena Akakpo", "Sena Akakpo"],
    ["Pr Mawuli Agbeko", "Mawuli Agbeko"],
    ["  Sena Akakpo ", "Sena Akakpo"],
    // Un prénom qui commence par ces lettres n'est pas un titre.
    ["Driss Alaoui", "Driss Alaoui"],
    ["Prosper Kodjo", "Prosper Kodjo"],
  ])("« %s » devient « %s »", (input, expected) => {
    expect(withoutTitle(input)).toBe(expected);
  });
});
