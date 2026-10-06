import { describe, expect, it } from "vitest";

import { formatDuration, formatPatientName } from "@/lib/format";

describe("formatDuration", () => {
  it.each([
    [45, "45 min"],
    [60, "1 h"],
    [130, "2 h 10"],
    [1500, "1 j 1 h"],
    [-3, "0 min"],
  ])("%d minutes → %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe("formatPatientName", () => {
  it("met en forme un nom DICOM", () => {
    expect(formatPatientName("koffi^Ama")).toBe("KOFFI Ama");
    expect(formatPatientName("")).toBe("—");
  });
});
