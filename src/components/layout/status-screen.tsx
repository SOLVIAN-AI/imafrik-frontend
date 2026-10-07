import Link from "next/link";

import { Wordmark } from "@/components/brand/brand";
import { Button } from "@/components/ui/button";
import { messagesFor } from "@/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";
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
 * @param code    Repère court — « 404 », « 403 ». Affiché discrètement,
 *                précédé de « Erreur » : il sert au support, pas à
 *                l'utilisateur.
 * @param eyebrow Repère affiché à la place de « Erreur {code} », pour un
 *                écran qui ne signale pas une erreur (compte en attente).
 * @param title   Ce qui s'est passé, en langage d'utilisateur.
 * @param detail  Ce que cela implique, et pourquoi.
 * @param actions Les sorties possibles.
 * @param locale  Langue du repère « Erreur » ; le français par défaut.
 */
export function StatusScreen({
  code,
  eyebrow,
  title,
  detail,
  actions,
  tone = "neutral",
  locale = DEFAULT_LOCALE,
}: {
  code: string;
  eyebrow?: string;
  title: string;
  detail: React.ReactNode;
  actions?: React.ReactNode;
  tone?: "neutral" | "urgent";
  locale?: Locale;
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
          <Wordmark className="h-6" />
        </Link>

        <p
          className={cn(
            "label-eyebrow mt-12",
            tone === "urgent" ? "text-urgent" : "text-accent",
          )}
        >
          {eyebrow ?? messagesFor(locale).session.statusScreen.error(code)}
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

/**
 * Retour à l'accueil, sortie par défaut de tous ces écrans.
 *
 * @param label  Libellé du bouton ; à défaut, « Retour à l'accueil » dans
 *               la langue `locale`.
 * @param href   Accueil visé ; celui du site anglais est `/en`.
 * @param locale Langue du libellé par défaut ; le français par défaut.
 */
export function BackHomeButton({
  label,
  href = "/",
  locale = DEFAULT_LOCALE,
}: {
  label?: string;
  href?: string;
  locale?: Locale;
}) {
  return (
    <Button variant="secondary" size="lg" asChild>
      <Link href={href}>
        {label ?? messagesFor(locale).session.statusScreen.backHome}
      </Link>
    </Button>
  );
}
