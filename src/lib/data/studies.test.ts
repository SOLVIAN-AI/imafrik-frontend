import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Pagination et ordre des listes d'examens, côté interface.
 *
 * Le service fait foi pour l'ordre, les filtres et le total : ces tests
 * vérifient que l'interface les lui demande au lieu de les recalculer sur
 * une page tronquée, et que le jeu de démonstration se comporte comme lui.
 */

const demo = vi.hoisted(() => ({ enabled: false }));
const api = vi.hoisted(() => ({ paths: [] as string[], body: {} as unknown }));
const navigation = vi.hoisted(() => ({ redirects: [] as string[] }));

vi.mock("@/lib/demo/mode", () => ({ isDemoMode: () => demo.enabled }));
vi.mock("@/lib/session/server", () => ({ getSession: async () => null }));
vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    navigation.redirects.push(href);
    throw new Error("NEXT_REDIRECT");
  },
}));
vi.mock("@/lib/api/client", async () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string,
    ) {
      super(message);
    }
  }
  return {
    ApiError,
    apiFetch: vi.fn(),
    apiGet: async (
      path: string,
      schema: { parse: (v: unknown) => unknown },
    ) => {
      api.paths.push(path);
      // 422 : un curseur refusé, ou une requête invalide sans curseur.
      if (/cursor=refuse|q=invalide/.test(path))
        throw new ApiError(422, "refus");
      return schema.parse(api.body);
    },
  };
});

const { findNextStudyId, listStudyPage, listStudyPageAt } =
  await import("@/lib/data/studies");
const { ApiError } = await import("@/lib/api/client");
const { DEMO_STUDIES } = await import("@/lib/demo/studies");

/** Un examen tel que l'API le renvoie, réduit à l'essentiel. */
function apiStudy(id: string) {
  return {
    id,
    organization_id: "11111111-0000-4000-8000-000000000001",
    clinic_name: "Clinique",
    study_instance_uid: `1.2.${id.length}`,
    patient_name: "KOFFI^Ama",
    patient_id_local: "P1",
    patient_birthdate: null,
    patient_sex: "F",
    modality: "CT",
    body_part: null,
    study_date: null,
    instance_count: 1,
    series_count: 1,
    status: "received",
    priority: "routine",
    assigned_to: null,
    assigned_to_name: null,
    clinical_info: null,
    received_at: "2026-10-09T08:00:00Z",
    reported_at: null,
    reported_by_name: null,
    report_id: null,
    report_language: "fr",
    due_at: "2026-10-09T10:00:00Z",
  };
}

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "bbbbbbbb-0000-4000-8000-000000000002";

beforeEach(() => {
  demo.enabled = false;
  api.paths = [];
  api.body = { items: [], total: 0, next_cursor: null };
  navigation.redirects = [];
});

describe("listStudyPage, avec le service", () => {
  it("transmet filtres, ordre, priorité et curseur, et rend le curseur suivant", async () => {
    api.body = { items: [apiStudy(A)], total: 351, next_cursor: "c2" };
    const page = await listStudyPage({
      status: ["received", "in_progress"],
      priority: "urgent",
      order: "deadline",
      limit: 50,
      cursor: "c1",
    });
    const query = new URLSearchParams(api.paths[0].split("?")[1]);
    expect(query.getAll("status")).toEqual(["received", "in_progress"]);
    expect(query.get("priority")).toBe("urgent");
    expect(query.get("order")).toBe("deadline");
    expect(query.get("limit")).toBe("50");
    expect(query.get("cursor")).toBe("c1");
    expect(page.total).toBe(351);
    expect(page.nextCursor).toBe("c2");
  });

  it("ramène au début de la liste quand le service refuse le curseur", async () => {
    await expect(
      listStudyPageAt({ cursor: "refuse" }, "/examens"),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(navigation.redirects).toEqual(["/examens"]);
  });

  it("laisse passer un refus qui ne vient pas du curseur", async () => {
    await expect(
      listStudyPageAt({ search: "invalide" }, "/examens"),
    ).rejects.toBeInstanceOf(ApiError);
    expect(navigation.redirects).toEqual([]);
  });
});

describe("findNextStudyId", () => {
  it("demande au service la tête de la file, par échéance", async () => {
    api.body = {
      items: [apiStudy(A), apiStudy(B)],
      total: 412,
      next_cursor: "x",
    };
    expect(await findNextStudyId(B)).toBe(A);
    const query = new URLSearchParams(api.paths[0].split("?")[1]);
    expect(query.getAll("status")).toEqual(["received"]);
    expect(query.get("order")).toBe("deadline");
    expect(query.get("limit")).toBe("2");
  });

  it("saute l'examen ouvert quand il est en tête", async () => {
    api.body = {
      items: [apiStudy(A), apiStudy(B)],
      total: 2,
      next_cursor: null,
    };
    expect(await findNextStudyId(A)).toBe(B);
  });

  it("ne propose rien quand la file ne contient que l'examen ouvert", async () => {
    api.body = { items: [apiStudy(A)], total: 1, next_cursor: null };
    expect(await findNextStudyId(A)).toBeNull();
  });
});

describe("jeu de démonstration", () => {
  beforeEach(() => {
    demo.enabled = true;
  });

  it.each(["recent", "received", "deadline"] as const)(
    "se parcourt page par page dans l'ordre %s, total constant",
    async (order) => {
      const complete = await listStudyPage({ order, limit: 200 });
      expect(complete.total).toBe(DEMO_STUDIES.length);
      const seen: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await listStudyPage({ order, limit: 4, cursor });
        expect(page.total).toBe(DEMO_STUDIES.length);
        seen.push(...page.studies.map((study) => study.id));
        cursor = page.nextCursor ?? undefined;
      } while (cursor);
      expect(seen).toEqual(complete.studies.map((study) => study.id));
    },
  );

  it("ne met en tête que les urgences encore ouvertes", async () => {
    const { studies } = await listStudyPage({ order: "recent" });
    const firstClosed = studies.findIndex(
      (study) =>
        !(
          study.urgent &&
          ["received", "assigned", "in_progress"].includes(study.status)
        ),
    );
    expect(firstClosed).toBeGreaterThan(0);
    const rest = studies.slice(firstClosed);
    const times = rest.map((study) => study.receivedAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("refuse un curseur émis pour un autre ordre, comme le service", async () => {
    const { nextCursor } = await listStudyPage({ order: "recent", limit: 2 });
    await expect(
      listStudyPage({ order: "deadline", cursor: nextCursor ?? "" }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it("filtre la priorité avant de compter", async () => {
    const urgent = await listStudyPage({ priority: "urgent", limit: 1 });
    expect(urgent.total).toBe(DEMO_STUDIES.filter((s) => s.urgent).length);
    expect(urgent.studies.every((study) => study.urgent)).toBe(true);
  });
});
