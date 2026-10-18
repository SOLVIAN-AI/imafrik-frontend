import type { ErrorEvent } from "@sentry/browser";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  errorTrackingOptions,
  sanitizeUrl,
  scrubEvent,
  sentryDsn,
  sentryOrigin,
} from "@/lib/monitoring/error-tracking";

const EU_DSN = "https://abc123@o451.ingest.de.sentry.io/4510000000000001";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** Rapport tel que le SDK le prépare, chargé de tout ce qui ne doit pas partir. */
function loadedEvent(): ErrorEvent {
  return {
    type: undefined,
    message: "Échec pour ama.koffi@clinique.tg",
    request: {
      method: "GET",
      url: "https://imafrik.tech/worklist?q=KLOUVI#access_token=xyz",
      query_string: "q=KLOUVI",
      cookies: { "sb-access-token": "secret" },
      data: { sections: { conclusion: "RAS" } },
      headers: {
        Cookie: "sb-access-token=secret",
        Authorization: "Bearer secret",
        Referer: "https://imafrik.tech/worklist?q=KLOUVI",
        "User-Agent": "Mozilla/5.0",
      },
    },
    user: { id: "u1", email: "ama.koffi@clinique.tg", ip_address: "1.2.3.4" },
    breadcrumbs: [{ message: "clic sur KLOUVI GRACE" }],
    extra: { patient: "KLOUVI GRACE" },
    transaction: "/verifier/tok_secret_123",
    tags: { url: "https://imafrik.tech/en/verify/tok_secret_123?x=1" },
    contexts: { nextjs: { request_path: "/worklist?q=KLOUVI" } },
    exception: {
      values: [
        {
          type: "Error",
          value: "Key (patient_id)=(TG-0042) déjà pris par a@b.tg",
          stacktrace: {
            frames: [
              {
                function: "render",
                abs_path: "https://imafrik.tech/lecture/abc?q=KLOUVI",
                vars: { patient: "KLOUVI GRACE" },
              },
            ],
          },
        },
      ],
    },
    logentry: { message: "Patient %s", params: ["KLOUVI GRACE"] },
  };
}

describe("sentryDsn", () => {
  it("reste éteint sans DSN", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    expect(sentryDsn()).toBeNull();
    expect(errorTrackingOptions()).toBeNull();
  });

  it("accepte une organisation de la région européenne", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", EU_DSN);
    expect(sentryDsn()).toBe(EU_DSN);
    expect(sentryOrigin()).toBe("https://o451.ingest.de.sentry.io");
  });

  it("refuse une organisation hors de l'Union européenne, ou une adresse invalide", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const dsn of [
      "https://abc@o451.ingest.us.sentry.io/1",
      "https://abc@o451.ingest.sentry.io/1",
      "http://abc@o451.ingest.de.sentry.io/1",
      "https://abc@de.sentry.io.attaquant.example/1",
      "pas une adresse",
    ]) {
      vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", dsn);
      expect(sentryDsn(), dsn).toBeNull();
      expect(sentryOrigin(), dsn).toBeNull();
    }
    // Un seul avertissement, et sans la valeur du DSN.
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).not.toContain("abc@");
  });
});

describe("errorTrackingOptions", () => {
  it("n'active ni données personnelles, ni fil d'Ariane, ni mesure de performance", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", EU_DSN);
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
    const options = errorTrackingOptions();
    expect(options).toMatchObject({
      dsn: EU_DSN,
      environment: "production",
      sendDefaultPii: false,
      maxBreadcrumbs: 0,
      tracesSampleRate: 0,
      includeLocalVariables: false,
    });
    expect(options?.beforeSendTransaction()).toBeNull();
  });
});

describe("sanitizeUrl", () => {
  it("retire la recherche et le fragment, masque les jetons de vérification", () => {
    expect(sanitizeUrl("https://imafrik.tech/worklist?q=KLOUVI&p=2")).toBe(
      "https://imafrik.tech/worklist",
    );
    expect(sanitizeUrl("/nouveau-mot-de-passe#access_token=abc")).toBe(
      "/nouveau-mot-de-passe",
    );
    expect(sanitizeUrl("GET /verifier/tok_123")).toBe("GET /verifier/[token]");
    expect(sanitizeUrl("https://imafrik.tech/en/verify/tok_123?x=1")).toBe(
      "https://imafrik.tech/en/verify/[token]",
    );
  });

  it("garde les identifiants opaques, utiles au diagnostic", () => {
    const path = "/lecture/3a226030-543c-488d-8853-7e585466dc0b";
    expect(sanitizeUrl(path)).toBe(path);
  });
});

describe("scrubEvent", () => {
  it("ne laisse partir aucune donnée de patient ni de session", () => {
    const event = scrubEvent(loadedEvent());
    expect(event.request).toEqual({
      method: "GET",
      url: "https://imafrik.tech/worklist",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    expect(event.user).toBeUndefined();
    expect(event.breadcrumbs).toBeUndefined();
    expect(event.extra).toBeUndefined();
    expect(event.transaction).toBe("/verifier/[token]");
    expect(event.tags?.url).toBe("https://imafrik.tech/en/verify/[token]");
    expect(event.contexts?.nextjs?.request_path).toBe("/worklist");
    expect(event.message).toBe("Échec pour <adresse>");
    expect(event.logentry).toEqual({ message: "Patient %s" });

    const exception = event.exception?.values?.[0];
    expect(exception?.value).toBe(
      "Key (patient_id)=(…) déjà pris par <adresse>",
    );
    expect(exception?.stacktrace?.frames?.[0]).toEqual({
      function: "render",
      abs_path: "https://imafrik.tech/lecture/abc",
    });

    const sent = JSON.stringify(event);
    for (const leak of ["KLOUVI", "TG-0042", "secret", "koffi", "tok_secret"]) {
      expect(sent, leak).not.toContain(leak);
    }
  });

  it("étiquette le digest d'une erreur serveur, pour le support", () => {
    const error = Object.assign(new Error("boom"), { digest: "2817409352" });
    const event = scrubEvent(loadedEvent(), { originalException: error });
    expect(event.tags?.digest).toBe("2817409352");
  });

  it("laisse intact un rapport sans requête ni exception", () => {
    const event = scrubEvent({ type: undefined, message: "ok" });
    expect(event).toEqual({ type: undefined, message: "ok" });
  });
});
