"use client";

import { AlertTriangle } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";
import { applyGatewayAction } from "@/lib/actions/gateways";
import {
  ACTIONS_WITH_REASON,
  type GatewayAction,
  type GatewayStatus,
  REASON_MAX,
  availableActions,
  groupFingerprint,
  reasonProblem,
} from "@/lib/gateways";
import { cn } from "@/lib/utils";

/** Ce que l'équipe vérifie avant d'approuver une passerelle. */
export interface ApprovalFacts {
  hostname: string;
  machineGuid: string | null;
  enrolledFromIp: string | null;
  tailscaleHostname: string | null;
  /** Nœud en ligne sur le réseau privé ; `null` si l'état est inconnu. */
  online: boolean | null;
  fingerprint: string | null;
}

/** Variante des boutons de chaque geste. */
const VARIANTS: Record<GatewayAction, "primary" | "secondary" | "danger"> = {
  approve: "primary",
  reject: "danger",
  suspend: "secondary",
  resume: "primary",
  revoke: "danger",
  renew: "secondary",
};

/**
 * Gestes possibles sur une passerelle, chacun derrière une boîte de
 * confirmation.
 *
 * Seuls les gestes que le statut permet sont proposés (même table que le
 * service, `availableActions`). Chaque boîte dit ce que le geste
 * enclenche :
 *
 * - **approuver** rappelle ce qu'il faut vérifier avec la clinique au
 *   téléphone, et montre les faits à vérifier (poste, MachineGuid,
 *   adresse d'enrôlement, nœud, empreinte) ;
 * - **rejeter, suspendre, révoquer** exigent un motif, conservé au
 *   journal d'audit ;
 * - **révoquer**, définitif, exige en plus de cocher qu'on l'a compris.
 *
 * @param gatewayId Passerelle.
 * @param status    Son statut.
 * @param facts     Ce que la boîte d'approbation montre.
 * @param size      `sm` dans une liste, `md` sur la fiche.
 */
export function GatewayActions({
  gatewayId,
  status,
  facts,
  size = "sm",
  className,
}: {
  gatewayId: string;
  status: GatewayStatus;
  facts: ApprovalFacts;
  size?: "sm" | "md";
  className?: string;
}) {
  const text = useMessages().gateways;
  const [action, setAction] = React.useState<GatewayAction | null>(null);
  const actions = availableActions(status);
  if (actions.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {actions.map((candidate) => (
        <Button
          key={candidate}
          type="button"
          size={size}
          variant={VARIANTS[candidate]}
          onClick={() => setAction(candidate)}
          aria-label={`${text.actions[candidate]} · ${facts.hostname}`}
        >
          {text.actions[candidate]}
        </Button>
      ))}
      {action && (
        <ActionDialog
          key={action}
          gatewayId={gatewayId}
          action={action}
          facts={facts}
          onClose={() => setAction(null)}
        />
      )}
    </div>
  );
}

/** Boîte de confirmation d'un geste. */
function ActionDialog({
  gatewayId,
  action,
  facts,
  onClose,
}: {
  gatewayId: string;
  action: GatewayAction;
  facts: ApprovalFacts;
  onClose: () => void;
}) {
  const t = useMessages();
  const text = t.gateways;
  const router = useRouter();
  const [reason, setReason] = React.useState("");
  const [understood, setUnderstood] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const needsReason = ACTIONS_WITH_REASON.has(action);
  const problem = needsReason ? reasonProblem(reason) : null;
  const ready =
    problem === null && (action !== "revoke" || understood) && !pending;
  const reasonError =
    touched && problem
      ? problem === "short"
        ? text.dialogs.reasonTooShort
        : text.dialogs.reasonTooLong
      : undefined;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!ready) return;
    setError(null);
    startTransition(async () => {
      const result = await applyGatewayAction(
        gatewayId,
        action,
        needsReason ? reason : undefined,
      );
      if (result.ok) {
        toast.success(text.dialogs[action].done(facts.hostname));
        onClose();
        router.refresh();
        return;
      }
      setError(result.error);
      // Statut changé entre-temps (autre session, activation) : la fiche
      // se relit pour montrer l'état réel.
      if (result.status === 409) router.refresh();
    });
  };

  const dialog = text.dialogs[action];
  const destructive = action === "reject" || action === "revoke";

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>{dialog.title(facts.hostname)}</DialogTitle>
            <DialogDescription>{dialog.description}</DialogDescription>
          </DialogHeader>

          <div className="flex max-h-[60dvh] flex-col gap-4 overflow-y-auto px-5 pb-5">
            {action === "approve" && <ApprovalChecks facts={facts} />}

            {action === "revoke" && (
              <ul className="flex list-disc flex-col gap-1.5 pl-4 text-xs leading-relaxed text-secondary">
                {text.dialogs.revoke.consequences.map((consequence) => (
                  <li key={consequence}>{consequence}</li>
                ))}
              </ul>
            )}

            {needsReason && (
              <Field
                id={`gateway-reason-${action}`}
                label={text.dialogs.reasonLabel}
                hint={text.dialogs.reasonHint}
                error={reasonError}
              >
                <Textarea
                  id={`gateway-reason-${action}`}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={
                    "placeholder" in dialog ? dialog.placeholder : undefined
                  }
                  maxLength={REASON_MAX}
                  rows={3}
                  required
                  aria-invalid={reasonError ? true : undefined}
                  aria-describedby={`gateway-reason-${action}-description`}
                  autoFocus
                />
              </Field>
            )}

            {action === "revoke" && (
              <label className="flex cursor-pointer items-start gap-2.5 text-xs">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(event) => setUnderstood(event.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-urgent"
                />
                <span className="font-medium">
                  {text.dialogs.revoke.confirm}
                </span>
              </label>
            )}

            {error && (
              <p
                role="alert"
                className="flex gap-2 rounded-lg bg-urgent-muted px-3 py-2.5 text-xs text-urgent"
              >
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden
                />
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={pending}
            >
              {t.common.actions.cancel}
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={destructive ? "danger" : "primary"}
              loading={pending}
              disabled={!ready}
            >
              {dialog.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Ce que l'équipe vérifie avant d'approuver : la liste des contrôles, et
 * en regard les faits relevés à l'enrôlement.
 */
function ApprovalChecks({ facts }: { facts: ApprovalFacts }) {
  const text = useMessages().gateways;
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: text.detail.hostname, value: facts.hostname },
    { label: text.detail.machineGuid, value: facts.machineGuid ?? "—" },
    { label: text.detail.enrolledFrom, value: facts.enrolledFromIp ?? "—" },
    {
      label: text.detail.tailscaleHostname,
      value: (
        <>
          {facts.tailscaleHostname ?? "—"}
          <span
            className={cn(
              "ml-2 text-2xs",
              facts.online ? "text-done" : "text-progress",
            )}
          >
            {facts.online === null
              ? text.nodeStateUnknown
              : facts.online
                ? text.online
                : text.offline}
          </span>
        </>
      ),
    },
    {
      label: text.detail.certificateColumns.fingerprint,
      value: facts.fingerprint ? groupFingerprint(facts.fingerprint) : "—",
    },
  ];
  return (
    <>
      <ol className="flex list-decimal flex-col gap-1 pl-4 text-xs leading-relaxed text-secondary">
        {text.dialogs.approve.checks.map((check) => (
          <li key={check}>{check}</li>
        ))}
      </ol>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg border border-border-subtle bg-surface-sunken p-3 text-xs sm:grid-cols-[auto_1fr]">
        {rows.map((row) => (
          <React.Fragment key={row.label}>
            <dt className="text-tertiary">{row.label}</dt>
            <dd className="min-w-0 font-mono text-2xs break-all select-all">
              {row.value}
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </>
  );
}
