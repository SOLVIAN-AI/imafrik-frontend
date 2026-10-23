// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Habilitation d'un résident : une date de fin à moins d'un mois se
 * confirme avant d'habiliter.
 *
 * Le 17 octobre 2026, une attestation déposée « jusqu'au 18/10/2026 » a
 * été acceptée telle quelle, et l'accès du résident s'est fermé deux
 * jours plus tard. La fenêtre d'examen, montée avec ses actions serveur
 * simulées, n'accepte plus une telle date sans confirmation.
 */

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const documents = vi.hoisted(() => ({ validUntil: "" }));
const decideCredentials = vi.hoisted(() =>
  vi.fn(async () => ({ ok: true as const, data: undefined })),
);

vi.mock("@/lib/actions/control", () => ({
  decideCredentials,
  viewCredentialDocument: vi.fn(),
  loadCredentialDocuments: vi.fn(async () => ({
    ok: true as const,
    data: [
      {
        id: "doc-1",
        kind: "enrollment_certificate",
        fileName: "attestation.jpg",
        contentType: "image/jpeg",
        sizeBytes: 2_235_664,
        validUntil: documents.validUntil,
        status: "pending",
        rejectionReason: null,
        uploadedAt: new Date(),
        reviewedAt: null,
      },
    ],
  })),
}));
vi.mock("@/i18n/client", async () => {
  const { messagesFor } = await import("@/i18n");
  return { useMessages: () => messagesFor("fr"), useLocale: () => "fr" };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { CredentialReview } =
  await import("@/components/admin/credentials-actions");

/** Une date `AAAA-MM-JJ`, à tant de jours d'aujourd'hui. */
function inDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  document.body.innerHTML = "";
  decideCredentials.mockClear();
});

/** Ouvre la fenêtre d'examen d'un résident dont l'attestation finit à la date donnée. */
async function open(validUntil: string) {
  documents.validUntil = validUntil;
  await act(async () =>
    root.render(
      createElement(CredentialReview, {
        profileId: "p-1",
        fullName: "Dr Mohamed El-Moumine",
        licenseNumber: "10300",
        practiceStatus: "resident",
      }),
    ),
  );
  const trigger = [...document.querySelectorAll("button")].find(
    (button) => button.textContent === "Examiner le dossier",
  )!;
  await act(async () => {
    trigger.click();
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

const accept = () =>
  [...document.querySelectorAll("button")].find(
    (button) => button.textContent === "Accepter et habiliter",
  )!;
const confirmation = () =>
  [...document.querySelectorAll("label")].find(
    (label) =>
      label.textContent === "J’ai vérifié cette date sur l’attestation",
  );

describe("date de fin d'une attestation, à l'habilitation", () => {
  it("une fin au lendemain avertit, et attend la confirmation", async () => {
    await open(inDays(1));
    expect(document.body.textContent).toContain(
      "L’accès se fermerait dans 2 jours",
    );
    expect(accept().disabled).toBe(true);

    await act(async () => confirmation()!.querySelector("input")!.click());
    expect(accept().disabled).toBe(false);
  });

  it("une fin à un an n'avertit pas", async () => {
    await open(inDays(365));
    expect(document.body.textContent).not.toContain("L’accès se fermerait");
    expect(confirmation()).toBeUndefined();
    expect(accept().disabled).toBe(false);
  });

  it("corriger la date relance la confirmation", async () => {
    await open(inDays(1));
    await act(async () => confirmation()!.querySelector("input")!.click());
    expect(accept().disabled).toBe(false);

    const input =
      document.querySelector<HTMLInputElement>('input[type="date"]')!;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!;
    await act(async () => {
      setter.call(input, inDays(3));
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(document.body.textContent).toContain(
      "L’accès se fermerait dans 4 jours",
    );
    expect(accept().disabled).toBe(true);
  });
});
