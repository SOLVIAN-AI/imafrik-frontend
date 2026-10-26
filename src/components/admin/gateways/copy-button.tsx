"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

/**
 * Bouton qui copie une valeur dans le presse-papiers, et le confirme.
 *
 * Si le navigateur refuse la copie, le message d'échec le dit : la valeur
 * reste affichée et sélectionnable d'un geste (`select-all`), jamais
 * perdue.
 *
 * @param value  Valeur à copier.
 * @param label  Intitulé du bouton.
 * @param copied Intitulé une fois la valeur copiée.
 * @param failed Message si la copie est refusée.
 */
export function CopyButton({
  value,
  label,
  copied,
  failed,
  variant = "secondary",
}: {
  value: string;
  label: string;
  copied: string;
  failed: string;
  variant?: "secondary" | "ghost";
}) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">(
    "idle",
  );

  React.useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2500);
    return () => clearTimeout(timer);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" size="sm" variant={variant} onClick={copy}>
        {state === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
        {state === "copied" ? copied : label}
      </Button>
      <span role="status" className="text-2xs text-urgent">
        {state === "failed" ? failed : ""}
      </span>
    </span>
  );
}
