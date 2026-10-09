import { afterEach, describe, expect, it, vi } from "vitest";

import { messagesFor } from "@/i18n";
import { sendFile } from "@/lib/upload";

/**
 * Requête simulée : retient les en-têtes posés et répond ce qu'on lui dit.
 * Le service choisit la langue de ses refus d'après `Accept-Language`.
 */
class FakeRequest {
  static last: FakeRequest | null = null;
  static reply = { status: 422, body: "" };
  headers: Record<string, string> = {};
  upload = { onprogress: null as unknown };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  status = 0;
  responseText = "";

  constructor() {
    FakeRequest.last = this;
  }
  open() {}
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  send() {
    this.status = FakeRequest.reply.status;
    this.responseText = FakeRequest.reply.body;
    queueMicrotask(() => this.onload?.());
  }
}

const grant = {
  endpoint: "https://api.test/uploads",
  token: "jeton",
  expiresIn: 600,
};
const file = new File(["x"], "coupe.dcm");

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendFile", () => {
  it.each(["fr", "en"] as const)(
    "demande les refus du service dans la langue des réglages (%s)",
    async (locale) => {
      vi.stubGlobal("XMLHttpRequest", FakeRequest);
      FakeRequest.reply = {
        status: 422,
        body: JSON.stringify({ detail: "refus du service" }),
      };
      const state = await sendFile(
        grant,
        file,
        () => undefined,
        messagesFor(locale).clinic.uploader,
        locale,
      );
      expect(FakeRequest.last?.headers["Accept-Language"]).toBe(locale);
      expect(FakeRequest.last?.headers["X-Upload-Token"]).toBe("jeton");
      expect(state).toEqual({ kind: "failed", reason: "refus du service" });
    },
  );

  it("rend l'état annoncé par le service quand le fichier est reçu", async () => {
    vi.stubGlobal("XMLHttpRequest", FakeRequest);
    FakeRequest.reply = {
      status: 201,
      body: JSON.stringify({ status: "stored" }),
    };
    const state = await sendFile(
      grant,
      file,
      () => undefined,
      messagesFor("en").clinic.uploader,
      "en",
    );
    expect(state).toEqual({ kind: "stored" });
  });
});
