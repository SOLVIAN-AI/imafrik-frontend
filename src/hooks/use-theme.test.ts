// @vitest-environment happy-dom
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { setTheme, useTheme } from "@/hooks/use-theme";
import type { Theme } from "@/lib/theme";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const root = document.documentElement;

/** Composant minimal qui écrit le thème lu, et compte ses rendus. */
function mount() {
  const container = document.createElement("div");
  const reactRoot = createRoot(container);
  const seen: (Theme | undefined)[] = [];
  function Probe() {
    const { theme } = useTheme();
    seen.push(theme);
    return React.createElement("span", null, theme ?? "?");
  }
  act(() => reactRoot.render(React.createElement(Probe)));
  return { container, seen, unmount: () => act(() => reactRoot.unmount()) };
}

afterEach(() => {
  localStorage.clear();
  root.className = "";
  root.style.colorScheme = "";
});

describe("useTheme", () => {
  it("ne connaît pas le thème au rendu serveur", () => {
    function Probe() {
      return React.createElement("span", null, useTheme().theme ?? "?");
    }
    expect(renderToString(React.createElement(Probe))).toBe("<span>?</span>");
  });

  it("lit le thème posé sur <html> par le script", () => {
    root.classList.add("light");
    const probe = mount();
    expect(probe.container.textContent).toBe("light");
    probe.unmount();
  });

  it("bascule, retient le choix et re-rend ceux qui le lisent", () => {
    root.classList.add("dark");
    const probe = mount();
    act(() => setTheme("light"));
    expect(probe.container.textContent).toBe("light");
    expect([...root.classList]).toEqual(["light"]);
    expect(root.style.colorScheme).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    probe.unmount();
  });

  it("suit un changement fait dans un autre onglet", () => {
    root.classList.add("dark");
    const probe = mount();
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "theme", newValue: "light" }),
      );
    });
    expect(probe.container.textContent).toBe("light");
    expect([...root.classList]).toEqual(["light"]);
    probe.unmount();
  });

  it("ignore les autres clés du stockage", () => {
    root.classList.add("dark");
    const probe = mount();
    const renders = probe.seen.length;
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "autre", newValue: "light" }),
      );
    });
    expect(probe.seen.length).toBe(renders);
    expect([...root.classList]).toEqual(["dark"]);
    probe.unmount();
  });
});
