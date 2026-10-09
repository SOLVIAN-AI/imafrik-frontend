import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { messagesFor } from "@/i18n";
import { auditLabel, isAuditAction } from "@/lib/audit-actions";

/**
 * Actions du filtre du journal, relues du contrat généré : la liste que le
 * service tient à jour d'après ce que ses migrations et son code écrivent.
 */
function contractActions(): string[] {
  const schema = readFileSync(
    fileURLToPath(new URL("./api/schema.d.ts", import.meta.url)),
    "utf8",
  );
  const operation = schema.slice(
    schema.indexOf("list_audit_admin_audit_get: {"),
  );
  const union = /action\?: \(([^)]*)\)/.exec(operation)?.[1] ?? "";
  return [...union.matchAll(/"([a-z_]+\.[a-z_]+)"/g)].map((m) => m[1]);
}

describe("libellés du journal d'audit", () => {
  it.each(["fr", "en"] as const)(
    "nomment chaque action enregistrée par le service (%s)",
    (locale) => {
      const t = messagesFor(locale);
      const actions = contractActions();
      expect(actions).toContain("profile.identity_changed");
      expect(actions.filter((action) => !isAuditAction(action, t))).toEqual([]);
      expect(Object.keys(t.admin.audit.actions).sort()).toEqual(
        [...actions].sort(),
      );
    },
  );

  it("le changement d'identité d'un signataire se filtre et se nomme", () => {
    const t = messagesFor("en");
    expect(isAuditAction("profile.identity_changed", t)).toBe(true);
    expect(auditLabel("profile.identity_changed", t)).toBe(
      "Name, title or registration number changed",
    );
  });
});
