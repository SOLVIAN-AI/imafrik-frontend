// @vitest-environment happy-dom
import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Le viewer survit à la prise en charge et à la signature.
 *
 * Retour d'un radiologue, octobre 2026 : il faisait défiler un scanner,
 * prenait l'examen en charge, et se retrouvait sur une autre série, à la
 * première coupe. L'écran entier était recréé au changement de brouillon,
 * viewer compris, et chaque rafraîchissement lui donnait une nouvelle
 * adresse. Ces tests montent l'écran de lecture avec un viewer et un
 * éditeur factices, qui comptent leurs montages.
 */

const mounts = { viewer: 0, editor: 0 };

vi.mock("@/components/editor/viewer-pane", () => ({
  ViewerPane: ({ viewerUrl }: { viewerUrl: string | null }) => {
    useEffect(() => {
      mounts.viewer += 1;
    }, []);
    // Un élément inerte : un vrai cadre irait charger son adresse.
    return createElement("div", { "data-viewer-src": viewerUrl ?? "" });
  },
}));

vi.mock("@/components/editor/report-editor", () => ({
  ReportEditor: () => {
    useEffect(() => {
      mounts.editor += 1;
    }, []);
    return createElement("div", { "data-testid": "editor" });
  },
}));

vi.mock("@/components/editor/sign-report-dialog", () => ({
  SignReportDialog: () => null,
}));
vi.mock("@/components/editor/template-tools", () => ({
  SaveAsTemplate: () => null,
  TemplatePicker: () => null,
}));
vi.mock("@/components/editor/use-ai-review", () => ({
  useAiReview: () => ({ status: "idle", stale: false, run: () => {} }),
}));
vi.mock("@/lib/actions/reading", () => ({
  claimStudy: vi.fn(),
  readDraftVersion: vi.fn(),
  releaseStudy: vi.fn(),
  saveReportDraft: vi.fn(),
  signReport: vi.fn(),
}));
vi.mock("@/hooks/use-media-query", () => ({ useMediaQuery: () => true }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
  usePathname: () => "/lecture/1",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("react-resizable-panels", async () => {
  const { createElement: h } = await import("react");
  const box = ({ children }: { children?: unknown }) =>
    h("div", null, children as never);
  return {
    Group: box,
    Panel: box,
    Separator: () => null,
    useGroupRef: () => ({ current: null }),
  };
});
vi.mock("@/components/providers/session-provider", async () => {
  const { demoSession } = await import("@/lib/session/demo");
  const session = demoSession("m-radio");
  return { useSession: () => session };
});
vi.mock("@/i18n/client", async () => {
  const { messagesFor } = await import("@/i18n");
  return { useMessages: () => messagesFor("fr"), useLocale: () => "fr" };
});

const { ReadingWorkspace } =
  await import("@/components/editor/report-workspace");
const { DEMO_STUDIES } = await import("@/lib/demo/studies");
const { EMPTY_REPORT_SECTIONS } = await import("@/components/editor/sections");

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  mounts.viewer = 0;
  mounts.editor = 0;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** L'écran de lecture, dans un état donné du brouillon. */
function render(draftKey: string, viewerUrl: string | null, mode: object) {
  act(() =>
    root.render(
      createElement(ReadingWorkspace, {
        study: DEMO_STUDIES[0],
        viewerUrl,
        draftKey,
        mode: mode as never,
        initial: EMPTY_REPORT_SECTIONS,
        signed: false,
        signerName: "Dr Adjo Kponton",
      }),
    ),
  );
}

describe("écran de lecture", () => {
  it("garde le viewer et son adresse quand le brouillon change", () => {
    render("none:", "https://viewer.test/?token=1", { kind: "claimable" });
    expect(mounts.viewer).toBe(1);
    expect(mounts.editor).toBe(1);

    // Prise en charge : un brouillon apparaît, la page se rafraîchit et le
    // service émet un nouveau jeton.
    render("r1:draft", "https://viewer.test/?token=2", {
      kind: "author",
      reportId: "r1",
      version: 1,
      backupKey: null,
    });
    expect(mounts.editor).toBe(2);
    expect(mounts.viewer).toBe(1);
    expect(
      container
        .querySelector("[data-viewer-src]")
        ?.getAttribute("data-viewer-src"),
    ).toBe("https://viewer.test/?token=1");
  });

  it("prend une adresse quand le viewer n’était pas joignable", () => {
    render("none:", null, { kind: "claimable" });
    render("none:", "https://viewer.test/?token=3", { kind: "claimable" });
    expect(
      container
        .querySelector("[data-viewer-src]")
        ?.getAttribute("data-viewer-src"),
    ).toBe("https://viewer.test/?token=3");
  });

  it("affiche la barre d’actions et le compte-rendu dans le cadre", () => {
    render("none:", "https://viewer.test/?token=1", { kind: "claimable" });
    expect(container.querySelector("header")).not.toBeNull();
    expect(container.querySelector('[data-testid="editor"]')).not.toBeNull();
  });
});
