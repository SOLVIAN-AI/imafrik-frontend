import { describe, expect, it } from "vitest";

import { isConfiguredViewer, isSafeBrowserUrl } from "@/lib/security/urls";

describe("isSafeBrowserUrl", () => {
  it("accepte https", () => {
    expect(isSafeBrowserUrl("https://r2.example/rapport.pdf?X-Amz=1")).toBe(
      true,
    );
  });

  it("n'accepte http que sur la machine locale", () => {
    expect(isSafeBrowserUrl("http://localhost:8042/viewer")).toBe(true);
    expect(isSafeBrowserUrl("http://127.0.0.1/viewer")).toBe(true);
    expect(isSafeBrowserUrl("http://viewer.imafrik.tech/viewer")).toBe(false);
  });

  it("refuse les schémas qui exécutent ou embarquent du contenu", () => {
    expect(isSafeBrowserUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeBrowserUrl("data:text/html,<script>1</script>")).toBe(false);
    expect(isSafeBrowserUrl("vbscript:msgbox")).toBe(false);
    expect(isSafeBrowserUrl("pas une adresse")).toBe(false);
  });

  it("refuse des identifiants dans l'adresse", () => {
    expect(isSafeBrowserUrl("https://user:pass@viewer.imafrik.tech/")).toBe(
      false,
    );
  });
});

describe("isConfiguredViewer", () => {
  const configured = "https://viewer.imafrik.tech/viewer";

  it("accepte le viewer configuré, quel que soit le chemin", () => {
    expect(
      isConfiguredViewer(
        "https://viewer.imafrik.tech/viewer?StudyInstanceUIDs=1&token=t",
        configured,
      ),
    ).toBe(true);
  });

  it("refuse une autre origine, ou l'absence de configuration", () => {
    expect(
      isConfiguredViewer("https://autre.example/viewer?token=t", configured),
    ).toBe(false);
    expect(
      isConfiguredViewer("https://viewer.imafrik.tech/viewer", undefined),
    ).toBe(false);
  });
});
