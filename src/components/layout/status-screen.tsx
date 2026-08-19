import Link from "next/link";

import { Mark } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Écran de situation : page inconnue, accès refusé, erreur.
 *
 * **Un tel écran doit faire trois choses**, et la troisième est celle
 * qu'on oublie : dire ce qui s'est passé, dire ce que ça implique, et
 * proposer une sortie. Un message qui se contente d'annoncer l'échec
 * laisse l'utilisateur sans recours — et, dans un service, il appellera
 * le support pour une page qui n'existe pas.
 *
 * Le ton reste factuel. Ni excuses appuyées, ni humour : quelqu'un qui
 * cherchait un examen urgent n'a pas envie d'être diverti.
 *
 * @param code    Repère court — « 404 », « 403 ». Affiché discrètement :
 *                il sert au support, pas à l'utilisateur.
 * @param title   Ce qui s'est passé, en langage d'utilisateur.
 * @param detail  Ce que cela implique, et pourquoi.
 * @param actions Les sorties possibles.
 */
export function StatusScreen({
  code,
  title,
  detail,
  actions,
  tone = "neutral",
}: {
  code: string;
  title: string;
  detail: React.ReactNode;
  actions?: React.ReactNode;
  tone?: "neutral" | "urgent";
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-surface-base px-6 py-16 text-center">
      <div
        className="pointer-events-none absolute -top-48 left-1/2 size-[42rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(closest-side, var(${
            tone === "urgent" ? "--urgent-muted" : "--glow-accent"
          }), transparent)`,
        }}
        aria-hidden
      />
      <div
        className="dot-grid pointer-events-none absolute inset-0"
        aria-hidden
      />

      <div className="relative max-w-md">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <Mark className="size-7" />
          <span className="text-base font-semibold tracking-[-0.01em]">
            IMAFRIK
          </span>
        </Link>

        <p
          className={cn(
            "label-eyebrow mt-12",
            tone === "urgent" ? "text-urgent" : "text-accent",
          )}
        >
          Erreur {code}
        </p>
        <h1 className="mt-3 text-2xl font-semibold md:text-3xl">{title}</h1>
        <div className="mt-4 text-sm leading-relaxed text-secondary">
          {detail}
        </div>

        {actions && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/** Retour à l'accueil, sortie par défaut de tous ces écrans. */
export function BackHomeButton({
  label = "Retour à l’accueil",
}: {
  label?: string;
}) {
  return (
    <Button variant="secondary" size="lg" asChild>
      <Link href="/">{label}</Link>
    </Button>
  );
}
