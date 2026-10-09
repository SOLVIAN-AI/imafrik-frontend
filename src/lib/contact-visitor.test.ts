import { describe, expect, it } from "vitest";

import {
  signVisitorIp,
  visitorIp,
  visitorIpHeaders,
} from "@/lib/contact-visitor";

/**
 * Vecteur partagé avec l'API (`tests/test_organization.py`) : la même
 * adresse, le même secret, la même signature des deux côtés. S'il change
 * d'un côté seulement, l'API ignore l'adresse relayée et la limite du
 * formulaire redevient commune à tous les visiteurs.
 */
const SHARED_VECTOR = {
  secret: "secret-partage-de-test",
  address: "203.0.113.7",
  signature: "063543510e0e947af722007ab90b5c4022910e05820495d0746606cbbeb5e3d2",
};

describe("adresse du visiteur du formulaire de contact", () => {
  it("signe comme l'API vérifie", () => {
    expect(signVisitorIp(SHARED_VECTOR.address, SHARED_VECTOR.secret)).toBe(
      SHARED_VECTOR.signature,
    );
  });

  it("lit x-real-ip, puis le premier élément de x-forwarded-for", () => {
    expect(
      visitorIp(
        new Headers({
          "x-real-ip": "198.51.100.4",
          "x-forwarded-for": "203.0.113.7",
        }),
      ),
    ).toBe("198.51.100.4");
    expect(
      visitorIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })),
    ).toBe("203.0.113.7");
    expect(visitorIp(new Headers({ "x-forwarded-for": "2001:db8::1" }))).toBe(
      "2001:db8::1",
    );
  });

  it("ignore ce qui n'est pas une adresse", () => {
    expect(visitorIp(new Headers({ "x-real-ip": "pas une adresse" }))).toBe(
      null,
    );
    expect(visitorIp(new Headers())).toBe(null);
  });

  it("relaie l'adresse signée, et rien sans secret", () => {
    const incoming = new Headers({ "x-real-ip": SHARED_VECTOR.address });
    expect(visitorIpHeaders(incoming, SHARED_VECTOR.secret)).toEqual({
      "X-Visitor-Ip": SHARED_VECTOR.address,
      "X-Visitor-Ip-Signature": SHARED_VECTOR.signature,
    });
    expect(visitorIpHeaders(incoming, undefined)).toEqual({});
    expect(visitorIpHeaders(incoming, "")).toEqual({});
    expect(visitorIpHeaders(new Headers(), SHARED_VECTOR.secret)).toEqual({});
  });
});
