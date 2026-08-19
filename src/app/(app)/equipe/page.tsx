"use client";

import { MoreHorizontal, UserPlus } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, Input } from "@/components/ui/input";
import { useSession } from "@/components/providers/session-provider";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Un membre de l'organisation. */
interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: Date;
  pending: boolean;
}

const DEMO_MEMBERS: Member[] = [
  {
    id: "1",
    name: "Akossiwa Amegan",
    email: "a.amegan@stjoseph.tg",
    role: "Administrateur",
    joinedAt: new Date("2026-03-12T09:00:00Z"),
    pending: false,
  },
  {
    id: "2",
    name: "Komi Dogbe",
    email: "k.dogbe@stjoseph.tg",
    role: "Manipulateur",
    joinedAt: new Date("2026-04-02T09:00:00Z"),
    pending: false,
  },
  {
    id: "3",
    name: "Sika Amoussou",
    email: "s.amoussou@stjoseph.tg",
    role: "Secrétariat médical",
    joinedAt: new Date("2026-08-14T09:00:00Z"),
    pending: true,
  },
];

/**
 * Membres de l'établissement.
 *
 * L'invitation ne crée pas de compte : elle envoie un lien signé, et
 * c'est le destinataire qui choisit son mot de passe. Créer le compte à
 * sa place obligerait à lui transmettre un mot de passe par un canal qui
 * n'est jamais sûr — et, dans un service qui trace chaque accès aux
 * images, un compte doit appartenir à une personne, pas à un poste.
 *
 * Les invitations en attente restent dans la liste, marquées comme
 * telles : autrement, personne ne se souvient de qui a été invité, et
 * l'invitation part deux fois.
 */
export default function TeamPage() {
  const { active } = useSession();
  const [inviting, setInviting] = React.useState(false);

  return (
    <>
      <PageHeader
        title="Équipe"
        description={`${DEMO_MEMBERS.length} membres · ${active.organizationName}`}
        actions={
          <Button size="sm" onClick={() => setInviting(true)}>
            <UserPlus />
            Inviter
          </Button>
        }
      />

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ul className="divide-y divide-border-subtle">
            {DEMO_MEMBERS.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-2xs font-semibold",
                    member.pending
                      ? "bg-surface-active text-tertiary"
                      : "bg-linear-to-br from-accent-500 to-accent-700 text-white",
                  )}
                  aria-hidden
                >
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {member.name}
                    </p>
                    {member.pending && (
                      <span className="rounded-full bg-progress-muted px-2 py-0.5 text-2xs font-medium text-progress">
                        Invitation en attente
                      </span>
                    )}
                  </div>
                  <p className="truncate text-2xs text-tertiary">
                    {member.email}
                  </p>
                </div>

                <span className="shrink-0 text-xs text-secondary">
                  {member.role}
                </span>
                <span className="w-32 shrink-0 text-right text-2xs text-tertiary">
                  {member.pending
                    ? "—"
                    : `Depuis le ${formatDate(member.joinedAt)}`}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Actions pour ${member.name}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Changer le rôle</DropdownMenuItem>
                    {member.pending && (
                      <DropdownMenuItem
                        onSelect={() => toast.success("Invitation renvoyée")}
                      >
                        Renvoyer l’invitation
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-urgent">
                      Retirer de l’équipe
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <InviteDialog open={inviting} onOpenChange={setInviting} />
    </>
  );
}

/** Invitation d'un nouveau membre. */
function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            Un lien d’invitation sera envoyé à cette adresse. Le destinataire
            choisit lui-même son mot de passe ; le lien expire au bout de sept
            jours.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 pb-4">
          <Field id="invite-email" label="Adresse électronique">
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="prenom.nom@etablissement.tg"
            />
          </Field>

          <Field
            id="invite-role"
            label="Rôle"
            hint="Un radiologue invité ici lit vos examens, que vous les ouvriez au pool ou non."
          >
            <select
              id="invite-role"
              className={cn(
                "h-8 w-full rounded-md px-2.5 text-sm",
                "border border-border-default bg-surface-base",
                "transition-colors hover:border-border-strong",
                "focus:border-accent focus:outline-none",
              )}
              defaultValue="staff"
            >
              <option value="staff">Manipulateur — envoie et suit</option>
              <option value="secretary">
                Secrétariat — suit et récupère les comptes-rendus
              </option>
              <option value="admin">
                Administrateur — gère l’équipe et les paramètres
              </option>
              <option value="radiologist">
                Radiologue — lit et signe vos examens
              </option>
            </select>
          </Field>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" size="sm">
              Annuler
            </Button>
          </DialogClose>
          <Button
            size="sm"
            disabled={!email.includes("@")}
            onClick={() => {
              toast.success("Invitation envoyée", { description: email });
              setEmail("");
              onOpenChange(false);
            }}
          >
            Envoyer l’invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
