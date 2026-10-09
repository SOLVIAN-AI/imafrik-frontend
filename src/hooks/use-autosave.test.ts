// @vitest-environment happy-dom
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { type SaveOutcome, useAutosave } from "@/hooks/use-autosave";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

type Hook = ReturnType<typeof useAutosave<string>>;

/** Monte le hook dans un composant minimal et expose son dernier résultat. */
function mount(
  save: (value: string) => Promise<SaveOutcome>,
  keep?: (value: string) => Promise<boolean>,
) {
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const current: { hook?: Hook } = {};

  function Probe({ value }: { value: string }) {
    current.hook = useAutosave({ value, save, keep, delay: 10 });
    return null;
  }

  const render = (value: string) =>
    act(async () => root.render(React.createElement(Probe, { value })));
  return { render, current, unmount: () => act(() => root.unmount()) };
}

afterEach(() => vi.useRealTimers());

/** Laisse partir l'écriture différée (10 ms) et sa chaîne. */
async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

/** Vrai si quitter la page demanderait confirmation. */
function wouldWarnOnUnload(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("useAutosave", () => {
  it("survit à une écriture qui lève, et repart au retour du réseau", async () => {
    let online = false;
    const save = vi.fn(async () => {
      if (!online) throw new TypeError("Failed to fetch");
      return "saved" as const;
    });
    const probe = mount(save);
    await probe.render("a");
    await probe.render("ab");

    let flushed = true;
    await act(async () => {
      flushed = await probe.current.hook!.flush();
    });
    expect(flushed).toBe(false);
    expect(probe.current.hook!.state).toBe("offline");

    online = true;
    await act(async () => {
      flushed = await probe.current.hook!.flush();
    });
    expect(flushed).toBe(true);
    expect(probe.current.hook!.state).toBe("saved");
    expect(save).toHaveBeenLastCalledWith("ab");
    await probe.unmount();
  });

  // Constat FM-2 de l'audit du 9 octobre 2026 : après un conflit, plus
  // rien n'était écrit nulle part, et le rechargement demandé perdait tout
  // ce qui avait été tapé depuis.
  it("garde sur le poste tout ce qui est tapé pendant un conflit", async () => {
    const save = vi.fn(async (): Promise<SaveOutcome> => "conflict");
    const keep = vi.fn(async () => true);
    const probe = mount(save, keep);
    await probe.render("a");
    await probe.render("ab");
    await settle();

    expect(probe.current.hook!.state).toBe("conflict");
    expect(keep).toHaveBeenLastCalledWith("ab");

    await probe.render("abc");
    await settle();
    expect(keep).toHaveBeenLastCalledWith("abc");
    expect(save).toHaveBeenCalledTimes(1);
    // Le texte affiché est gardé : recharger, comme l'écran y invite,
    // ne demande pas confirmation.
    expect(wouldWarnOnUnload()).toBe(false);
    await probe.unmount();
  });

  it("retient l'utilisateur si la copie n'a pas pu être écrite", async () => {
    const save = vi.fn(async (): Promise<SaveOutcome> => "conflict");
    const keep = vi.fn(async () => false);
    const probe = mount(save, keep);
    await probe.render("a");
    await probe.render("ab");
    await settle();
    expect(probe.current.hook!.state).toBe("conflict");
    expect(wouldWarnOnUnload()).toBe(true);
    await probe.unmount();
  });

  it("reprend l'enregistrement quand l'utilisateur garde son texte", async () => {
    let resolved = false;
    const save = vi.fn(async (): Promise<SaveOutcome> =>
      resolved ? "saved" : "conflict",
    );
    const probe = mount(save, async () => true);
    await probe.render("a");
    await probe.render("ab");
    await settle();
    await probe.render("abc");
    await settle();
    expect(probe.current.hook!.state).toBe("conflict");

    resolved = true;
    let saved = false;
    await act(async () => {
      saved = await probe.current.hook!.resume();
    });
    expect(saved).toBe(true);
    expect(probe.current.hook!.state).toBe("saved");
    expect(save).toHaveBeenLastCalledWith("abc");
    expect(wouldWarnOnUnload()).toBe(false);
    await probe.unmount();
  });
});
