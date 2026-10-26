import { describe, expect, it } from "vitest";

import {
  drawingProblem,
  isPinFormat,
  isPinLocked,
  isPinRefusal,
  isTrivialPin,
  newPinProblem,
  parsePinProof,
  pinBody,
  SIGNING_IMAGE_MAX_BYTES,
  signingImageMaxBase64Length,
  type StrokePoint,
} from "@/lib/signing";

describe("code personnel", () => {
  it("compte exactement six chiffres", () => {
    expect(isPinFormat("482913")).toBe(true);
    for (const value of [
      "",
      "48291",
      "4829130",
      "48291a",
      " 48291",
      "４８２９１３",
    ]) {
      expect(isPinFormat(value)).toBe(false);
    }
  });

  it("refuse les codes qui se devinent, comme le service", () => {
    for (const pin of [
      "000000",
      "111111",
      "123456",
      "654321",
      "012345",
      "987654",
    ]) {
      expect(isTrivialPin(pin)).toBe(true);
    }
    for (const pin of ["482913", "120456", "112233", "135791"]) {
      expect(isTrivialPin(pin)).toBe(false);
    }
  });

  it("dit le premier problème d’un code à créer", () => {
    expect(newPinProblem("4829", "4829")).toBe("format");
    expect(newPinProblem("123456", "123456")).toBe("trivial");
    expect(newPinProblem("482913", "482914")).toBe("mismatch");
    expect(newPinProblem("482913", "482913")).toBeNull();
  });

  it("relit une preuve venue du navigateur avant de l’envoyer", () => {
    expect(parsePinProof({ pin: "482913" })).toEqual({ pin: "482913" });
    expect(
      parsePinProof({
        pin: "482913",
        definePin: true,
        pinConfirmation: "482913",
      }),
    ).toEqual({ pin: "482913", definePin: true, pinConfirmation: "482913" });
    // Création sans seconde saisie, code mal formé, valeur quelconque.
    expect(parsePinProof({ pin: "482913", definePin: true })).toBeNull();
    expect(parsePinProof({ pin: "48291" })).toBeNull();
    expect(parsePinProof("482913")).toBeNull();
    expect(parsePinProof(null)).toBeNull();
  });

  it("forme le corps attendu par le service", () => {
    expect(pinBody({ pin: "482913" })).toEqual({
      pin: "482913",
      define_pin: false,
    });
    expect(
      pinBody({ pin: "482913", definePin: true, pinConfirmation: "482913" }),
    ).toEqual({
      pin: "482913",
      define_pin: true,
      pin_confirmation: "482913",
    });
  });

  it("reconnaît les refus du service qui portent sur le code", () => {
    expect(isPinRefusal("pin_wrong")).toBe(true);
    expect(isPinRefusal("pin_not_set")).toBe(true);
    expect(isPinRefusal("pin_locked")).toBe(true);
    expect(isPinRefusal(undefined)).toBe(false);
    expect(isPinRefusal("toString")).toBe(false);
  });

  it("tient le verrou jusqu’à son échéance", () => {
    const now = new Date("2026-10-26T10:00:00Z");
    expect(isPinLocked(null, now)).toBe(false);
    expect(isPinLocked(new Date("2026-10-26T10:14:59Z"), now)).toBe(true);
    expect(isPinLocked(new Date("2026-10-26T10:00:00Z"), now)).toBe(false);
  });
});

describe("images", () => {
  it("borne le base64 comme le fichier : 2 Mo au plus", () => {
    expect(SIGNING_IMAGE_MAX_BYTES).toBe(2 * 1024 * 1024);
    // Un fichier de 2 Mo tient ; le service accepte jusqu'à 2 796 206.
    expect(signingImageMaxBase64Length()).toBe(2_796_204);
  });
});

describe("tracé de la signature", () => {
  /** Un trait droit, de `length` pixels, tracé en `ms` millisecondes. */
  const line = (length: number, ms: number, steps = 10): StrokePoint[] =>
    Array.from({ length: steps + 1 }, (_, index) => ({
      x: (length * index) / steps,
      y: 20 + (index % 2) * 4,
      t: (ms * index) / steps,
    }));

  it("refuse un cadre vide ou un simple clic", () => {
    expect(drawingProblem([])).toBe("empty");
    expect(drawingProblem([[{ x: 10, y: 10, t: 0 }]])).toBe("empty");
  });

  it("refuse un trait trop rapide pour une signature", () => {
    expect(drawingProblem([line(200, 300)])).toBe("tooShort");
  });

  it("refuse un trait trop petit", () => {
    expect(drawingProblem([line(20, 900)])).toBe("tooSmall");
  });

  it("accepte une signature tracée en plusieurs traits", () => {
    expect(drawingProblem([line(120, 400), line(160, 350)])).toBeNull();
  });
});
