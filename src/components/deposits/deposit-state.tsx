import type { AppMessages } from "@/i18n";
import type { DepositState } from "@/lib/deposits";
import { cn } from "@/lib/utils";

/** Teinte de chaque état : la couleur seule ne dit jamais rien, le mot si. */
const TONES: Record<DepositState, string> = {
  uploading: "border-progress/30 bg-progress-muted text-progress",
  processing: "border-accent/30 bg-accent-muted text-accent",
  done: "border-done/30 bg-done-muted text-done",
  refused: "border-urgent/30 bg-urgent-muted text-urgent",
  abandoned: "border-border-default bg-surface-sunken text-tertiary",
};

const DOTS: Record<DepositState, string> = {
  uploading: "bg-progress",
  processing: "bg-accent",
  done: "bg-done",
  refused: "bg-urgent",
  abandoned: "bg-tertiary",
};

/**
 * Pastille de l'état d'un dépôt : en cours d'envoi, en contrôle, intégré,
 * refusé, abandonné.
 *
 * @param state État du dépôt.
 * @param t     Textes de l'application.
 */
export function DepositStateBadge({
  state,
  t,
  className,
}: {
  state: DepositState;
  t: AppMessages;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-medium whitespace-nowrap",
        TONES[state],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOTS[state])} aria-hidden />
      {t.deposits.states[state]}
    </span>
  );
}
