"use client";

import { UserPlus } from "lucide-react";
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
import { Field, Input, Select } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions/result";
import { ROLE_LABELS, type UserRole } from "@/lib/session/types";

/** Ce que le formulaire transmet. */
export interface InviteInput {
  email: string;
  fullName: string;
  role: UserRole;
}

/**
 * Invitation d'une personne dans une organisation.
 *
 * Partagée par l'écran « Équipe » d'une clinique et par le back-office :
 * seuls les rôles proposés et l'action appelée diffèrent.
 *
 * La personne reçoit un courriel et choisit elle-même son mot de passe ;
 * si elle a déjà un compte, elle est simplement rattachée. Personne d'autre
 * ne connaît jamais son mot de passe.
 *
 * @param organizationName Organisation d'accueil, rappelée dans le titre.
 * @param roles            Rôles proposés, le premier par défaut.
 * @param onInvite         Action serveur à appeler.
 * @param trigger          Bouton qui ouvre la modale.
 */
export function InviteDialog({
  organizationName,
  roles,
  onInvite,
  trigger,
}: {
  organizationName: string;
  roles: readonly UserRole[];
  onInvite: (input: InviteInput) => Promise<ActionResult<unknown>>;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: InviteInput = {
      email: String(form.get("email") ?? ""),
      fullName: String(form.get("fullName") ?? ""),
      role: String(form.get("role") ?? roles[0]) as UserRole,
    };
    setError(null);
    startTransition(async () => {
      const result = await onInvite(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(`${input.fullName} a été ajouté(e) à ${organizationName}.`);
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <UserPlus />
            Inviter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Inviter dans {organizationName}</DialogTitle>
            <DialogDescription>
              La personne reçoit un lien par courriel et choisit elle-même son
              mot de passe. Si elle utilise déjà IMAFRIK, elle est simplement
              ajoutée.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-5 pb-5">
            <Field id="invite-name" label="Nom complet">
              <Input
                id="invite-name"
                name="fullName"
                required
                maxLength={200}
                autoComplete="off"
              />
            </Field>
            <Field id="invite-email" label="Adresse électronique">
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                autoComplete="off"
              />
            </Field>
            {roles.length > 1 ? (
              <Field id="invite-role" label="Rôle">
                <Select id="invite-role" name="role" defaultValue={roles[0]}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <input type="hidden" name="role" value={roles[0]} />
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
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              Envoyer l’invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
