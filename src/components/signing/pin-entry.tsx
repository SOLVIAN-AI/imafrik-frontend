"use client";

import { KeyRound, LockKeyhole } from "lucide-react";
import * as React from "react";

import { Field, Input } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import { readMyPinState } from "@/lib/actions/signing";
import type { ApiErrorReason } from "@/lib/api/error-reason";
import { formatTime } from "@/lib/format";
import {
  isPinFormat,
  isPinLocked,
  isPinRefusal,
  newPinProblem,
  PIN_LENGTH,
  type PinProof,
} from "@/lib/signing";
import { cn } from "@/lib/utils";

/**
 * Code personnel, dans une fenêtre qui engage le radiologue : signature
 * d'un compte-rendu, addendum, dépôt d'une image.
 *
 * Deux formes. **Saisie** : le radiologue a un code, il le tape. **Création** :
 * il n'en a pas encore ; plutôt que de le renvoyer aux paramètres au
 * moment de signer, la fenêtre le lui fait créer sur place (saisie et
 * confirmation), puis le geste continue dans le même appel. Le service
 * reste juge : il dit si le code manque, s'il est faux (essais restants),
 * verrouillé, ou créé entre-temps depuis un autre onglet, et la fenêtre
 * change de forme en conséquence, sans jamais lire le message.
 *
 * Le code n'est gardé que dans l'état de la fenêtre, effacé après chaque
 * essai refusé et à la fermeture ; jamais dans le stockage du navigateur.
 */

/** État du code personnel au moment d'ouvrir la fenêtre. */
export interface PinStatus {
  /** Un code est défini ; sinon, la fenêtre propose de le créer. */
  pinSet: boolean;
  /** Fin d'un verrou en cours, ou `null`. */
  lockedUntil: Date | null;
}

/** Échec d'un geste, tel qu'une action serveur le rend. */
export interface GestureFailure {
  error: string;
  status: number;
  reason?: ApiErrorReason;
}

/** Ce que {@link usePinGesture} expose à la fenêtre qui l'emploie. */
export interface PinGesture {
  mode: "enter" | "create";
  pin: string;
  confirmation: string;
  setPin: (value: string) => void;
  setConfirmation: (value: string) => void;
  /** Refus du service lié au code, à afficher sous les champs. */
  error: string | null;
  /** Fin du verrou, s'il court. */
  lockedUntil: Date | null;
  /** Le code saisi permet d'envoyer le geste. */
  ready: boolean;
  /** Preuve à joindre au geste. */
  proof: () => PinProof;
  /**
   * Interprète un échec : vrai s'il portait sur le code (la fenêtre reste
   * ouverte et l'affiche), faux sinon (l'appelant affiche l'erreur).
   */
  fail: (failure: GestureFailure) => Promise<boolean>;
  /** Le geste a réussi : un code créé vaut désormais. */
  succeed: () => void;
  /** Oublie les saisies (fermeture de la fenêtre). */
  clear: () => void;
}

/**
 * État du code personnel pendant un geste.
 *
 * @param status État lu à l'ouverture de l'écran, `null` s'il n'a pas pu
 *               l'être : la fenêtre demande alors le code, et le service
 *               dira s'il faut le créer.
 */
export function usePinGesture(status: PinStatus | null): PinGesture {
  const [mode, setMode] = React.useState<"enter" | "create">(
    status && !status.pinSet ? "create" : "enter",
  );
  const [pin, setPinValue] = React.useState("");
  const [confirmation, setConfirmationValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = React.useState<Date | null>(
    status?.lockedUntil ?? null,
  );

  // Fin du verrou : la saisie se rouvre d'elle-même, sans recharger.
  React.useEffect(() => {
    if (!lockedUntil) return;
    const delay = Math.max(lockedUntil.getTime() - Date.now(), 0);
    const timer = window.setTimeout(() => {
      setLockedUntil(null);
      setError(null);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [lockedUntil]);

  const digits = (value: string) => value.replace(/\D/g, "").slice(0, 6);
  const setPin = (value: string) => {
    setPinValue(digits(value));
    setError(null);
  };
  const setConfirmation = (value: string) => {
    setConfirmationValue(digits(value));
    setError(null);
  };

  const locked = isPinLocked(lockedUntil);
  const ready =
    !locked &&
    (mode === "enter"
      ? isPinFormat(pin)
      : newPinProblem(pin, confirmation) === null);

  const clear = React.useCallback(() => {
    setPinValue("");
    setConfirmationValue("");
    setError(null);
  }, []);

  const proof = (): PinProof =>
    mode === "create"
      ? { pin, definePin: true, pinConfirmation: confirmation }
      : { pin };

  const fail = async (failure: GestureFailure): Promise<boolean> => {
    const code = failure.reason?.code;
    if (!isPinRefusal(code)) {
      // Le code a pu être créé avant que le geste n'échoue pour une autre
      // raison (texte modifié ailleurs pendant la signature) : la fenêtre
      // le demandera désormais, au lieu d'en créer un second.
      if (mode === "create") {
        const state = await readMyPinState().catch(() => null);
        if (state?.ok && state.data.pinSet) {
          setMode("enter");
          setPinValue("");
          setConfirmationValue("");
        }
      }
      return false;
    }
    switch (code) {
      case "pin_locked":
        setLockedUntil(
          failure.reason?.lockedUntil
            ? new Date(failure.reason.lockedUntil)
            : null,
        );
        setPinValue("");
        setError(failure.reason?.lockedUntil ? null : failure.error);
        return true;
      case "pin_not_set":
        setMode("create");
        setPinValue("");
        setConfirmationValue("");
        setError(failure.error);
        return true;
      case "pin_already_set":
        setMode("enter");
        setPinValue("");
        setConfirmationValue("");
        setError(failure.error);
        return true;
      case "pin_mismatch":
        setConfirmationValue("");
        setError(failure.error);
        return true;
      default:
        // Code faux (essais restants dans le message), absent, mal formé,
        // trop simple, ou invérifiable : la saisie est à refaire.
        setPinValue("");
        setConfirmationValue("");
        setError(failure.error);
        return true;
    }
  };

  const succeed = () => {
    setMode("enter");
    clear();
  };

  return {
    mode,
    pin,
    confirmation,
    setPin,
    setConfirmation,
    error,
    lockedUntil: locked ? lockedUntil : null,
    ready,
    proof,
    fail,
    succeed,
    clear,
  };
}

/** Champ d'un code à six chiffres, masqué, jamais mémorisé par le navigateur. */
export function PinInput({
  id,
  value,
  onChange,
  disabled,
  invalid,
  describedBy,
  autoFocus,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <Input
      id={id}
      type="password"
      inputMode="numeric"
      pattern="\d{6}"
      maxLength={PIN_LENGTH}
      autoComplete="off"
      // Les gestionnaires de mots de passe n'ont pas à proposer de garder
      // ce code : il ne se tape qu'à la main, au moment de signer.
      data-1p-ignore=""
      data-lpignore="true"
      data-form-type="other"
      spellCheck={false}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      autoFocus={autoFocus}
      className={cn(
        "w-36 text-center font-mono text-base tracking-[0.5em]",
        className,
      )}
    />
  );
}

/**
 * Champs du code personnel, selon la forme du geste.
 *
 * @param gesture État tenu par {@link usePinGesture}.
 * @param idPrefix Préfixe des identifiants, unique dans la page.
 * @param autoFocus Placer le curseur dans le premier champ.
 */
export function PinEntry({
  gesture,
  idPrefix,
  autoFocus = false,
  disabled = false,
}: {
  gesture: PinGesture;
  idPrefix: string;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const text = useMessages().settings.signing.pin;
  const locale = useLocale();

  if (gesture.lockedUntil) {
    return (
      <div
        role="alert"
        className="flex gap-2.5 rounded-lg bg-urgent-muted px-3 py-2.5 text-xs"
      >
        <LockKeyhole className="mt-px size-3.5 shrink-0 text-urgent" />
        <div className="min-w-0">
          <p className="font-medium">
            {text.locked(formatTime(gesture.lockedUntil, locale))}
          </p>
          <p className="mt-0.5 text-tertiary">{text.forgotten}</p>
        </div>
      </div>
    );
  }

  if (gesture.mode === "create") {
    const problem =
      gesture.pin.length === PIN_LENGTH &&
      gesture.confirmation.length === PIN_LENGTH
        ? newPinProblem(gesture.pin, gesture.confirmation)
        : gesture.pin.length === PIN_LENGTH &&
            newPinProblem(gesture.pin, gesture.pin) === "trivial"
          ? "trivial"
          : null;
    const message = gesture.error ?? (problem ? text.problems[problem] : null);
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-sunken/60 px-3 py-3">
        <div className="flex gap-2.5 text-xs">
          <KeyRound className="mt-px size-3.5 shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="font-medium">{text.createTitle}</p>
            <p className="mt-0.5 text-tertiary">{text.createDetail}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          <Field id={`${idPrefix}-new`} label={text.newLabel}>
            <PinInput
              id={`${idPrefix}-new`}
              value={gesture.pin}
              onChange={gesture.setPin}
              disabled={disabled}
              invalid={problem === "trivial" || problem === "format"}
              describedBy={message ? `${idPrefix}-problem` : undefined}
              autoFocus={autoFocus}
            />
          </Field>
          <Field id={`${idPrefix}-confirm`} label={text.confirmLabel}>
            <PinInput
              id={`${idPrefix}-confirm`}
              value={gesture.confirmation}
              onChange={gesture.setConfirmation}
              disabled={disabled}
              invalid={problem === "mismatch"}
              describedBy={message ? `${idPrefix}-problem` : undefined}
            />
          </Field>
        </div>
        {message && (
          <p
            id={`${idPrefix}-problem`}
            role="alert"
            className="text-2xs text-urgent"
          >
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Field
        id={`${idPrefix}-pin`}
        label={text.label}
        hint={gesture.error ?? text.hint}
        error={gesture.error ?? undefined}
      >
        <PinInput
          id={`${idPrefix}-pin`}
          value={gesture.pin}
          onChange={gesture.setPin}
          disabled={disabled}
          invalid={gesture.error !== null}
          describedBy={`${idPrefix}-pin-description`}
          autoFocus={autoFocus}
        />
      </Field>
      <p className="text-2xs leading-relaxed text-tertiary">{text.forgotten}</p>
    </div>
  );
}
