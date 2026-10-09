"use client";

import { AlertTriangle, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Field, Input } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { confirmsAccountName } from "@/lib/account-anonymization";
import { anonymizeUser } from "@/lib/actions/control";

/**
 * Anonymisation d'un compte : le droit à l'effacement, depuis sa ligne
 * dans la liste des comptes de la tour de contrôle.
 *
 * Le geste est définitif. La boîte dit exactement ce qu'il enclenche, et
 * n'active le bouton qu'une fois le nom du compte saisi : il faut lire
 * *quel* compte on efface. Un compte encore membre d'une organisation
 * active exige en plus la confirmation explicite du retrait de ses
 * appartenances, la règle du service (qui la revérifie).
 *
 * @param profileId     Compte visé.
 * @param fullName      Nom du profil, à saisir pour confirmer.
 * @param displayName   Nom affiché, titre compris (« Dr … »).
 * @param activeMember  Le compte garde une appartenance à une
 *                      organisation active.
 */
export function AnonymizeDialog({
  profileId,
  fullName,
  displayName,
  activeMember,
}: {
  profileId: string;
  fullName: string;
  displayName: string;
  activeMember: boolean;
}) {
  const t = useMessages();
  const text = t.admin.anonymize;
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [removeMemberships, setRemoveMemberships] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const ready =
    confirmsAccountName(typed, fullName) &&
    (!activeMember || removeMemberships);

  const reset = () => {
    setTyped("");
    setRemoveMemberships(false);
    setError(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setError(null);
    startTransition(async () => {
      const result = await anonymizeUser(profileId, {
        confirmName: typed,
        removeMemberships: activeMember && removeMemberships,
      });
      if (result.ok) {
        setOpen(false);
        reset();
        toast.success(text.done(displayName, result.data === "kept"));
        router.refresh();
        return;
      }
      setError(result.error);
      // Compte anonymisé, ou rattaché, entre-temps par une autre session :
      // la liste se met à jour derrière la boîte.
      if (result.status === 409) router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title={text.title}
          className="text-urgent"
        >
          <UserX aria-hidden />
          {text.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{text.dialogTitle(displayName)}</DialogTitle>
            <DialogDescription>{text.dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[60dvh] flex-col gap-4 overflow-y-auto px-5 pb-5">
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-xs leading-relaxed text-secondary">
              {text.consequences.map((consequence) => (
                <li key={consequence}>{consequence}</li>
              ))}
            </ul>

            <p className="text-xs">
              {text.confirmBefore}
              <strong className="font-semibold select-all">{fullName}</strong>
            </p>
            <Field
              id={`confirm-account-name-${profileId}`}
              label={text.confirmLabel}
              hint={text.confirmHint}
            >
              <Input
                id={`confirm-account-name-${profileId}`}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={200}
                className="h-9"
              />
            </Field>

            {activeMember && (
              <div className="flex flex-col gap-3 rounded-lg bg-urgent-muted px-3 py-3 text-xs text-urgent">
                <p className="flex gap-2 font-medium">
                  <AlertTriangle
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden
                  />
                  {text.activeTitle}
                </p>
                <label className="flex cursor-pointer items-start gap-2.5 text-primary">
                  <input
                    type="checkbox"
                    checked={removeMemberships}
                    onChange={(event) =>
                      setRemoveMemberships(event.target.checked)
                    }
                    className="mt-0.5 size-4 shrink-0 accent-urgent"
                  />
                  <span>
                    <span className="block font-medium">
                      {text.removeLabel}
                    </span>
                    <span className="mt-0.5 block text-secondary">
                      {text.removeDetail}
                    </span>
                  </span>
                </label>
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
              onClick={() => {
                // `onOpenChange` ne voit pas une fermeture commandée par
                // l'écran : la saisie est effacée ici aussi.
                setOpen(false);
                reset();
              }}
            >
              {t.common.actions.cancel}
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={pending}
              disabled={!ready}
            >
              {text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
