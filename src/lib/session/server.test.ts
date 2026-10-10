import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { assuranceFromVerified } from "@/lib/session/mfa";

import { SessionUnavailableError } from "@/lib/session/resolve";
import { isServiceUnavailable } from "@/lib/service-unavailable";

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
  claims: Answer;
} = {
  user: { data: { user: null }, error: null },
  profile: { data: null, error: null },
  memberships: { data: [], error: null },
  claims: { data: null, error: null },
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
      getClaims: async () => answers.claims,
      mfa: {
        // Lit l'utilisateur du cookie sans le vérifier, d'où
        // l'avertissement de Supabase : ne doit plus être appelée.
        getAuthenticatorAssuranceLevel: async () => {
          throw new Error("getAuthenticatorAssuranceLevel ne doit pas servir");
        },
      },
    },
    from: query,
  }),
}));
vi.mock("@/lib/demo/mode", () => ({ isDemoMode: () => false }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

const {
  getAuthState,
  getAvailableMemberships,
  passwordNeedsSecondFactor,
  tryGetAuthState,
} = await import("@/lib/session/server");

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
  answers.claims = { data: { claims: { aal: "aal1" } }, error: null };
});

/** Facteur TOTP vérifié, tel que `getUser()` le renvoie. */
const VERIFIED_FACTOR = { id: "f-1", factor_type: "totp", status: "verified" };

describe("double authentification : niveau tiré de données vérifiées", () => {
  it("rôle sensible au premier niveau : « mfa-required »", async () => {
    answers.memberships = {
      data: [row("m-a", true, "radiologist")],
      error: null,
    };
    expect(await getAuthState()).toBe("mfa-required");
  });

  it("rôle sensible, jeton vérifié au second niveau : session", async () => {
    answers.memberships = {
      data: [row("m-a", true, "radiologist")],
      error: null,
    };
    answers.user = {
      data: { user: { ...USER, factors: [VERIFIED_FACTOR] } },
      error: null,
    };
    answers.claims = { data: { claims: { aal: "aal2" } }, error: null };
    expect(typeof (await getAuthState())).toBe("object");
  });

  it("facteur activé, quel que soit le rôle : « mfa-required »", async () => {
    answers.user = {
      data: { user: { ...USER, factors: [VERIFIED_FACTOR] } },
      error: null,
    };
    expect(await getAuthState()).toBe("mfa-required");
  });

  it("facteur non vérifié : ne relève pas le niveau attendu", () => {
    // Tous les rôles exigent le second facteur : l'effet d'un facteur
    // inachevé se lit sur le niveau calculé, pas sur l'état de session.
    expect(assuranceFromVerified("aal1", [{ status: "unverified" }]).next).toBe(
      "aal1",
    );
    expect(assuranceFromVerified("aal1", [{ status: "verified" }]).next).toBe(
      "aal2",
    );
  });

  it("jeton non vérifiable : panne, pas un accès accordé", async () => {
    answers.claims = {
      data: null,
      error: new AuthApiError("jwks", 500, "unexpected_failure"),
    };
    await expect(getAuthState()).rejects.toBeInstanceOf(
      SessionUnavailableError,
    );
  });

  it("changement de mot de passe : second facteur exigé au premier niveau", async () => {
    answers.user = {
      data: { user: { ...USER, factors: [VERIFIED_FACTOR] } },
      error: null,
    };
    expect(await passwordNeedsSecondFactor()).toBe(true);
  });

  it("changement de mot de passe : exigé aussi quand le niveau est illisible", async () => {
    answers.claims = { data: null, error: null };
    expect(await passwordNeedsSecondFactor()).toBe(true);
  });

  it("changement de mot de passe : libre sans facteur activé", async () => {
    expect(await passwordNeedsSecondFactor()).toBe(false);
  });
});

describe("second facteur attendu : ni profil ni appartenances lus", () => {
  /** Toute lecture en base échoue : la base les refuse dans cet état. */
  function refuseReads() {
    const refused = { data: null, error: new Error("lecture refusée") };
    answers.profile = refused;
    answers.memberships = refused;
  }

  it("exigence du hook dans le jeton : « mfa-required » sans requête", async () => {
    refuseReads();
    answers.claims = {
      data: { claims: { aal: "aal1", mfa_required: true } },
      error: null,
    };
    expect(await getAuthState()).toBe("mfa-required");
    expect(await getAvailableMemberships()).toEqual([]);
  });

  it("facteur vérifié sans organisation active : « mfa-required », pas « no-membership »", async () => {
    refuseReads();
    answers.user = {
      data: { user: { ...USER, factors: [VERIFIED_FACTOR] } },
      error: null,
    };
    expect(await getAuthState()).toBe("mfa-required");
  });

  it("second facteur présenté : profil et appartenances relus", async () => {
    answers.user = {
      data: { user: { ...USER, factors: [VERIFIED_FACTOR] } },
      error: null,
    };
    answers.claims = {
      data: { claims: { aal: "aal2", mfa_required: false } },
      error: null,
    };
    const state = await getAuthState();
    expect(typeof state === "object" && state.active.id).toBe("m-a");
  });
});

describe("organisation active : la règle du hook de jeton", () => {
  // Session complète : le second facteur, exigé de tous, est présenté.
  beforeEach(() => {
    answers.user = {
      data: { user: { ...USER, factors: [VERIFIED_FACTOR] } },
      error: null,
    };
    answers.claims = {
      data: { claims: { aal: "aal2", mfa_required: false } },
      error: null,
    };
  });

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
      const failure = await getAuthState().catch((caught: unknown) => caught);
      expect(failure).toBeInstanceOf(SessionUnavailableError);
      // Marquée comme panne : l'écran d'erreur l'annonce comme telle.
      expect(isServiceUnavailable(failure)).toBe(true);
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
