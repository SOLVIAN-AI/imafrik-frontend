import { describe, expect, it } from "vitest";

import { isDesktopComputer, isWeasisLaunchUrl } from "@/lib/weasis";

const API = "https://api.imafrik.tech";
const STUDY = "76ffa885-73d9-41be-91c4-153f4e0515ec";
const CODE = "RK5tl4bgd5CwmM5VwDgi4-ZvchEjz6g8HeNLlsyyAw4";

/** Adresse `weasis://` encodée comme le service l'encode (`quote_plus`). */
function launch(commands: string): string {
  return "weasis://?" + encodeURIComponent(commands).replaceAll("%20", "+");
}

const manifest = (api = API, study = STUDY, query = `code=${CODE}`) =>
  `${api}/studies/${study}/weasis-manifest?${query}`;

describe("isWeasisLaunchUrl", () => {
  it("accepte l’adresse qu’émet le service", () => {
    const url = launch(`$dicom:close --all $dicom:get -w "${manifest()}"`);
    expect(url).toContain("%24dicom%3Aclose+--all");
    expect(isWeasisLaunchUrl(url, API, STUDY)).toBe(true);
  });

  it("accepte l’API locale en http, sous un préfixe de chemin", () => {
    const api = "http://127.0.0.1:8000/v1";
    const url = launch(`$dicom:close --all $dicom:get -w "${manifest(api)}"`);
    expect(isWeasisLaunchUrl(url, `${api}/`, STUDY)).toBe(true);
  });

  it("refuse un manifeste hors de l’API configurée", () => {
    for (const api of [
      "https://pirate.example",
      "http://api.imafrik.tech",
      "https://api.imafrik.tech.pirate.example",
    ]) {
      const url = launch(`$dicom:close --all $dicom:get -w "${manifest(api)}"`);
      expect(isWeasisLaunchUrl(url, API, STUDY), api).toBe(false);
    }
  });

  it("refuse le manifeste d’un autre examen", () => {
    const other = "11111111-0000-0000-0000-000000000001";
    const url = launch(
      `$dicom:close --all $dicom:get -w "${manifest(API, other)}"`,
    );
    expect(isWeasisLaunchUrl(url, API, STUDY)).toBe(false);
  });

  it("refuse toute autre commande Weasis", () => {
    for (const commands of [
      `$dicom:get -w "${manifest()}"`,
      `$dicom:close --all $dicom:get -w "${manifest()}" $dicom:get -r "https://pirate.example/x.dcm"`,
      `$dicom:rs --url "https://pacs.imafrik.tech/dicom-web" -r "studyUID=1.2.3"`,
      `$weasis:config pro="weasis.user x" $dicom:close --all $dicom:get -w "${manifest()}"`,
    ]) {
      expect(isWeasisLaunchUrl(launch(commands), API, STUDY), commands).toBe(
        false,
      );
    }
  });

  it("refuse un code absent, mal formé ou accompagné d’autres paramètres", () => {
    for (const query of [
      "",
      "code=x",
      `code=${CODE}&token=abc`,
      "code=a%22b",
    ]) {
      const url = launch(
        `$dicom:close --all $dicom:get -w "${manifest(API, STUDY, query)}"`,
      );
      expect(isWeasisLaunchUrl(url, API, STUDY), query).toBe(false);
    }
  });

  it("refuse un autre protocole, ou faute d’API configurée", () => {
    const commands = `$dicom:close --all $dicom:get -w "${manifest()}"`;
    expect(
      isWeasisLaunchUrl(
        launch(commands).replace("weasis", "javascript"),
        API,
        STUDY,
      ),
    ).toBe(false);
    expect(isWeasisLaunchUrl(launch(commands), undefined, STUDY)).toBe(false);
    expect(isWeasisLaunchUrl("weasis://?%E0%A4%A", API, STUDY)).toBe(false);
  });
});

describe("isDesktopComputer", () => {
  const desktop = (userAgent: string, platform: string, maxTouchPoints = 0) =>
    isDesktopComputer({ userAgent, platform, maxTouchPoints });

  it("reconnaît un ordinateur", () => {
    expect(
      desktop(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
        "Win32",
      ),
    ).toBe(true);
    expect(
      desktop(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15",
        "MacIntel",
      ),
    ).toBe(true);
    // Un portable Windows à écran tactile reste un ordinateur.
    expect(
      desktop(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
        "Win32",
        10,
      ),
    ).toBe(true);
  });

  it("écarte les téléphones et les tablettes", () => {
    expect(
      desktop(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        "iPhone",
        5,
      ),
    ).toBe(false);
    expect(
      desktop(
        "Mozilla/5.0 (Linux; Android 15; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
        "Linux armv8l",
        10,
      ),
    ).toBe(false);
  });

  it("écarte un iPad qui se présente comme un Mac", () => {
    expect(
      desktop(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15",
        "MacIntel",
        5,
      ),
    ).toBe(false);
  });
});
