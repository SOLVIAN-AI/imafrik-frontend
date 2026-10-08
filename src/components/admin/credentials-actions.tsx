"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

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
import { useMessages } from "@/i18n/client";
import { decideCredentials } from "@/lib/actions/control";

/**
 * Validation, ou retrait de la validation, du numéro d'ordre d'un
 * radiologue.
 *
 * **Valider**, c'est attester que le numéro a été vérifié auprès de
 * l'Ordre des médecins : la confirmation affiche le numéro exact, celui
 * qui sera imprimé sous la signature, pour que la vérification porte sur
 * lui et pas sur un souvenir. Sans numéro, rien ne peut être validé : le
 * bouton est inactif et dit pourquoi.
 *
 * **Retirer** coupe l'accès aux examens et rend au pool ceux que le
 * radiologue avait pris en charge : la confirmation le dit avant.
 *
 * @param profileId     Compte du radiologue.
 * @param fullName      Nom affiché dans les confirmations.
 * @param licenseNumber Numéro d'ordre déclaré, ou `null`.
 * @param verified      Vrai si le numéro est déjà validé.
 */
export function CredentialsActions({
  profileId,
  fullName,
  licenseNumber,
  verified,
}: {
  profileId: string;
  fullName: string;
  licenseNumber: string | null;
  verified: boolean;
}) {
  const t = useMessages();
  const text = t.admin.credentials;
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const decision = verified ? "revoke" : "verify";
  const copy = verified ? text.revoke : text.verify;
  const number = licenseNumber?.trim() ?? "";

  if (!verified && !number) {
    const reason = `credentials-missing-${profileId}`;
    return (
      <>
        <Button
          size="sm"
          variant="secondary"
          disabled
          title={text.verify.missing}
          aria-describedby={reason}
        >
          <ShieldCheck aria-hidden />
          {text.verify.trigger}
        </Button>
        <span id={reason} className="sr-only">
          {text.verify.missing}
        </span>
      </>
    );
  }

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await decideCredentials(profileId, decision);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(
        verified
          ? text.revoke.done(fullName, result.data)
          : text.verify.done(fullName),
      );
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant={verified ? "ghost" : "secondary"}>
          {verified ? <ShieldOff aria-hidden /> : <ShieldCheck aria-hidden />}
          {copy.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title(fullName)}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-5 pb-5">
          {!verified && (
            <div className="rounded-lg border border-border-subtle bg-surface-sunken/60 px-3 py-2.5">
              <p className="text-2xs text-tertiary">
                {text.verify.numberLabel}
              </p>
              <p
                className="mt-1 font-mono text-base font-semibold tracking-wide break-all"
                data-testid="license-to-verify"
              >
                {number}
              </p>
            </div>
          )}
          {error && (
            <p role="alert" className="text-xs text-urgent">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            {t.common.actions.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={verified ? "danger" : "primary"}
            loading={pending}
            onClick={confirm}
          >
            {copy.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
