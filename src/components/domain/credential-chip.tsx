import { CircleDashed, Clock, ShieldAlert, ShieldCheck } from "lucide-react";

import type { CredentialState } from "@/lib/credentials";
import { cn } from "@/lib/utils";

/** Teinte et icône de chaque état : l'icône double la couleur. */
const STYLES: Record<
  CredentialState,
  { className: string; icon: typeof ShieldCheck }
> = {
  verified: { className: "bg-done-muted text-done", icon: ShieldCheck },
  pending: { className: "bg-progress-muted text-progress", icon: Clock },
  expired: { className: "bg-urgent-muted text-urgent", icon: ShieldAlert },
  undeclared: {
    className: "bg-surface-active text-secondary",
    icon: CircleDashed,
  },
  license_missing: {
    className: "bg-surface-active text-secondary",
    icon: CircleDashed,
  },
  documents_missing: {
    className: "bg-surface-active text-secondary",
    icon: CircleDashed,
  },
};

/**
 * Pastille d'habilitation d'un radiologue.
 *
 * Même dessin que les pastilles d'état d'un examen, avec une icône par
 * état pour ne pas reposer sur la seule couleur. Le libellé est fourni
 * par l'écran : le radiologue lit « Validé par IMAFRIK », l'équipe
 * IMAFRIK « Habilité ».
 *
 * @param id    Identifiant facultatif, pour `aria-describedby`.
 * @param state État calculé par la base.
 * @param label Libellé, dans la langue de l'utilisateur.
 */
export function CredentialChip({
  id,
  state,
  label,
  className,
}: {
  /** Identifiant, pour qu'un champ voisin y renvoie (`aria-describedby`). */
  id?: string;
  state: CredentialState;
  label: string;
  className?: string;
}) {
  const { className: tone, icon: Icon } = STYLES[state];
  return (
    <span
      id={id}
      data-credential-status={state}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
