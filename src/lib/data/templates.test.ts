import { afterEach, describe, expect, it, vi } from "vitest";

import { listTemplatesOrNone, type ReportTemplate } from "@/lib/data/templates";

afterEach(() => vi.restoreAllMocks());

/**
 * Constat FM-14 de l'audit du 9 octobre 2026 : un échec de la liste des
 * modèles, facultative, remplaçait l'écran de lecture par une page
 * d'erreur.
 */
describe("modèles de l'écran de lecture", () => {
  it("un service en panne laisse l'écran s'ouvrir sans modèles", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const load = vi.fn(async () => {
      throw new Error("Service indisponible (500)");
    });

    await expect(listTemplatesOrNone("CT", load)).resolves.toEqual([]);
    expect(load).toHaveBeenCalledWith("CT");
    expect(logged).toHaveBeenCalledOnce();
  });

  it("rend les modèles quand le service répond", async () => {
    const template = { id: "t1", name: "Scanner normal" } as ReportTemplate;
    await expect(
      listTemplatesOrNone("CT", async () => [template]),
    ).resolves.toEqual([template]);
  });
});
