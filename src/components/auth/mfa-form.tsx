"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  LogOut,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import * as React from "react";

import {
  type Enrollment,
  startEnrollment,
  verifyCode,
} from "@/app/(auth)/double-authentification/actions";
import { Wordmark } from "@/components/brand/brand";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { signOut } from "@/lib/session/actions";

/**
 * Écran de double authentification.
 *
 * **Enrôler**, quand le compte n'a pas encore de facteur : trois étapes
 * numérotées — installer une application, scanner, saisir le premier
 * code. Les textes précisent que le QR code se scanne **depuis
 * l'application d'authentification** (« Ajouter un compte » ou « + ») :
 * scanné avec l'appareil photo du téléphone, il ne produit rien, et des
 * utilisateurs s'y sont arrêtés. La clé est affichée en clair, groupée
 * par quatre, pour qui ne peut pas scanner (application sur le même
 * téléphone que l'écran).
 *
 * **Vérifier**, sinon : un seul champ, le code du moment.
 *
 * Le champ de code est fait pour être rempli vite et sans erreur : clavier
 * numérique sur téléphone, saisie automatique du code par le système
 * (`one-time-code`), espaces tolérés.
 *
 * @param factorId Facteur vérifié existant, ou `null` pour enrôler.
 * @param suite    Destination demandée avant la redirection.
 */
export function MfaForm({
  factorId,
  suite,
}: {
  factorId: string | null;
  suite: string;
}) {
  const t = useMessages();
  const [enrollment, setEnrollment] = React.useState<Enrollment | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [starting, startTransition] = React.useTransition();
  const [verifying, verifyTransition] = React.useTransition();
  const [code, setCode] = React.useState("");
  const enrolling = factorId === null;
  const activeFactor = factorId ?? enrollment?.factorId ?? null;

  const begin = () => {
    setError(null);
    startTransition(async () => {
      const result = await startEnrollment();
      if (result.ok) setEnrollment(result.data);
      else setError(result.error);
    });
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeFactor) return;
    setError(null);
    verifyTransition(async () => {
      // Une vérification réussie redirige côté serveur ; seul un échec
      // revient ici.
      const result = await verifyCode(activeFactor, code, suite);
      if (!result.ok) {
        setError(result.error);
        setCode("");
      }
    });
  };

  return (
    <div className="w-full max-w-sm animate-[rise-in_400ms_var(--ease-out-quart)]">
      <div className="mb-8 flex items-center gap-2.5 lg:hidden">
        <Wordmark className="h-5" />
      </div>

      <span className="flex size-11 items-center justify-center rounded-xl bg-accent-muted text-accent ring-1 ring-accent/25 ring-inset">
        <ShieldCheck className="size-5" aria-hidden />
      </span>
      <h2 className="mt-5 text-2xl font-semibold">{t.session.mfa.title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-tertiary">
        {enrolling ? t.session.mfa.enrollIntro : t.session.mfa.verifyIntro}
      </p>

      {enrolling && !enrollment && (
        <ol className="mt-6 flex flex-col gap-3 text-sm">
          <Step n={1}>{t.session.mfa.steps.install}</Step>
          <Step n={2}>{t.session.mfa.steps.scan}</Step>
          <Step n={3}>{t.session.mfa.steps.enterCode}</Step>
        </ol>
      )}

      {enrolling && !enrollment && (
        <Button
          size="lg"
          className="mt-6 h-10 w-full"
          loading={starting}
          onClick={begin}
        >
          <Smartphone />
          {t.session.mfa.setUp}
        </Button>
      )}

      {enrollment && <EnrollmentCard enrollment={enrollment} />}

      {activeFactor && (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <Field id="otp" label={t.session.mfa.codeLabel}>
            <Input
              id="otp"
              name="otp"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              maxLength={7}
              autoFocus
              placeholder="123 456"
              aria-invalid={error !== null}
              className="h-12 text-center font-mono text-xl tracking-[0.35em] tabular-nums"
            />
          </Field>
          <Button
            type="submit"
            size="lg"
            loading={verifying}
            disabled={code.replace(/\s/g, "").length !== 6}
            className="h-10 w-full"
          >
            {t.session.mfa.verify}
            <ArrowRight />
          </Button>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg bg-urgent-muted px-3 py-2.5 text-xs text-urgent"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="mt-8 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3.5">
        <p className="text-xs font-medium">
          {enrolling ? t.session.mfa.noSmartphone : t.session.mfa.lostPhone}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-tertiary">
          {t.session.mfa.support}
        </p>
      </div>

      <form action={signOut} className="mt-4 flex justify-center">
        <button
          type="submit"
          className="flex min-h-6 items-center gap-1.5 text-xs text-tertiary transition-colors hover:text-primary"
        >
          <LogOut className="size-3.5" aria-hidden />
          {t.common.actions.signOut}
        </button>
      </form>
    </div>
  );
}

/** Une étape numérotée de l'enrôlement. */
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border-default text-2xs font-medium tabular-nums">
        {n}
      </span>
      <span className="pt-0.5 text-secondary">{children}</span>
    </li>
  );
}

/** QR code et clé de secours de l'enrôlement en cours. */
function EnrollmentCard({ enrollment }: { enrollment: Enrollment }) {
  const t = useMessages();
  const [copied, setCopied] = React.useState(false);
  const grouped = enrollment.secret.match(/.{1,4}/g)?.join(" ") ?? "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(enrollment.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers refusé : la clé reste lisible et sélectionnable.
    }
  };

  return (
    <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-border-subtle bg-surface-raised p-5">
      <p className="text-center text-xs leading-relaxed text-secondary">
        {t.session.mfa.scanHint}
      </p>
      {/* Fond blanc et marge : un QR code sur fond sombre se scanne mal. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- image `data:` générée par le service, rien à optimiser */}
      <img
        src={enrollment.qrCode}
        alt={t.session.mfa.qrAlt}
        width={176}
        height={176}
        className="size-44 rounded-lg bg-white p-2"
      />
      <div className="w-full text-center">
        <p className="text-2xs text-tertiary">{t.session.mfa.cannotScan}</p>
        <div className="mt-1.5 flex items-center justify-center gap-1">
          <code className="rounded-md bg-surface-sunken px-2 py-1 font-mono text-xs break-all select-all">
            {grouped}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label={t.session.mfa.copyKey}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-surface-hover hover:text-primary"
          >
            {copied ? (
              <Check className="size-3.5 text-done" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
