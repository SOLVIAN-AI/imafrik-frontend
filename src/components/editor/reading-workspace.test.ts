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
// Le bouton d'aide suppose le moteur des visites, posé par la disposition.
vi.mock("@/components/tour/help-menu", () => ({ HelpMenu: () => null }));
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
/** Largeur simulée : côte à côte (ordinateur) ou en onglets (téléphone). */
const screen = { wide: true };
vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => screen.wide,
}));
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
const { messagesFor } = await import("@/i18n");

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  screen.wide = true;
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
function render(
  draftKey: string,
  viewerUrl: string | null,
  mode: object,
  extra: Record<string, unknown> = {},
) {
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
        ...extra,
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

  it("sur téléphone, l’onglet du compte-rendu garde le viewer en place", () => {
    screen.wide = false;
    render("none:", "https://viewer.test/?token=1", { kind: "claimable" });
    const images = () => container.querySelector("#pane-images");
    const tab = (id: string) =>
      container.querySelector<HTMLButtonElement>(`#tab-${id}`)!;

    act(() => tab("report").click());
    // Masqué, mais pas retiré de la mise en page : à `display: none`, le
    // viewer recalculait ses volets sur une largeur nulle et revenait
    // décalé (signalé le 15 octobre 2026).
    expect(images()?.className).toContain("invisible");
    expect(images()?.className).not.toMatch(/\bhidden\b/);

    act(() => tab("images").click());
    expect(images()?.className).not.toContain("invisible");
    expect(mounts.viewer).toBe(1);
  });
});

describe("écran de lecture, en mode formation", () => {
  const labels = messagesFor("fr").training;

  function adapter(overrides: Record<string, unknown> = {}) {
    return {
      save: vi.fn(),
      readVersion: vi.fn(),
      sign: vi.fn(),
      claim: vi.fn(async () => ({ ok: true, data: undefined })),
      release: vi.fn(),
      homeHref: "/formation",
      title: "Scanner thoracique",
      notice: labels.workspace.notice,
      labels: labels.workspace,
      signLabels: labels.sign,
      ...overrides,
    };
  }

  it("annonce l'exercice et le titre du cas, jamais un patient ni une échéance", () => {
    render("none:", null, { kind: "claimable" }, { adapter: adapter() });
    const text = container.textContent ?? "";
    expect(text).toContain(labels.workspace.notice);
    expect(container.querySelector("h1")?.textContent).toBe(
      "Scanner thoracique",
    );
    expect(container.querySelector("time")).toBeNull();
    expect(container.querySelector("a[aria-label]")?.getAttribute("href")).toBe(
      "/formation",
    );
  });

  it("prend l'exercice en charge par l'adaptateur, jamais par l'examen", async () => {
    const actions = await import("@/lib/actions/reading");
    const exercise = adapter();
    render("none:", null, { kind: "claimable" }, { adapter: exercise });
    const claim = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === labels.workspace.claim,
    );
    expect(claim).toBeDefined();
    await act(async () => claim!.click());
    expect(exercise.claim).toHaveBeenCalledTimes(1);
    expect(actions.claimStudy).not.toHaveBeenCalled();
  });

  it("une fois signé, propose les gestes de l'exercice à la place de ceux du compte-rendu", () => {
    render(
      "a1:signed",
      null,
      { kind: "readonly" },
      {
        signed: true,
        adapter: adapter({
          signedActions: createElement(
            "button",
            { type: "button" },
            "PDF spécimen",
          ),
          footer: createElement("section", { "data-testid": "afterword" }),
        }),
      },
    );
    const text = container.textContent ?? "";
    expect(text).toContain("PDF spécimen");
    expect(text).toContain(labels.workspace.signedBanner);
    expect(container.querySelector('[data-testid="afterword"]')).not.toBeNull();
  });
});
