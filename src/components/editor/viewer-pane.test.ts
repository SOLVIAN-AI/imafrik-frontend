// @vitest-environment happy-dom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ViewerPane } from "@/components/editor/viewer-pane";
import { DEMO_STUDIES } from "@/lib/demo/studies";

/**
 * Le cadre du viewer ne télécharge rien.
 *
 * Aucune image d'un examen ne doit sortir d'IMAFRIK (demandé le
 * 29 octobre 2026). Sans `allow-downloads` dans `sandbox`, le navigateur
 * refuse lui-même tout téléchargement lancé depuis le viewer, en plus des
 * sorties retirées de la configuration d'OHIF. Les drapeaux de `sandbox`
 * sont donc une liste fermée : en ajouter un se décide ici, pas au détour
 * d'un correctif.
 *
 * `clipboard-write` reste accordé, à dessein, et n'est pas figé ici : le
 * bouton « Copier » de la fenêtre d'erreur d'OHIF en a besoin (pile
 * d'erreur pour le support, rétabli le 21 octobre 2026). Une image copiée
 * est refusée par la configuration d'OHIF, côté backend.
 */

const VIEWER_URL = "https://viewer.imafrik.test/viewer?token=jeton";

/** Le cadre rendu par le volet, tel que le serveur l'envoie. */
function frame(): HTMLIFrameElement {
  const markup = renderToStaticMarkup(
    createElement(ViewerPane, {
      study: DEMO_STUDIES[0],
      viewerUrl: VIEWER_URL,
    }),
  );
  // Un gabarit est inerte : le cadre n'y va pas charger son adresse.
  const template = document.createElement("template");
  template.innerHTML = markup;
  const iframe = template.content.querySelector("iframe");
  if (!iframe) throw new Error("Aucun cadre rendu pour le viewer");
  return iframe;
}

/** Les drapeaux de `sandbox`. */
function sandboxFlags(iframe: HTMLIFrameElement): string[] {
  return (iframe.getAttribute("sandbox") ?? "").split(/\s+/).filter(Boolean);
}

describe("cadre du viewer", () => {
  it("charge l’adresse signée du viewer", () => {
    expect(frame().getAttribute("src")).toBe(VIEWER_URL);
  });

  it("n’autorise aucun téléchargement", () => {
    expect(sandboxFlags(frame())).not.toContain("allow-downloads");
  });

  it("ne lui accorde que ses scripts et son origine", () => {
    expect(sandboxFlags(frame()).toSorted()).toEqual([
      "allow-same-origin",
      "allow-scripts",
    ]);
  });
});
