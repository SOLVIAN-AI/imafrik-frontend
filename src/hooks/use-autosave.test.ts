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
function mount(save: (value: string) => Promise<SaveOutcome>) {
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const current: { hook?: Hook } = {};

  function Probe({ value }: { value: string }) {
    current.hook = useAutosave({ value, save, delay: 10 });
    return null;
  }

  const render = (value: string) =>
    act(async () => root.render(React.createElement(Probe, { value })));
  return { render, current, unmount: () => act(() => root.unmount()) };
}

afterEach(() => vi.useRealTimers());

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
});
