import { describe, expect, it } from "vitest";

import {
  EMAIL_LINK_PASSWORD_WINDOW_SECONDS,
  openedByRecentEmailLink,
} from "@/lib/security/password-change";

const NOW = 1_800_000_000;

describe("openedByRecentEmailLink", () => {
  it.each(["otp", "recovery", "invite", "magiclink"])(
    "accepte une session ouverte à l'instant par un lien (%s)",
    (method) => {
      expect(
        openedByRecentEmailLink([{ method, timestamp: NOW - 30 }], NOW),
      ).toBe(true);
    },
  );

  it("accepte le lien même après la vérification du second facteur", () => {
    const amr = [
      { method: "totp", timestamp: NOW - 10 },
      { method: "otp", timestamp: NOW - 120 },
    ];
    expect(openedByRecentEmailLink(amr, NOW)).toBe(true);
  });

  it("refuse une session ouverte par mot de passe", () => {
    expect(
      openedByRecentEmailLink([{ method: "password", timestamp: NOW }], NOW),
    ).toBe(false);
    expect(
      openedByRecentEmailLink(
        [
          { method: "password", timestamp: NOW - 5 },
          { method: "totp", timestamp: NOW },
        ],
        NOW,
      ),
    ).toBe(false);
  });

  it("refuse un lien trop ancien", () => {
    const old = NOW - EMAIL_LINK_PASSWORD_WINDOW_SECONDS - 1;
    expect(
      openedByRecentEmailLink([{ method: "recovery", timestamp: old }], NOW),
    ).toBe(false);
  });

  it.each([
    ["absent", undefined],
    ["forme courte, sans date", ["otp"]],
    ["horodatage dans le futur", [{ method: "otp", timestamp: NOW + 3600 }]],
    ["horodatage illisible", [{ method: "otp", timestamp: "hier" }]],
  ])("refuse un claim %s", (_label, amr) => {
    expect(openedByRecentEmailLink(amr, NOW)).toBe(false);
  });
});
