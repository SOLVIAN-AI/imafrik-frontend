import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionUnavailableError } from "@/lib/session/resolve";

/**
 * Résolution de la session contre un client Supabase simulé.
 *
 * Deux propriétés, dont l'absence produisait des boucles de redirection :
 * l'organisation active est celle du hook de jeton, sans repli ; une panne
 * n'est jamais lue comme « déconnecté » ou « sans organisation ».
 */

interface Answer {
  data: unknown;
  error: unknown;
}

const answers: {
  user: Answer;
  profile: Answer;
  memberships: Answer;
  aal: Answer;
} = {
  user: { data: { user: null }, error: null },
  profile: { data: null, error: null },
  memberships: { data: [], error: null },
  aal: { data: null, error: null },
};

/** Constructeur de requête minimal : `select().eq()` puis la terminaison. */
function query(table: string) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => answers.profile,
    overrideTypes: async () => answers.memberships,
  };
  if (table !== "profiles" && table !== "memberships")
    throw new Error(`table inattendue : ${table}`);
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => answers.user,
      mfa: { getAuthenticatorAssuranceLevel: async () => answers.aal },
    },
    from: query,
  }),
}));
vi.mock("@/lib/demo/mode", () => ({ isDemoMode: () => false }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

const { getAuthState, getAvailableMemberships, tryGetAuthState } =
  await import("@/lib/session/server");

const USER = { id: "u-1", email: "carla@groupe-r.tg" };

/** Ligne d'appartenance, telle que PostgREST la renvoie. */
function row(id: string, orgActive: boolean, role = "clinic_staff") {
  return {
    id,
    role,
    organizations: {
      id: `org-${id}`,
      name: `Organisation ${id}`,
      kind: "clinic",
      city: "Lomé",
      report_language: "fr",
      is_active: orgActive,
    },
  };
}

function profile(activeMembershipId: string | null) {
  return {
    full_name: "Carla",
    title: null,
    license_number: null,
    credentials_verified_at: null,
    active_membership_id: activeMembershipId,
    locale: "fr",
  };
}

beforeEach(() => {
  answers.user = { data: { user: USER }, error: null };
  answers.profile = { data: profile("m-a"), error: null };
  answers.memberships = {
    data: [row("m-a", true), row("m-b", true)],
    error: null,
  };
  answers.aal = {
    data: { currentLevel: "aal1", nextLevel: "aal1" },
    error: null,
  };
});

describe("organisation active : la règle du hook de jeton", () => {
  it("retient l'appartenance désignée par le profil", async () => {
    answers.profile = { data: profile("m-b"), error: null };
    const state = await getAuthState();
    expect(typeof state).toBe("object");
    if (typeof state === "string") return;
    expect(state.active.id).toBe("m-b");
  });

  it("organisation active suspendue : aucun repli sur une autre", async () => {
    // m-a est l'appartenance active, mais sa clinique est suspendue : le
    // hook émet un jeton sans rôle. Se replier sur m-b produisait la boucle
    // /worklist → /en-attente → /worklist.
    answers.memberships = {
      data: [row("m-a", false), row("m-b", true)],
      error: null,
    };
    expect(await getAuthState()).toBe("no-membership");
    // L'écran d'attente propose alors l'autre organisation.
    const available = await getAvailableMemberships();
    expect(available.map((membership) => membership.id)).toEqual(["m-b"]);
  });

  it("sans appartenance active désignée : « no-membership »", async () => {
    answers.profile = { data: profile(null), error: null };
    expect(await getAuthState()).toBe("no-membership");
  });
});

describe("une panne n'est pas une absence", () => {
  it.each([
    ["réseau", new AuthRetryableFetchError("fetch failed", 0)],
    ["erreur serveur", new AuthApiError("boom", 500, "unexpected_failure")],
    [
      "limite de débit",
      new AuthApiError("slow down", 429, "over_request_rate_limit"),
    ],
  ])(
    "service d'authentification en %s : erreur, pas « anonymous »",
    async (_label, error) => {
      answers.user = { data: { user: null }, error };
      await expect(getAuthState()).rejects.toBeInstanceOf(
        SessionUnavailableError,
      );
      expect(await tryGetAuthState()).toBe("unavailable");
    },
  );

  it.each([
    ["sans session", new AuthSessionMissingError()],
    ["jeton refusé", new AuthApiError("bad jwt", 403, "bad_jwt")],
  ])("%s : « anonymous »", async (_label, error) => {
    answers.user = { data: { user: null }, error };
    expect(await getAuthState()).toBe("anonymous");
  });

  it("appartenances illisibles : erreur, pas « no-membership »", async () => {
    answers.memberships = { data: null, error: { message: "timeout" } };
    await expect(getAuthState()).rejects.toBeInstanceOf(
      SessionUnavailableError,
    );
  });

  it("profil illisible : erreur", async () => {
    answers.profile = { data: null, error: { message: "timeout" } };
    await expect(getAuthState()).rejects.toBeInstanceOf(
      SessionUnavailableError,
    );
  });
});
