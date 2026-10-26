import { afterEach, describe, expect, it, vi } from "vitest";

const captureException = vi.hoisted(() => vi.fn());
vi.mock("@sentry/browser", () => ({ captureException }));

import { reportScreenError } from "@/lib/monitoring/report-error";

afterEach(() => vi.clearAllMocks());

describe("reportScreenError", () => {
  it("signale une erreur née dans le navigateur", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("rendu impossible");
    await reportScreenError(error);
    expect(captureException).toHaveBeenCalledWith(error);
  });

  it("ne signale pas deux fois une erreur serveur, déjà rapportée avec son digest", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    await reportScreenError(
      Object.assign(new Error("…"), { digest: "2817409352" }),
    );
    expect(captureException).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("[imafrik]", "2817409352");
  });
});
