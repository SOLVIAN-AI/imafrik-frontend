import { beforeEach, describe, expect, it, vi } from "vitest";

import { messagesFor } from "@/i18n";

/**
 * Changement de mot de passe : la preuve exigée sur chacun des deux
 * chemins (paramètres, lien reçu par courriel). Les clients Supabase sont
 * simulés.
 */

const t = messagesFor("fr");
const NEW_PASSWORD = "Nouveau-mot-de-passe-1";

const session = {
  getUser: vi.fn(),
  getClaims: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
};
const probe = {
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: session }),
}));
vi.mock("@supabase/supabase-js", async (original) => ({
  ...(await original<typeof import("@supabase/supabase-js")>()),
  createClient: () => ({ auth: probe }),
}));
vi.mock("@/lib/supabase/env", () => ({
  supabaseEnv: () => ({ url: "https://projet.test", anonKey: "cle" }),
}));
vi.mock("@/i18n/server", () => ({
  getMessages: async () => ({ t, locale: "fr" }),
}));
vi.mock("@/lib/session/server", () => ({
  passwordNeedsSecondFactor: async () => false,
}));
vi.mock("@/lib/demo/mode", () => ({ isDemoMode: () => false }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

const { changePassword, setPasswordFromLink } =
  await import("@/lib/actions/profile");

const now = () => Math.floor(Date.now() / 1000);

beforeEach(() => {
  session.getUser
    .mockReset()
    .mockResolvedValue({ data: { user: { email: "alice@clinique-a.tg" } } });
  session.getClaims.mockReset();
  session.updateUser.mockReset().mockResolvedValue({ error: null });
  session.signOut.mockReset().mockResolvedValue({ error: null });
  probe.signInWithPassword.mockReset().mockResolvedValue({ error: null });
  probe.signOut.mockReset().mockResolvedValue({ error: null });
});

describe("depuis les paramètres", () => {
  it("exige le mot de passe actuel", async () => {
    const result = await changePassword("", NEW_PASSWORD, NEW_PASSWORD);
    expect(result).toMatchObject({
      ok: false,
      error: t.settings.password.currentRequired,
    });
    expect(session.updateUser).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe actuel faux, sans rien changer", async () => {
    probe.signInWithPassword.mockResolvedValue({
      error: { status: 400, message: "Invalid login credentials" },
    });
    const result = await changePassword("faux", NEW_PASSWORD, NEW_PASSWORD);
    expect(result).toMatchObject({
      ok: false,
      error: t.settings.password.currentInvalid,
    });
    expect(session.updateUser).not.toHaveBeenCalled();
    expect(session.signOut).not.toHaveBeenCalled();
  });

  it("distingue la limite de débit d'un mot de passe faux", async () => {
    probe.signInWithPassword.mockResolvedValue({
      error: { status: 429, message: "rate limit" },
    });
    const result = await changePassword("x", NEW_PASSWORD, NEW_PASSWORD);
    expect(result).toMatchObject({
      ok: false,
      error: t.settings.password.tooManyAttempts,
    });
  });

  it("change le mot de passe après vérification, et ferme la session de contrôle", async () => {
    const result = await changePassword("Actuel-1", NEW_PASSWORD, NEW_PASSWORD);
    expect(result).toEqual({ ok: true, data: undefined });
    expect(probe.signInWithPassword).toHaveBeenCalledWith({
      email: "alice@clinique-a.tg",
      password: "Actuel-1",
    });
    expect(probe.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(session.updateUser).toHaveBeenCalledWith({ password: NEW_PASSWORD });
    expect(session.signOut).toHaveBeenCalledWith({ scope: "others" });
  });
});

describe("depuis un lien reçu par courriel", () => {
  it("accepte une session ouverte à l'instant par le lien", async () => {
    session.getClaims.mockResolvedValue({
      data: { claims: { amr: [{ method: "otp", timestamp: now() - 60 }] } },
      error: null,
    });
    const result = await setPasswordFromLink(NEW_PASSWORD, NEW_PASSWORD);
    expect(result).toEqual({ ok: true, data: undefined });
    expect(probe.signInWithPassword).not.toHaveBeenCalled();
  });

  it("refuse une session ouverte par mot de passe", async () => {
    session.getClaims.mockResolvedValue({
      data: { claims: { amr: [{ method: "password", timestamp: now() }] } },
      error: null,
    });
    const result = await setPasswordFromLink(NEW_PASSWORD, NEW_PASSWORD);
    expect(result).toMatchObject({
      ok: false,
      error: t.settings.password.linkRequired,
    });
    expect(session.updateUser).not.toHaveBeenCalled();
  });
});
