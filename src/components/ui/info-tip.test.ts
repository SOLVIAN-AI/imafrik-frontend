// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HelpContext, type HelpControls } from "@/components/help/help-context";

/**
 * Bulle d'information (ⓘ) : un bouton sans texte visible, nommé d'après
 * l'intitulé qu'il explique, qui ouvre l'explication au clic, au focus du
 * clavier, et se ferme par Échap ou un second clic. Le lien « En savoir
 * plus » n'apparaît que pour un terme du glossaire, sous le panneau
 * d'aide, et l'ouvre sur ce terme.
 */

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/i18n/client", async () => {
  const { messagesFor } = await import("@/i18n");
  return { useMessages: () => messagesFor("fr"), useLocale: () => "fr" };
});

const { ColumnLabel, InfoTip } = await import("@/components/ui/info-tip");

const TEXT =
  "La moitié des examens est rendue plus vite, de la réception à la signature.";

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  document.body.innerHTML = "";
});

/** Laisse Radix monter ou démonter la bulle. */
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

const trigger = () =>
  document.querySelector<HTMLButtonElement>(
    'button[aria-label="À propos de « Délai médian »"]',
  )!;
const bubble = () => document.querySelector<HTMLElement>("[role=dialog]");
const status = () => document.querySelector<HTMLElement>("[role=status]")!;
const learnMore = () =>
  [...document.querySelectorAll("button")].find(
    (button) => button.textContent === "En savoir plus",
  );

async function render(element: React.ReactElement) {
  await act(async () => root.render(element));
}

describe("bulle d'information", () => {
  it("un bouton sans texte visible, nommé d'après son intitulé", async () => {
    await render(
      createElement(ColumnLabel, {
        label: "Délai médian",
        info: { text: TEXT },
      }),
    );
    expect(trigger()).not.toBeNull();
    expect(trigger().textContent).toBe("");
    // Fermée : rien d'autre que l'intitulé, aucun texte caché.
    expect(container.textContent).toBe("Délai médian");
    expect(bubble()).toBeNull();
  });

  it("s'ouvre au clic, sans lien hors glossaire, et se ferme au second", async () => {
    await render(createElement(InfoTip, { label: "Délai médian", text: TEXT }));
    await act(async () => trigger().click());
    await flush();
    expect(bubble()?.textContent).toContain(TEXT);
    expect(bubble()?.getAttribute("aria-label")).toBe("Délai médian");
    // Annoncée aux lecteurs d'écran par la zone d'état.
    expect(status().textContent).toBe(TEXT);
    // Pas de terme : pas de « En savoir plus ».
    expect(learnMore()).toBeUndefined();

    await act(async () => trigger().click());
    await flush();
    expect(bubble()).toBeNull();
    expect(status().textContent).toBe("");
  });

  it("s'ouvre au focus du clavier, et Échap la ferme", async () => {
    await render(
      createElement(InfoTip, {
        label: "Délai médian",
        title: "Délai",
        text: TEXT,
      }),
    );
    await act(async () => trigger().focus());
    await flush();
    expect(bubble()?.textContent).toContain("Délai");
    expect(status().textContent).toBe(`Délai. ${TEXT}`);
    // Le focus reste sur le bouton.
    expect(document.activeElement).toBe(trigger());

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    await flush();
    expect(bubble()).toBeNull();
  });

  it("sans panneau d'aide, aucun lien, même pour un terme du glossaire", async () => {
    await render(
      createElement(InfoTip, {
        label: "Délai médian",
        text: TEXT,
        term: "delaiMedian",
      }),
    );
    await act(async () => trigger().click());
    await flush();
    expect(bubble()).not.toBeNull();
    expect(learnMore()).toBeUndefined();
  });

  it("« En savoir plus » ouvre l'aide sur le terme, et ferme la bulle", async () => {
    const openTerm = vi.fn();
    const help: HelpControls = {
      isOpen: () => false,
      subscribe: () => () => undefined,
      toggle: vi.fn(),
      setOpen: vi.fn(),
      openTerm,
    };
    await render(
      createElement(
        HelpContext.Provider,
        { value: help },
        createElement(InfoTip, {
          label: "Délai médian",
          text: TEXT,
          term: "delaiMedian",
        }),
      ),
    );
    await act(async () => trigger().click());
    await flush();
    const link = learnMore()!;
    expect(link.getAttribute("aria-label")).toBe(
      "En savoir plus sur « Délai médian » dans le glossaire",
    );

    await act(async () => link.click());
    await flush();
    expect(openTerm).toHaveBeenCalledWith("delaiMedian");
    expect(bubble()).toBeNull();
  });
});
