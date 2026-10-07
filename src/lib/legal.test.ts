import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SUBPROCESSORS, missingLegalFacts } from "@/lib/legal";

/** Fichiers source des pages publiques. */
function publicSources(): string[] {
  const roots = ["src/app/(marketing)", "src/components/marketing"];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (path.endsWith(".tsx")) files.push(path);
    }
  };
  roots.forEach(walk);
  return files;
}

describe("pages publiques", () => {
  it("n'affichent aucun trou « [à compléter] » au public", () => {
    // Un crochet contenant un mot de gabarit trahit une page légale
    // inachevée : nom, adresse, durée, droit applicable…
    const placeholder =
      /\[[^\]\n]*\b(durée|nom|adresse|droit|préciser|autorité|numéro|forme|juridiction|hébergeur|qualité)\b[^\]\n]*\]/i;
    const offenders = publicSources().filter((file) =>
      placeholder.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  it("ne promettent ni chiffrement de disque ni plateformes que le kit n'offre pas", () => {
    const text = publicSources()
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(text).not.toMatch(/Nous chiffrons son disque/);
    expect(text).not.toMatch(/Windows, macOS ou Linux/);
    expect(text).not.toMatch(/Aucun port d’imagerie n’est exposé/);
  });
});

describe("faits juridiques", () => {
  it("donnent l'adresse de chaque hébergeur cité dans les mentions", () => {
    for (const name of ["Hetzner Online GmbH", "Vercel Inc."]) {
      expect(SUBPROCESSORS.find((p) => p.name === name)?.address).toBeTruthy();
    }
  });

  it("disent ce qu'il manque encore à l'éditeur", () => {
    // Liste attendue tant que l'éditeur n'a pas fourni ses informations ;
    // ce test change le jour où elles le sont.
    expect(missingLegalFacts()).toContain("numéro d’immatriculation");
  });
});
