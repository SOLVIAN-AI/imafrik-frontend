import { CircleDashed, Clock, ShieldCheck } from "lucide-react";

import type { CredentialStatus } from "@/lib/credentials";
import { cn } from "@/lib/utils";

/** Teinte et icône de chaque état : l'icône double la couleur. */
const STYLES: Record<
  CredentialStatus,
  { className: string; icon: typeof ShieldCheck }
> = {
  verified: { className: "bg-done-muted text-done", icon: ShieldCheck },
  pending: { className: "bg-progress-muted text-progress", icon: Clock },
  missing: {
    className: "bg-surface-active text-secondary",
    icon: CircleDashed,
  },
};

/**
 * Pastille de validation d'un numéro d'ordre.
 *
 * Même dessin que les pastilles d'état d'un examen, avec une icône par
 * état pour ne pas reposer sur la seule couleur. Le libellé est fourni
 * par l'écran : le radiologue lit « Validé par IMAFRIK », l'équipe
 * IMAFRIK « Validé ».
 *
 * @param id     Identifiant facultatif, pour `aria-describedby`.
 * @param status Validé, en attente ou manquant.
 * @param label  Libellé, dans la langue de l'utilisateur.
 */
export function CredentialChip({
  id,
  status,
  label,
  className,
}: {
  /** Identifiant, pour qu'un champ voisin y renvoie (`aria-describedby`). */
  id?: string;
  status: CredentialStatus;
  label: string;
  className?: string;
}) {
  const { className: tone, icon: Icon } = STYLES[status];
  return (
    <span
      id={id}
      data-credential-status={status}
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
