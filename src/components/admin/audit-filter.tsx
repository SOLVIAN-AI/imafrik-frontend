"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Select } from "@/components/ui/input";
import { useMessages } from "@/i18n/client";

/**
 * Filtre du journal par action. Changer de filtre repart des entrées les
 * plus récentes : le curseur n'a de sens que pour un filtre donné.
 */
export function AuditFilter({ current }: { current: string }) {
  const t = useMessages();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  return (
    <Select
      aria-label={t.admin.filters.byAction}
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
      <option value="">{t.admin.filters.allActions}</option>
      {Object.entries(t.admin.audit.actions).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
