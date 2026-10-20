// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Session } from "@/lib/session/types";

/**
 * Le moteur des visites, monté sur une page factice : démarrage à la
 * première ouverture, fin notée sur le profil et sur l'appareil, Échap,
 * étapes facultatives écartées, raccourcis de la page neutralisés.
 */

const state = vi.hoisted(() => ({
  pathname: "/worklist",
  session: null as Session | null,
}));
const completeTour = vi.hoisted(() =>
  vi.fn(async (tour: string) => ({ ok: true as const, data: [tour] })),
);

vi.mock("@/lib/actions/tours", () => ({ completeTour }));
vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => state.session,
}));
vi.mock("@/i18n/client", async () => {
  const { messagesFor } = await import("@/i18n");
  return { useMessages: () => messagesFor("fr"), useLocale: () => "fr" };
});

const { TourProvider } = await import("@/components/tour/tour-provider");
const { STORAGE_PREFIX } = await import("@/components/tour/storage");
const { demoSession } = await import("@/lib/session/demo");

/** Session réelle d'une radiologue, sans visite faite. */
function realSession(toursCompleted: string[] = []): Session {
  return { ...demoSession("m-radio"), isDemo: false, toursCompleted };
}

/** Repères affichés par la page factice, avec leur rectangle. */
const ANCHORS: Record<string, [number, number, number, number]> = {
  "nav-worklist": [80, 8, 200, 36],
  "worklist-metrics": [120, 260, 900, 90],
  menu: [8, 8, 40, 40],
  search: [8, 600, 360, 32],
  help: [8, 1300, 32, 32],
};

let container: HTMLElement;
let root: Root;

function page() {
  return createElement(
    "div",
    null,
    ...Object.keys(ANCHORS).map((name) =>
      createElement("button", { key: name, "data-tour": name }, name),
    ),
  );
}

function render() {
  act(() => root.render(createElement(TourProvider, null, page())));
  // happy-dom ne calcule aucune mise en page : chaque repère reçoit le
  // rectangle qu'aurait l'élément à l'écran.
  for (const [name, [top, left, width, height]] of Object.entries(ANCHORS)) {
    const element = container.querySelector(`[data-tour="${name}"]`)!;
    element.getBoundingClientRect = () =>
      ({
        top,
        left,
        width,
        height,
        right: left + width,
        bottom: top + height,
      }) as DOMRect;
  }
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function dialog(): HTMLElement | null {
  return document.querySelector('[role="dialog"]');
}

function button(name: string): HTMLButtonElement {
  const found = [...(dialog()?.querySelectorAll("button") ?? [])].find(
    (entry) => entry.textContent === name,
  );
  if (!found) throw new Error(`Bouton « ${name} » absent de la visite`);
  return found;
}

function click(name: string) {
  act(() => button(name).click());
}

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  window.sessionStorage.clear();
  completeTour.mockClear();
  state.pathname = "/worklist";
  state.session = realSession();
  window.innerWidth = 1440;
  window.innerHeight = 900;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe("visite guidée", () => {
  it("démarre seule à la première ouverture de l'écran", () => {
    render();
    expect(dialog()).toBeNull();
    advance(700);
    expect(dialog()?.textContent).toContain("Bienvenue sur IMAFRIK");
    // Neuf étapes, dont deux facultatives sans repère à l'écran (filtres,
    // tableau) : sept restent, et le décompte le dit dès la première.
    expect(dialog()?.textContent).toContain("Étape 1 sur 7");
  });

  it("enchaîne les étapes, puis note la visite faite sur le profil et l'appareil", () => {
    render();
    advance(700);
    for (let step = 1; step < 7; step += 1) click("Suivant");
    expect(dialog()?.textContent).toContain("Étape 7 sur 7");
    expect(dialog()?.textContent).toContain("Besoin d’aide ?");
    click("Terminer");
    expect(dialog()).toBeNull();
    expect(completeTour).toHaveBeenCalledExactlyOnceWith("radiologue-file");
    expect(
      JSON.parse(
        window.localStorage.getItem(
          `${STORAGE_PREFIX}${state.session!.user.id}`,
        )!,
      ),
    ).toEqual(["radiologue-file"]);
  });

  it("revient d'une étape, et montre l'entrée du menu à la place d'une entrée absente", () => {
    render();
    advance(700);
    click("Suivant");
    click("Suivant");
    click("Suivant");
    // « Vos examens » : son entrée n'est pas affichée, la bulle désigne le menu.
    expect(dialog()?.textContent).toContain("Vos examens");
    click("Précédent");
    expect(dialog()?.textContent).toContain("L’essentiel d’un coup d’œil");
  });

  it("se passe avec Échap, et compte alors comme faite", () => {
    render();
    advance(700);
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
    expect(dialog()).toBeNull();
    expect(completeTour).toHaveBeenCalledExactlyOnceWith("radiologue-file");
  });

  it("ne revient pas quand le profil la dit faite", () => {
    state.session = realSession(["radiologue-file"]);
    render();
    advance(5_000);
    expect(dialog()).toBeNull();
  });

  it("ne revient pas quand l'appareil la retient, faute d'enregistrement", () => {
    window.localStorage.setItem(
      `${STORAGE_PREFIX}${state.session!.user.id}`,
      JSON.stringify(["radiologue-file"]),
    );
    render();
    advance(5_000);
    expect(dialog()).toBeNull();
  });

  it("n'écrit rien sur le serveur en démonstration", () => {
    state.session = demoSession("m-radio");
    render();
    advance(700);
    click("Passer la visite");
    expect(completeTour).not.toHaveBeenCalled();
    expect(
      window.localStorage.getItem(`${STORAGE_PREFIX}${state.session.user.id}`),
    ).toBe('["radiologue-file"]');
  });

  it("attend qu'aucune fenêtre ne soit ouverte par-dessus la page", () => {
    const other = document.createElement("div");
    other.setAttribute("role", "dialog");
    other.setAttribute("data-state", "open");
    document.body.append(other);
    render();
    advance(2_000);
    expect(dialog()).toBe(other);
    other.remove();
    advance(300);
    expect(dialog()?.textContent).toContain("Bienvenue sur IMAFRIK");
  });

  it("ne laisse pas les raccourcis de la page agir sous la visite", () => {
    const shortcut = vi.fn();
    window.addEventListener("keydown", shortcut);
    try {
      render();
      advance(700);
      act(() => {
        button("Suivant").dispatchEvent(
          new KeyboardEvent("keydown", { key: "j", bubbles: true }),
        );
      });
      expect(shortcut).not.toHaveBeenCalled();
      // La flèche droite, elle, fait avancer la visite.
      act(() => {
        button("Suivant").dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
      });
      expect(dialog()?.textContent).toContain("Étape 2 sur 7");
    } finally {
      window.removeEventListener("keydown", shortcut);
    }
  });

  it("n'a rien à montrer sur un écran sans visite", () => {
    state.pathname = "/mes-examens";
    render();
    advance(5_000);
    expect(dialog()).toBeNull();
  });
});
