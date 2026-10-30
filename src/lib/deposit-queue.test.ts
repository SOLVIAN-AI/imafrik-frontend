import { describe, expect, it, vi } from "vitest";

import { DepositQueue, type QueueConfig } from "@/lib/deposit-queue";
import type { UploadOptions, UploadPhase } from "@/lib/deposit-upload";
import { depositIdOf } from "@/lib/deposit-upload";
import { headDigest } from "@/lib/deposits";

const ZIP_HEAD = [0x50, 0x4b, 0x03, 0x04];

function zip(name: string, size = 64): File {
  const bytes = new Uint8Array(size);
  bytes.set(ZIP_HEAD);
  return new File([bytes], name, { type: "application/zip" });
}

/** Une file dont les envois sont pilotés par le test. */
function harness(overrides: Partial<QueueConfig> = {}) {
  const started: UploadOptions[] = [];
  const grants = vi.fn(async () => ({
    endpoint: "https://api.test/deposits/files",
    token: "jeton",
    expiresIn: 1800,
  }));
  const settled = vi.fn();
  const config: QueueConfig = {
    clinicId: "clinique-a",
    maxArchiveBytes: 1000,
    interrupted: [],
    grant: grants,
    start: (options) => {
      started.push(options);
      return {
        pause: vi.fn(),
        resume: vi.fn(),
        cancel: async () => options.onPhase({ kind: "cancelled" }),
      };
    },
    demo: false,
    locale: "fr",
    refusedMessage: (status) => `refus ${status}`,
    tokenMessage: "jeton refusé",
    chooseClinicMessage: "choisissez une clinique",
    onSettled: settled,
    ...overrides,
  };
  const queue = new DepositQueue(config);
  const phase = (index: number, value: UploadPhase) =>
    started[index].onPhase(value);
  return { queue, config, started, grants, settled, phase };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("file des archives", () => {
  it("envoie les archives l’une après l’autre", async () => {
    const { queue, started, phase, settled } = harness();
    await queue.add([zip("a.zip"), zip("b.zip")]);
    expect(started.map((options) => options.file.name)).toEqual(["a.zip"]);
    expect(queue.getSnapshot().map((item) => item.phase.kind)).toEqual([
      "queued",
      "queued",
    ]);

    phase(0, { kind: "received", depositId: "d1" });
    await flush();
    expect(settled).toHaveBeenCalledTimes(1);
    expect(started.map((options) => options.file.name)).toEqual([
      "a.zip",
      "b.zip",
    ]);
  });

  it("refuse avant de partir ce qui n’est pas une archive, ou trop gros", async () => {
    const { queue, started } = harness();
    const pdf = new File(["%PDF-1.7"], "cr.pdf");
    await queue.add([pdf, zip("gros.zip", 2000)]);
    expect(queue.getSnapshot().map((item) => item.refusal)).toEqual([
      "not_zip",
      "too_large",
    ]);
    expect(started).toEqual([]);
  });

  it("reprend l’envoi interrompu du même fichier, à son adresse", async () => {
    const file = zip("scanner.zip", 300);
    const headSha256 = await headDigest(file);
    const { queue, started } = harness({
      interrupted: [
        {
          id: "depot-42",
          fileName: "scanner.zip",
          sizeBytes: 300,
          receivedBytes: 120,
          headSha256,
        },
      ],
    });
    await queue.add([file]);
    expect(started[0].uploadUrl).toBe(
      "https://api.test/deposits/files/depot-42",
    );
    expect(started[0].headSha256).toBe(headSha256);
    expect(queue.getSnapshot()[0].resumeOf?.id).toBe("depot-42");
  });

  it("commence un nouvel envoi pour un autre fichier de même taille", async () => {
    const { queue, started } = harness({
      interrupted: [
        {
          id: "depot-42",
          fileName: "scanner.zip",
          sizeBytes: 300,
          receivedBytes: 120,
          headSha256: "00".repeat(32),
        },
      ],
    });
    await queue.add([zip("scanner.zip", 300)]);
    expect(started[0].uploadUrl).toBeNull();
  });

  it("garde le jeton tant qu’il vaut, et en redemande un pour une autre clinique", async () => {
    const { queue, config, started, grants, phase } = harness();
    await queue.add([zip("a.zip")]);
    expect(await started[0].getToken()).toBe("jeton");
    expect(await started[0].getToken()).toBe("jeton");
    expect(grants).toHaveBeenCalledTimes(1);

    phase(0, { kind: "received", depositId: "d1" });
    queue.configure({ ...config, clinicId: "clinique-b" });
    await queue.add([zip("b.zip")]);
    await flush();
    expect(grants).toHaveBeenCalledTimes(2);
    expect(grants).toHaveBeenLastCalledWith("clinique-b");
  });

  it("ne part pas sans clinique choisie", async () => {
    const { queue, started } = harness({ clinicId: null });
    await queue.add([zip("a.zip")]);
    expect(started).toEqual([]);
    const [item] = queue.getSnapshot();
    expect(item.phase).toMatchObject({
      kind: "failed",
      message: "choisissez une clinique",
    });
  });

  it("dit le refus du service s’il ne remet pas de jeton", async () => {
    const { queue, started } = harness({
      grant: async () => ({ error: "Clinique suspendue" }),
    });
    await queue.add([zip("a.zip")]);
    expect(started).toEqual([]);
    expect(queue.getSnapshot()[0].phase).toMatchObject({
      kind: "failed",
      message: "Clinique suspendue",
    });
  });

  it("sait quand un envoi est en route, et quand une archive attend son contrôle", async () => {
    const { queue, phase } = harness();
    await queue.add([zip("a.zip")]);
    phase(0, {
      kind: "sending",
      sent: 10,
      total: 64,
      bytesPerSecond: null,
      remainingSeconds: null,
    });
    expect(queue.sending).toBe(true);
    phase(0, { kind: "offline", sent: 10, total: 64 });
    expect(queue.sending).toBe(true);
    phase(0, { kind: "received", depositId: "d1" });
    expect(queue.sending).toBe(false);
    expect(queue.awaitingCheck).toBe(true);
  });

  it("annule une archive en route, et retire une archive terminée", async () => {
    const { queue } = harness();
    await queue.add([zip("a.zip")]);
    const [item] = queue.getSnapshot();
    expect(queue.controllable(item.key)).toBe(true);
    await queue.cancel(item.key);
    expect(queue.getSnapshot()[0].phase.kind).toBe("cancelled");
    queue.remove(item.key);
    expect(queue.getSnapshot()).toEqual([]);
  });
});

describe("adresse d’un envoi", () => {
  it("donne l’identifiant du dépôt", () => {
    expect(depositIdOf("https://api.test/deposits/files/abc-123")).toBe(
      "abc-123",
    );
    expect(depositIdOf("/deposits/files/abc-123?x=1")).toBe("abc-123");
    expect(depositIdOf(null)).toBeNull();
  });
});
