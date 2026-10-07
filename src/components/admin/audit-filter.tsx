"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Select } from "@/components/ui/input";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";

/**
 * Filtre du journal par action. Changer de filtre repart des entrées les
 * plus récentes : le curseur n'a de sens que pour un filtre donné.
 */
export function AuditFilter({ current }: { current: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Select
      aria-label="Filtrer par action"
      value={current}
      disabled={pending}
      onChange={(event) => {
        const value = event.target.value;
        startTransition(() =>
          router.push(
            value
              ? `/admin/audit?action=${encodeURIComponent(value)}`
              : "/admin/audit",
          ),
        );
      }}
      className="w-auto min-w-[12rem]"
    >
      <option value="">Toutes les actions</option>
      {Object.entries(AUDIT_ACTIONS).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
