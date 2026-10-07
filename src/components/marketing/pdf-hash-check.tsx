"use client";

import { FileSearch, ShieldAlert, ShieldCheck } from "lucide-react";
import * as React from "react";

import { fill, marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

type Outcome =
  | { state: "idle" }
  | { state: "match" }
  | { state: "mismatch"; actual: string };

/**
 * Compare un PDF à l'empreinte enregistrée à la signature.
 *
 * Le code du QR code prouve qu'un compte-rendu a été signé ; il ne prouve
 * pas que **ce fichier-là** n'a pas été retouché depuis. L'empreinte, si :
 * le navigateur calcule le SHA-256 du fichier choisi et le compare à celui
 * que la plateforme a enregistré au moment de signer.
 *
 * **Le fichier ne quitte jamais l'ordinateur.** Le calcul se fait sur
 * place (`crypto.subtle`) ; rien n'est envoyé — le document contient des
 * données de santé, et la page est publique.
 *
 * @param expected Empreinte enregistrée, en hexadécimal.
 * @param locale   Langue de la page.
 */
export function PdfHashCheck({
  expected,
  locale,
}: {
  expected: string;
  locale: Locale;
}) {
  const t = marketingCopy(locale).hashCheck;
  const [outcome, setOutcome] = React.useState<Outcome>({ state: "idle" });

  const check = async (file: File) => {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      await file.arrayBuffer(),
    );
    const actual = [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    setOutcome(
      actual === expected.toLowerCase()
        ? { state: "match" }
        : { state: "mismatch", actual },
    );
  };

  return (
    <div className="mt-6 w-full rounded-2xl border border-border-subtle bg-surface-raised p-5 text-left">
      <p className="label-eyebrow">{t.title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-secondary">{t.text}</p>

      <label
        className={cn(
          "mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border-default px-3 py-2.5",
          "text-xs text-secondary transition-colors hover:bg-surface-hover",
          "focus-within:outline-2 focus-within:outline-accent",
        )}
      >
        <FileSearch className="size-4 shrink-0 text-tertiary" aria-hidden />
        {t.choose}
        <input
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void check(file);
          }}
        />
      </label>

      <div aria-live="polite">
        {outcome.state === "match" && (
          <p className="mt-3 flex items-center gap-2 text-xs font-medium text-done">
            <ShieldCheck className="size-4" aria-hidden />
            {t.match}
          </p>
        )}
        {outcome.state === "mismatch" && (
          <p className="mt-3 flex items-start gap-2 text-xs text-urgent">
            <ShieldAlert className="mt-px size-4 shrink-0" aria-hidden />
            <span>{t.mismatch}</span>
          </p>
        )}
      </div>

      <p className="mt-4 font-mono text-2xs break-all text-tertiary">
        {fill(t.expected, { hash: expected })}
      </p>
    </div>
  );
}
