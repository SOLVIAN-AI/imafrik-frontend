import { describe, expect, it } from "vitest";

import { countOptions, filterRows, type RowValues } from "@/lib/filters/facets";

interface Account {
  name: string;
  roles: string[];
  orgs: string[];
}

const ROWS: Account[] = [
  { name: "Adjo", roles: ["radiologist"], orgs: ["grp"] },
  { name: "Akouvi", roles: ["clinic_staff"], orgs: ["stj"] },
  { name: "Elsa", roles: ["radiologist"], orgs: ["stj"] },
  // Deux appartenances : elle compte pour chacune.
  {
    name: "Fatou",
    roles: ["radiologist", "clinic_staff"],
    orgs: ["grp", "pka"],
  },
];

const VALUES: RowValues<Account> = {
  role: (row) => row.roles,
  organization: (row) => row.orgs,
};

describe("filtres sur la page", () => {
  it("retient une ligne dont une valeur est l’option choisie", () => {
    const names = (rows: Account[]) => rows.map((row) => row.name);
    expect(names(filterRows(ROWS, VALUES, { role: "clinic_staff" }))).toEqual([
      "Akouvi",
      "Fatou",
    ]);
    expect(
      names(
        filterRows(ROWS, VALUES, { role: "radiologist", organization: "stj" }),
      ),
    ).toEqual(["Elsa"]);
    expect(filterRows(ROWS, VALUES, {})).toHaveLength(4);
  });

  it("compte chaque option sans son propre filtre", () => {
    const filters = { role: "radiologist", organization: "stj" };
    // Les rôles, dans la clinique Saint-Joseph : le filtre de rôle ignoré.
    expect(
      countOptions(ROWS, VALUES, filters, "role", [
        { value: "radiologist" },
        { value: "clinic_staff" },
        { value: "platform_admin" },
      ]),
    ).toEqual({
      options: [
        { value: "radiologist", count: 1 },
        { value: "clinic_staff", count: 1 },
        { value: "platform_admin", count: 0 },
      ],
      total: 2,
    });
    // Les organisations, parmi les radiologues.
    expect(
      countOptions(ROWS, VALUES, filters, "organization", [
        { value: "stj", label: "Saint-Joseph" },
        { value: "grp", label: "Groupe" },
      ]),
    ).toEqual({
      options: [
        { value: "stj", label: "Saint-Joseph", count: 1 },
        { value: "grp", label: "Groupe", count: 2 },
      ],
      total: 3,
    });
  });
});
