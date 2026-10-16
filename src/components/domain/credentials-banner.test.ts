import { type ComponentProps, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CredentialsBanner } from "@/components/domain/credentials-banner";
import { SessionProvider } from "@/components/providers/session-provider";
import { messagesFor } from "@/i18n";
import type { Locale } from "@/lib/i18n/locale";
import { demoSession } from "@/lib/session/demo";
import type { Session } from "@/lib/session/types";

/**
 * Le bandeau rendu pour une session donnée, en HTML statique : le même
 * rendu que celui du serveur au premier affichage.
 */
function render(session: Session): string {
  return renderToStaticMarkup(
    createElement(
      SessionProvider,
      // L'enfant est passé en troisième argument, comme le ferait JSX.
      { session } as ComponentProps<typeof SessionProvider>,
      createElement(CredentialsBanner),
    ),
  );
}

/** Radiologue de démonstration, au profil ajusté. */
function radiologist(
  user: Partial<Session["user"]>,
  locale: Locale = "fr",
): Session {
  const session = demoSession("m-radio", locale);
  return { ...session, user: { ...session.user, ...user } };
}

/** Échappe un texte comme React le fait dans le HTML. */
function html(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("'", "&#x27;");
}

describe("bandeau d’habilitation du radiologue", () => {
  it("n’apparaît pas pour un radiologue habilité ni pour les autres rôles", () => {
    expect(render(radiologist({}))).toBe("");
    expect(render(demoSession("m-clinic"))).toBe("");
    expect(render(demoSession("m-admin"))).toBe("");
  });

  it.each([
    "undeclared",
    "license_missing",
    "documents_missing",
    "expired",
  ] as const)(
    "renvoie vers le dossier quand il est incomplet (%s)",
    (state) => {
      const markup = render(radiologist({ credentialState: state }));
      const t = messagesFor("fr").credentials;
      expect(markup).toContain(`data-credentials="${state}"`);
      expect(markup).toContain(html(t.states[state].title));
      expect(markup).toContain(html(t.states[state].action));
      expect(markup).toContain(html(t.why));
      expect(markup).toContain('href="/parametres#justificatifs"');
    },
  );

  it("annonce la vérification en cours, sans action à faire", () => {
    const markup = render(radiologist({ credentialState: "pending" }, "en"));
    const t = messagesFor("en").credentials;
    expect(markup).toContain('data-credentials="pending"');
    expect(markup).toContain(html(t.states.pending.title));
    expect(markup).toContain(html(t.states.pending.detail));
    expect(markup).not.toContain('href="/parametres');
  });
});
