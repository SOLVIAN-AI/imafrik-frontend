// @vitest-environment happy-dom
import { createHmac } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { EMPTY_REPORT_SECTIONS } from "@/components/editor/sections";
import {
  BACKUP_TTL_MS,
  clearReportBackups,
  importBackupKey,
  purgeStaleBackups,
  readReportBackup,
  writeReportBackup,
} from "@/lib/editor/backup";

const REPORT = "4f1c2a9e-0d3b-4c5e-8f6a-7b8c9d0e1f2a";
const SECTIONS = {
  ...EMPTY_REPORT_SECTIONS,
  conclusion: "<p>Nodule pulmonaire chez KOFFI Ama.</p>",
};

/** Clé telle que le serveur la dérive pour un compte. */
async function keyFor(userId: string): Promise<CryptoKey> {
  const raw = createHmac("sha256", "secret-de-test-assez-long")
    .update(`imafrik/report-backup/v1/${userId}`)
    .digest("base64");
  const key = await importBackupKey(raw);
  if (!key) throw new Error("clé non importée");
  return key;
}

const backup = (savedAt = new Date().toISOString()) => ({
  sections: SECTIONS,
  baseVersion: 3,
  savedAt,
});

afterEach(() => window.localStorage.clear());

describe("copie de secours chiffrée", () => {
  it("ne laisse jamais le texte en clair dans le stockage", async () => {
    await writeReportBackup(await keyFor("a"), REPORT, backup());
    const stored = Object.values(window.localStorage).join("");
    expect(stored).not.toContain("KOFFI");
    expect(stored).not.toContain("Nodule");
  });

  it("rend la copie à son auteur", async () => {
    const key = await keyFor("a");
    await writeReportBackup(key, REPORT, backup());
    const read = await readReportBackup(key, REPORT);
    expect(read.status).toBe("found");
    if (read.status === "found") {
      expect(read.backup.sections).toEqual(SECTIONS);
      expect(read.backup.baseVersion).toBe(3);
    }
  });

  it("ne livre rien à un autre compte, et ne détruit pas la copie", async () => {
    await writeReportBackup(await keyFor("a"), REPORT, backup());
    expect((await readReportBackup(await keyFor("b"), REPORT)).status).toBe(
      "locked",
    );
    expect((await readReportBackup(await keyFor("a"), REPORT)).status).toBe(
      "found",
    );
  });

  it("refuse une copie déplacée sur un autre compte-rendu", async () => {
    const key = await keyFor("a");
    await writeReportBackup(key, REPORT, backup());
    const moved = window.localStorage.getItem(
      `imafrik.report-backup:${REPORT}`,
    );
    window.localStorage.setItem("imafrik.report-backup:autre", moved ?? "");
    expect((await readReportBackup(key, "autre")).status).toBe("locked");
  });

  it("écarte une copie expirée sans la lire", async () => {
    const key = await keyFor("a");
    const old = new Date(Date.now() - BACKUP_TTL_MS - 1000).toISOString();
    await writeReportBackup(key, REPORT, backup(old));
    expect((await readReportBackup(key, REPORT)).status).toBe("none");
    expect(window.localStorage.length).toBe(0);
  });

  it("efface les copies en clair de l'ancien format et les expirées", async () => {
    window.localStorage.setItem(
      "imafrik.report-backup:ancien",
      JSON.stringify(backup()),
    );
    const key = await keyFor("a");
    await writeReportBackup(key, REPORT, backup());
    await writeReportBackup(
      key,
      "expire",
      backup(new Date(Date.now() - BACKUP_TTL_MS - 1000).toISOString()),
    );
    window.localStorage.setItem("autre-application", "garde");

    purgeStaleBackups();

    expect(Object.keys(window.localStorage).sort()).toEqual([
      "autre-application",
      `imafrik.report-backup:${REPORT}`,
    ]);
  });

  it("efface toutes les copies à la déconnexion", async () => {
    await writeReportBackup(await keyFor("a"), REPORT, backup());
    clearReportBackups();
    expect(window.localStorage.length).toBe(0);
  });
});
