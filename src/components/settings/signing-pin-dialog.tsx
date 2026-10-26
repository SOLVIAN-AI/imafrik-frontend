"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { PinInput } from "@/components/signing/pin-entry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/input";
import { useLocale, useMessages } from "@/i18n/client";
import { setSigningPin } from "@/lib/actions/signing";
import { formatTime } from "@/lib/format";
import { isPinFormat, newPinProblem, PIN_LENGTH } from "@/lib/signing";

/**
 * Création ou changement du code personnel, depuis les paramètres.
 *
 * Création : le code, deux fois. Changement : le code actuel, puis le
 * nouveau, deux fois ; un code actuel faux compte comme tout essai, et
 * cinq erreurs le verrouillent quinze minutes. Les suites (`123456`) et
 * les chiffres répétés sont refusés avant l'envoi, avec la raison.
 *
 * Les saisies sont effacées à la fermeture et après chaque refus.
 *
 * @param pinSet Un code existe : la fenêtre le change au lieu de le créer.
 */
export function SigningPinDialog({ pinSet }: { pinSet: boolean }) {
  const t = useMessages();
  const text = t.settings.signing.pin;
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const digits = (value: string) => value.replace(/\D/g, "").slice(0, 6);
  const reset = () => {
    setCurrent("");
    setPin("");
    setConfirmation("");
    setError(null);
  };

  // Problème du nouveau code, dit dès qu'il se voit : trop simple dès six
  // chiffres, différent une fois la confirmation complète.
  const problem =
    pin.length === PIN_LENGTH && confirmation.length === PIN_LENGTH
      ? newPinProblem(pin, confirmation)
      : pin.length === PIN_LENGTH && newPinProblem(pin, pin) === "trivial"
        ? "trivial"
        : null;
  const ready =
    newPinProblem(pin, confirmation) === null &&
    (!pinSet || isPinFormat(current));

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await setSigningPin({
        pin,
        pinConfirmation: confirmation,
        ...(pinSet ? { currentPin: current } : {}),
      });
      if (!result.ok) {
        const lockedUntil = result.reason?.lockedUntil;
        setError(
          lockedUntil
            ? text.locked(formatTime(new Date(lockedUntil), locale))
            : result.error,
        );
        setCurrent("");
        if (result.reason?.code !== "pin_wrong") {
          setPin("");
          setConfirmation("");
        }
        return;
      }
      toast.success(pinSet ? text.dialog.changed : text.dialog.created);
      reset();
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="secondary">
          <KeyRound aria-hidden />
          {pinSet ? text.change : text.define}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {pinSet ? text.dialog.changeTitle : text.dialog.createTitle}
          </DialogTitle>
          <DialogDescription>
            {pinSet
              ? text.dialog.changeDescription
              : text.dialog.createDescription}
          </DialogDescription>
        </DialogHeader>
        <form
          id="signing-pin-form"
          className="flex flex-col gap-4 px-5 pb-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (ready) submit();
          }}
        >
          {pinSet && (
            <Field id="pin-current" label={text.currentLabel}>
              <PinInput
                id="pin-current"
                value={current}
                onChange={(value) => {
                  setCurrent(digits(value));
                  setError(null);
                }}
                disabled={pending}
                autoFocus
              />
            </Field>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-3">
            <Field id="pin-new" label={text.newLabel}>
              <PinInput
                id="pin-new"
                value={pin}
                onChange={(value) => {
                  setPin(digits(value));
                  setError(null);
                }}
                disabled={pending}
                invalid={problem === "trivial"}
                describedBy={problem ? "pin-problem" : undefined}
                autoFocus={!pinSet}
              />
            </Field>
            <Field id="pin-confirm" label={text.confirmLabel}>
              <PinInput
                id="pin-confirm"
                value={confirmation}
                onChange={(value) => {
                  setConfirmation(digits(value));
                  setError(null);
                }}
                disabled={pending}
                invalid={problem === "mismatch"}
                describedBy={problem ? "pin-problem" : undefined}
              />
            </Field>
          </div>
          {(problem || error) && (
            <p id="pin-problem" role="alert" className="text-xs text-urgent">
              {error ?? (problem ? text.problems[problem] : null)}
            </p>
          )}
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => {
              reset();
              setOpen(false);
            }}
          >
            {t.common.actions.cancel}
          </Button>
          <Button
            type="submit"
            form="signing-pin-form"
            size="sm"
            loading={pending}
            disabled={!ready}
          >
            {pinSet ? text.change : text.define}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
