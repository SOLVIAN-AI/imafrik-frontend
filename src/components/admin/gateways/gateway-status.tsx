import { type GatewayStatus, statusTone } from "@/lib/gateways";
import { cn } from "@/lib/utils";

const TONES = {
  done: "border-done/30 bg-done-muted text-done",
  progress: "border-progress/30 bg-progress-muted text-progress",
  urgent: "border-urgent/30 bg-urgent-muted text-urgent",
  neutral: "border-border-default bg-surface-sunken text-tertiary",
} as const;

const DOTS = {
  done: "bg-done",
  progress: "bg-progress",
  urgent: "bg-urgent",
  neutral: "bg-tertiary",
} as const;

/**
 * Pastille du statut d'une passerelle : une couleur et un mot, jamais la
 * couleur seule.
 *
 * @param status Statut, tel que le service le nomme.
 * @param label  Son libellé, dans la langue de l'utilisateur.
 */
export function GatewayStatusBadge({
  status,
  label,
  className,
}: {
  status: GatewayStatus;
  label: string;
  className?: string;
}) {
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOTS[tone])} aria-hidden />
      {label}
    </span>
  );
}
