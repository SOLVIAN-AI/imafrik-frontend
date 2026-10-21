"use client";

import * as React from "react";

import type { ActionResult } from "@/lib/actions/result";

/** Intervalle entre deux prolongations : le tiers de la durée de vie du jeton. */
export const RENEW_EVERY_MS = 5 * 60_000;

/**
 * Délai minimal entre deux prolongations déclenchées par le retour sur
 * l'onglet ou du réseau : un aller-retour d'onglets répété n'en envoie
 * pas une à chaque fois.
 */
export const RENEW_AT_MOST_EVERY_MS = 60_000;

/** Ce que le volet d'images sait faire du jeton de son viewer. */
export interface ViewerSession {
  /** Prolonge le jeton ; un 404 signifie qu'il n'existe plus. */
  renew(token: string): Promise<ActionResult<{ expiresIn: number }>>;
  /** Émet un jeton neuf et renvoie la nouvelle adresse du viewer. */
  reopen(): Promise<ActionResult<string>>;
}

/** Jeton porté par l'adresse du viewer (`?token=`), ou `null`. */
export function viewerToken(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).searchParams.get("token");
  } catch {
    return null;
  }
}

/**
 * Garde vivant le jeton du viewer tant que l'examen reste ouvert.
 *
 * Le jeton est prolongé toutes les cinq minutes, et dès le retour sur
 * l'onglet ou du réseau : un onglet en arrière-plan voit ses minuteries
 * ralenties par le navigateur. Quand le jeton n'existe plus (révoqué,
 * expiré pendant une veille de l'ordinateur, au terme de sa durée de
 * vie), un jeton neuf est demandé et l'adresse du viewer remplacée : le
 * viewer se recharge, mais affiche de nouveau les images. Une panne
 * passagère, elle, ne remplace rien : la prolongation suivante réessaie.
 *
 * @param url     Adresse du viewer, avec son jeton ; `null` sans viewer.
 * @param session Prolongation et réouverture, côté serveur.
 * @returns L'adresse à afficher, qui change seulement à une réouverture,
 *          et l'issue de la dernière réouverture (`null` tant qu'aucune).
 */
export function useViewerSession(
  url: string | null,
  session: ViewerSession | undefined,
): { url: string | null; reopened: "ok" | "failed" | null } {
  const [current, setCurrent] = React.useState({ from: url, url });
  const [reopened, setReopened] = React.useState<"ok" | "failed" | null>(null);
  // Une nouvelle adresse reçue (autre examen) remplace la nôtre.
  if (current.from !== url) {
    setCurrent({ from: url, url });
    setReopened(null);
  }
  const shown = current.url;

  const latest = React.useRef(session);
  React.useEffect(() => {
    latest.current = session;
  });

  React.useEffect(() => {
    const token = viewerToken(shown);
    if (!token || !latest.current) return;
    let lastRenewal = Date.now();
    let busy = false;
    let stopped = false;

    const renew = async () => {
      const active = latest.current;
      if (busy || stopped || !active) return;
      busy = true;
      lastRenewal = Date.now();
      try {
        const result = await active.renew(token);
        if (stopped || result.ok || result.status !== 404) return;
        const fresh = await active.reopen();
        if (stopped) return;
        if (fresh.ok) {
          setCurrent((previous) => ({ ...previous, url: fresh.data }));
          setReopened("ok");
        } else {
          setReopened("failed");
        }
      } catch {
        // Réseau coupé : la prolongation suivante réessaie.
      } finally {
        busy = false;
      }
    };

    const soon = () => {
      if (Date.now() - lastRenewal >= RENEW_AT_MOST_EVERY_MS) void renew();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") soon();
    };

    const timer = window.setInterval(() => void renew(), RENEW_EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", soon);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", soon);
    };
  }, [shown]);

  return { url: shown, reopened };
}
