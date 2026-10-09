import { describe, expect, it, vi } from "vitest";

import {
  isServiceUnavailable,
  markServiceUnavailable,
  SERVICE_UNAVAILABLE_DIGEST,
} from "@/lib/service-unavailable";

vi.mock("@/i18n/server", () => ({ getLocale: async () => "fr" }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => false }));
vi.mock("@/lib/api/config", () => ({
  API_URL: "https://api.imafrik.test",
  isApiConfigured: () => true,
}));

const { ApiError, apiFetch } = await import("@/lib/api/client");
const { SessionUnavailableError } = await import("@/lib/session/resolve");

/**
 * Panne du service : reconnue par l'écran d'erreur à partir du seul
 * `digest`, la seule propriété qu'une erreur d'un composant serveur
 * conserve en production.
 */
describe("panne du service", () => {
  it("se reconnaît au seul digest, comme dans le navigateur en production", () => {
    // Ce que reçoit `error.tsx` en production : une erreur neuve, sans
    // nom ni message d'origine, mais avec le digest transmis par Next.js.
    const received = Object.assign(new Error("masqué"), {
      digest: SERVICE_UNAVAILABLE_DIGEST,
    });
    expect(isServiceUnavailable(received)).toBe(true);
  });

  it("ne confond pas un défaut de l'application avec une panne", () => {
    expect(isServiceUnavailable(new Error("boom"))).toBe(false);
    expect(
      isServiceUnavailable(
        Object.assign(new Error(), { digest: "1896011609" }),
      ),
    ).toBe(false);
    expect(isServiceUnavailable(null)).toBe(false);
    expect(isServiceUnavailable("IMAFRIK_SERVICE_UNAVAILABLE")).toBe(false);
  });

  it("ne reprend aucun préfixe réservé par Next.js", () => {
    for (const reserved of [
      "NEXT_",
      "BAILOUT_TO_CLIENT_SIDE_RENDERING",
      "DYNAMIC_SERVER_USAGE",
      "HANGING_PROMISE_REJECTION",
    ]) {
      expect(SERVICE_UNAVAILABLE_DIGEST.startsWith(reserved)).toBe(false);
    }
  });

  it("marque l'erreur sur place", () => {
    const error = new Error("injoignable");
    expect(markServiceUnavailable(error)).toBe(error);
    expect(isServiceUnavailable(error)).toBe(true);
  });

  it.each([503, 504])("API en %i : panne", (status) => {
    expect(isServiceUnavailable(new ApiError(status, "…"))).toBe(true);
  });

  it.each([400, 401, 403, 404, 409, 422, 429, 500, 502])(
    "API en %i : pas une panne, l'écran garde sa référence",
    (status) => {
      expect(isServiceUnavailable(new ApiError(status, "…"))).toBe(false);
    },
  );

  it("session irrésoluble (authentification ou base) : panne", () => {
    expect(isServiceUnavailable(new SessionUnavailableError("auth"))).toBe(
      true,
    );
  });

  it("API injoignable (erreur réseau) : panne, avec un message lisible", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    try {
      const failure = await apiFetch("/me").catch((caught: unknown) => caught);
      expect(failure).toBeInstanceOf(ApiError);
      expect((failure as InstanceType<typeof ApiError>).status).toBe(503);
      expect(isServiceUnavailable(failure)).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("API en 503 : panne", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 503 })),
    );
    try {
      const failure = await apiFetch("/me").catch((caught: unknown) => caught);
      expect(isServiceUnavailable(failure)).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
