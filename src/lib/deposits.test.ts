import { describe, expect, it } from "vitest";

import {
  awaitsIntegration,
  depositStateOf,
  FIRST_CHUNK_BYTES,
  groupIgnored,
  headDigest,
  INTEGRATION_WAIT_MS,
  localRefusal,
  looksLikeZip,
  matchInterrupted,
  MAX_CHUNK_BYTES,
  MIN_CHUNK_BYTES,
  nextChunkSize,
  remainingSeconds,
  sha256Hex,
  ThroughputMeter,
} from "@/lib/deposits";

const KIB = 1024;
const MIB = 1024 * KIB;
const ZIP = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);

describe("état d’un dépôt", () => {
  it("regroupe les étapes du service en cinq états de liste", () => {
    expect(depositStateOf("uploading")).toBe("uploading");
    expect(depositStateOf("received")).toBe("processing");
    expect(depositStateOf("processing")).toBe("processing");
    expect(depositStateOf("done")).toBe("done");
    expect(depositStateOf("refused")).toBe("refused");
    expect(depositStateOf("cancelled")).toBe("abandoned");
    expect(depositStateOf("expired")).toBe("abandoned");
  });
});

describe("taille des morceaux", () => {
  it("commence petit, avant toute mesure", () => {
    expect(nextChunkSize(null)).toBe(FIRST_CHUNK_BYTES);
    expect(nextChunkSize(0)).toBe(FIRST_CHUNK_BYTES);
  });

  it("vise une quinzaine de secondes au débit mesuré", () => {
    // 1 Mo/s : 15 Mo par morceau, arrondis à 64 Kio.
    expect(nextChunkSize(MIB)).toBe(15 * MIB);
    // 256 kbit/s (32 Kio/s) : 480 Kio, arrondis à 448 Kio (sept fois 64).
    expect(nextChunkSize(32 * KIB)).toBe(448 * KIB);
  });

  it("reste entre 256 Kio et 16 Mio, loin des 60 s du relais", () => {
    expect(nextChunkSize(1 * KIB)).toBe(MIN_CHUNK_BYTES);
    expect(nextChunkSize(100 * MIB)).toBe(MAX_CHUNK_BYTES);
    // Le plus gros morceau au plus faible débit qui le choisit tient en
    // moins de 20 secondes.
    const rate = MAX_CHUNK_BYTES / 15;
    expect(nextChunkSize(rate) / rate).toBeLessThan(20);
  });
});

describe("débit et temps restant", () => {
  it("n’annonce rien avant deux secondes de mesure", () => {
    const meter = new ThroughputMeter();
    meter.add(0, 0);
    meter.add(1_000, 100 * KIB);
    expect(meter.bytesPerSecond()).toBeNull();
  });

  it("lisse le débit sur les vingt dernières secondes", () => {
    const meter = new ThroughputMeter();
    // Une minute à 10 Kio/s, puis dix secondes à 100 Kio/s.
    for (let second = 0; second <= 60; second += 1) {
      meter.add(second * 1_000, second * 10 * KIB);
    }
    for (let second = 61; second <= 70; second += 1) {
      meter.add(second * 1_000, 600 * KIB + (second - 60) * 100 * KIB);
    }
    const rate = meter.bytesPerSecond()!;
    // Ni le débit d'il y a une minute, ni seulement le dernier élan.
    expect(rate).toBeGreaterThan(40 * KIB);
    expect(rate).toBeLessThan(100 * KIB);
  });

  it("repart de zéro après une coupure", () => {
    const meter = new ThroughputMeter();
    meter.add(0, 0);
    meter.add(5_000, 500 * KIB);
    meter.reset();
    expect(meter.bytesPerSecond()).toBeNull();
  });

  it("donne le temps restant en secondes, s’il se calcule", () => {
    expect(remainingSeconds(10 * MIB, MIB)).toBe(10);
    expect(remainingSeconds(10 * MIB, null)).toBeNull();
    expect(remainingSeconds(-5, MIB)).toBe(0);
  });
});

describe("contrôle avant l’envoi", () => {
  it("reconnaît une archive ZIP à ses premiers octets", () => {
    expect(looksLikeZip(ZIP)).toBe(true);
    expect(looksLikeZip(new Uint8Array([0x50, 0x4b, 0x05, 0x06]))).toBe(true);
    // Un DICOM commence par 128 octets nuls ; un PDF par %PDF.
    expect(looksLikeZip(new Uint8Array(4))).toBe(false);
    expect(looksLikeZip(new TextEncoder().encode("%PDF"))).toBe(false);
  });

  it("refuse avant de partir ce que le service refuserait", () => {
    const max = 2 * 1024 * MIB;
    expect(localRefusal({ size: 10 * MIB, head: ZIP }, max)).toBeNull();
    expect(localRefusal({ size: 0, head: ZIP }, max)).toBe("empty");
    expect(localRefusal({ size: max + 1, head: ZIP }, max)).toBe("too_large");
    expect(localRefusal({ size: 10, head: new Uint8Array(4) }, max)).toBe(
      "not_zip",
    );
  });
});

describe("reprise d’un envoi interrompu", () => {
  const interrupted = [
    {
      id: "a",
      fileName: "scanner.zip",
      sizeBytes: 600 * MIB,
      receivedBytes: 250 * MIB,
      headSha256: "aa".repeat(32),
    },
    {
      id: "b",
      fileName: "irm.zip",
      sizeBytes: 600 * MIB,
      receivedBytes: 10 * MIB,
      headSha256: null,
    },
  ];

  it("reprend l’envoi du même fichier : même taille, même empreinte", () => {
    expect(
      matchInterrupted(
        { size: 600 * MIB, headSha256: "aa".repeat(32) },
        interrupted,
      )?.id,
    ).toBe("a");
  });

  it("ne mêle jamais deux fichiers de même taille", () => {
    expect(
      matchInterrupted(
        { size: 600 * MIB, headSha256: "bb".repeat(32) },
        interrupted,
      ),
    ).toBeNull();
    expect(
      matchInterrupted({ size: 1, headSha256: "aa".repeat(32) }, interrupted),
    ).toBeNull();
  });

  it("empreint le premier Mio, et lui seul", async () => {
    const head = new Uint8Array(MIB).fill(7);
    const a = new Blob([head, new Uint8Array(10).fill(1)]);
    const b = new Blob([head, new Uint8Array(10).fill(2)]);
    expect(await headDigest(a)).toBe(await headDigest(b));
    expect(await sha256Hex(new TextEncoder().encode("abc").buffer)).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("compte rendu", () => {
  it("regroupe les fichiers ignorés par raison, dans l’ordre du compte rendu", () => {
    expect(
      groupIgnored([
        { name: ".DS_Store", reason: "system_file" },
        { name: "LISEZMOI.txt", reason: "not_dicom" },
        { name: "IM9", reason: "other_clinic" },
        { name: "photo.jpg", reason: "not_dicom" },
      ]),
    ).toEqual([
      { reason: "other_clinic", names: ["IM9"] },
      { reason: "not_dicom", names: ["LISEZMOI.txt", "photo.jpg"] },
      { reason: "system_file", names: [".DS_Store"] },
    ]);
  });

  it("attend un examen tant qu’il peut encore arriver", () => {
    const processedAt = new Date(Date.parse("2026-10-30T10:00:00Z"));
    const report = {
      status: "done" as const,
      processedAt,
      studies: [{ accepted: true, studyId: null }],
    };
    const soon = processedAt.getTime() + 60_000;
    expect(awaitsIntegration(report, soon)).toBe(true);
    expect(
      awaitsIntegration(
        report,
        processedAt.getTime() + INTEGRATION_WAIT_MS + 1,
      ),
    ).toBe(false);
    expect(
      awaitsIntegration(
        { ...report, studies: [{ accepted: true, studyId: "x" }] },
        soon,
      ),
    ).toBe(false);
    // Un examen d'une autre clinique ne s'attend pas : il ne viendra jamais.
    expect(
      awaitsIntegration(
        { ...report, studies: [{ accepted: false, studyId: null }] },
        soon,
      ),
    ).toBe(false);
  });
});
