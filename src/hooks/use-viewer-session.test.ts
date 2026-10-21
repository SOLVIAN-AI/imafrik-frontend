// @vitest-environment happy-dom
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  RENEW_AT_MOST_EVERY_MS,
  RENEW_EVERY_MS,
  type ViewerSession,
  useViewerSession,
  viewerToken,
} from "@/hooks/use-viewer-session";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const URL_A =
  "https://viewer.test/viewer?StudyInstanceUIDs=1.2&token=jeton-aaaaaaaaaaaaaaaa";
const URL_B =
  "https://viewer.test/viewer?StudyInstanceUIDs=1.2&token=jeton-bbbbbbbbbbbbbbbb";

type Hook = ReturnType<typeof useViewerSession>;

/** Monte le hook et expose son dernier résultat. */
function mount(session: ViewerSession) {
  const container = document.createElement("div");
  const root: Root = createRoot(container);
  const current: { hook?: Hook } = {};

  function Probe({ url }: { url: string | null }) {
    current.hook = useViewerSession(url, session);
    return null;
  }

  const render = (url: string | null) =>
    act(async () => root.render(React.createElement(Probe, { url })));
  return { render, current, unmount: () => act(() => root.unmount()) };
}

/** Avance l'horloge et laisse s'achever les promesses qui en dépendent. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("viewerToken", () => {
  it("lit le jeton de l'adresse, ou rien", () => {
    expect(viewerToken(URL_A)).toBe("jeton-aaaaaaaaaaaaaaaa");
    expect(viewerToken(null)).toBeNull();
    expect(viewerToken("pas une adresse")).toBeNull();
    expect(viewerToken("https://viewer.test/viewer")).toBeNull();
  });
});

describe("useViewerSession", () => {
  it("prolonge le jeton toutes les cinq minutes, sans toucher au viewer", async () => {
    const renew = vi.fn(async () => ({
      ok: true as const,
      data: { expiresIn: 900 },
    }));
    const reopen = vi.fn();
    const probe = mount({ renew, reopen });
    await probe.render(URL_A);

    await advance(RENEW_EVERY_MS - 1);
    expect(renew).not.toHaveBeenCalled();
    await advance(1);
    expect(renew).toHaveBeenCalledWith("jeton-aaaaaaaaaaaaaaaa");
    await advance(RENEW_EVERY_MS);
    expect(renew).toHaveBeenCalledTimes(2);
    expect(reopen).not.toHaveBeenCalled();
    expect(probe.current.hook).toEqual({ url: URL_A, reopened: null });
    await probe.unmount();
  });

  it("rouvre le viewer quand le jeton n'existe plus", async () => {
    const renew = vi.fn(async () => ({
      ok: false as const,
      error: "Jeton expiré",
      status: 404,
    }));
    const reopen = vi.fn(async () => ({ ok: true as const, data: URL_B }));
    const probe = mount({ renew, reopen });
    await probe.render(URL_A);

    await advance(RENEW_EVERY_MS);
    expect(reopen).toHaveBeenCalledTimes(1);
    expect(probe.current.hook).toEqual({ url: URL_B, reopened: "ok" });

    // Le jeton neuf est celui qu'on prolonge ensuite.
    renew.mockResolvedValue({
      ok: true as const,
      data: { expiresIn: 900 },
    } as never);
    await advance(RENEW_EVERY_MS);
    expect(renew).toHaveBeenLastCalledWith("jeton-bbbbbbbbbbbbbbbb");
    await probe.unmount();
  });

  it("signale une réouverture impossible, sans changer d'adresse", async () => {
    const probe = mount({
      renew: async () => ({ ok: false, error: "Expiré", status: 404 }),
      reopen: async () => ({ ok: false, error: "Refusé", status: 503 }),
    });
    await probe.render(URL_A);
    await advance(RENEW_EVERY_MS);
    expect(probe.current.hook).toEqual({ url: URL_A, reopened: "failed" });
    await probe.unmount();
  });

  it("ne rouvre rien sur une panne passagère, et réessaie ensuite", async () => {
    const renew = vi
      .fn<ViewerSession["renew"]>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({ ok: false, error: "Indisponible", status: 503 })
      .mockResolvedValue({ ok: true, data: { expiresIn: 900 } });
    const reopen = vi.fn();
    const probe = mount({ renew, reopen });
    await probe.render(URL_A);

    await advance(RENEW_EVERY_MS * 3);
    expect(renew).toHaveBeenCalledTimes(3);
    expect(reopen).not.toHaveBeenCalled();
    expect(probe.current.hook?.url).toBe(URL_A);
    await probe.unmount();
  });

  it("prolonge au retour du réseau, au plus une fois par minute", async () => {
    const renew = vi.fn(async () => ({
      ok: true as const,
      data: { expiresIn: 900 },
    }));
    const probe = mount({ renew, reopen: vi.fn() });
    await probe.render(URL_A);

    await act(async () => window.dispatchEvent(new Event("online")));
    expect(renew).not.toHaveBeenCalled();

    await advance(RENEW_AT_MOST_EVERY_MS);
    await act(async () => window.dispatchEvent(new Event("online")));
    await act(async () => window.dispatchEvent(new Event("online")));
    expect(renew).toHaveBeenCalledTimes(1);
    await probe.unmount();
  });

  it("s'arrête quand l'examen se ferme ou sans viewer", async () => {
    const renew = vi.fn(async () => ({
      ok: true as const,
      data: { expiresIn: 900 },
    }));
    const probe = mount({ renew, reopen: vi.fn() });
    await probe.render(null);
    await advance(RENEW_EVERY_MS);
    expect(renew).not.toHaveBeenCalled();

    await probe.render(URL_A);
    await probe.unmount();
    await advance(RENEW_EVERY_MS * 2);
    expect(renew).not.toHaveBeenCalled();
  });

  it("reprend l'adresse d'un autre examen", async () => {
    const probe = mount({
      renew: async () => ({ ok: true, data: { expiresIn: 900 } }),
      reopen: vi.fn(),
    });
    await probe.render(URL_A);
    await probe.render(URL_B);
    expect(probe.current.hook).toEqual({ url: URL_B, reopened: null });
    await probe.unmount();
  });
});
