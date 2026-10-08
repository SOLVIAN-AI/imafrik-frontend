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
import { useMessages } from "@/i18n/client";
import type { ActionResult } from "@/lib/actions/result";
import type { UserRole } from "@/lib/session/types";

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
  const t = useMessages();
  const messages = t.clinic.invite;
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  // Rôle choisi : un radiologue appelle un rappel sur la validation de son
  // numéro d'ordre.
  const [role, setRole] = React.useState<UserRole>(roles[0]);

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
      toast.success(messages.added(input.fullName, organizationName));
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
            {messages.button}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{messages.title(organizationName)}</DialogTitle>
            <DialogDescription>{messages.description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 px-5 pb-5">
            <Field id="invite-name" label={messages.fullName}>
              <Input
                id="invite-name"
                name="fullName"
                required
                maxLength={200}
                autoComplete="off"
              />
            </Field>
            <Field id="invite-email" label={messages.email}>
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                autoComplete="off"
              />
            </Field>
            {roles.length > 1 ? (
              <Field id="invite-role" label={messages.role}>
                <Select
                  id="invite-role"
                  name="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {t.common.roles[role]}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <input type="hidden" name="role" value={roles[0]} />
            )}
            {role === "radiologist" && (
              <p className="rounded-lg bg-progress-muted px-3 py-2.5 text-2xs leading-relaxed text-progress">
                {messages.radiologistNote}
              </p>
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
              {t.common.actions.cancel}
            </Button>
            <Button type="submit" size="sm" loading={pending}>
              {messages.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
