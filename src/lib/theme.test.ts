// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { parseTheme, THEME_SCRIPT } from "@/lib/theme";

describe("parseTheme", () => {
  it("reconnaît les deux thèmes", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("light")).toBe("light");
  });

  it("prend le sombre sans choix lisible", () => {
    expect(parseTheme(null)).toBe("dark");
    expect(parseTheme(undefined)).toBe("dark");
    expect(parseTheme("")).toBe("dark");
    // Valeur que next-themes aurait pu laisser si le système était suivi.
    expect(parseTheme("system")).toBe("dark");
  });
});

describe("THEME_SCRIPT", () => {
  const root = document.documentElement;
  const run = () => new Function(THEME_SCRIPT)();

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    root.className = "";
    root.style.colorScheme = "";
  });

  it("pose le thème choisi, et lui seul", () => {
    localStorage.setItem("theme", "light");
    root.classList.add("dark");
    run();
    expect([...root.classList]).toEqual(["light"]);
    expect(root.style.colorScheme).toBe("light");
  });

  it("pose le sombre à un premier venu", () => {
    run();
    expect([...root.classList]).toEqual(["dark"]);
    expect(root.style.colorScheme).toBe("dark");
  });

  it("pose le sombre sur une valeur illisible", () => {
    localStorage.setItem("theme", "system");
    run();
    expect([...root.classList]).toEqual(["dark"]);
  });

  it("pose le sombre quand le stockage est refusé", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("refusé", "SecurityError");
    });
    run();
    expect([...root.classList]).toEqual(["dark"]);
  });
});
