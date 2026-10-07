"use client";

import { Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMessages } from "@/i18n/client";
import { signOut } from "@/lib/session/actions";
import {
  ACTIVITY_KEY,
  IDLE_MINUTES,
  type InactivityPhase,
  parseActivity,
  phaseOf,
  remainingMs,
} from "@/lib/session/inactivity";

/** Gestes qui comptent comme une présence devant l'écran. */
const ACTIVITY_EVENTS = [
  "pointerdown",
  "pointermove",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
] as const;

/** Écriture de l'activité partagée au plus toutes les 5 s. */
const SHARE_EVERY_MS = 5_000;

/**
 * Ferme la session après une période sans activité.
 *
 * - **Préavis** : une minute avant, une fenêtre le dit, avec un compte à
 *   rebours ; n'importe quel geste l'annule.
 * - **Tous les onglets** : l'instant de la dernière activité est partagé
 *   par le stockage du navigateur ; travailler dans un onglet garde les
 *   autres ouverts, et tous se ferment ensemble.
 * - **Le visualiseur** : son `iframe` ne remonte aucun geste ; tant qu'il
 *   a le focus, le délai est allongé (voir `lib/session/inactivity.ts`).
 * - **Les brouillons** : l'enregistrement automatique les a déjà envoyés
 *   au service. Une copie de secours hors ligne, s'il y en a une, est
 *   gardée — c'est le seul exemplaire d'un texte que le réseau n'a pas
 *   laissé passer ; seule la déconnexion volontaire l'efface.
 *
 * Fermer la session révoque aussi les jetons du visualiseur (`signOut`).
 * Côté client seulement : c'est une protection du poste, pas des
 * données — celles-ci exigent de toute façon un jeton valide.
 */
export function InactivityLock() {
  const t = useMessages();
  const pathname = usePathname();
  const [phase, setPhase] = React.useState<InactivityPhase>("active");
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const lastActivity = React.useRef(0);
  const lastShared = React.useRef(0);
  const locking = React.useRef(false);

  /** Note une activité : horloge de l'onglet, et partage entre onglets. */
  const touch = React.useCallback(() => {
    const now = Date.now();
    lastActivity.current = now;
    if (now - lastShared.current >= SHARE_EVERY_MS) {
      lastShared.current = now;
      try {
        window.localStorage.setItem(ACTIVITY_KEY, String(now));
      } catch {
        // Stockage bloqué : chaque onglet compte pour lui-même.
      }
    }
  }, []);

  /**
   * Un geste : l'activité est notée, et le préavis disparaît aussitôt,
   * sans attendre le contrôle suivant.
   */
  const markActive = React.useCallback(() => {
    touch();
    setPhase("active");
  }, [touch]);

  const lock = React.useCallback(async () => {
    if (locking.current) return;
    locking.current = true;
    try {
      await signOut();
    } finally {
      const suite = encodeURIComponent(pathname);
      // Rechargement complet : rien de la page — ni image, ni texte
      // médical — ne reste en mémoire derrière l'écran de connexion.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- rechargement complet voulu, voir ci-dessus
      window.location.assign(`/connexion?motif=inactivite&suite=${suite}`);
    }
  }, [pathname]);

  React.useEffect(() => {
    touch();
    // Pendant le préavis aussi, tout geste compte : quelqu'un est là.
    const onActivity = () => markActive();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, {
        passive: true,
        capture: true,
      });
    }

    const check = () => {
      const now = Date.now();
      let shared: string | null = null;
      try {
        shared = window.localStorage.getItem(ACTIVITY_KEY);
      } catch {
        // Stockage bloqué : l'activité de cet onglet seul.
      }
      lastActivity.current = parseActivity(shared, lastActivity.current, now);
      const reading = document.activeElement?.tagName === "IFRAME";
      const remaining = remainingMs(now, lastActivity.current, reading);
      const next = phaseOf(remaining);
      setPhase(next);
      setSecondsLeft(Math.max(0, Math.ceil(remaining / 1000)));
      if (next === "locked") void lock();
    };

    const timer = window.setInterval(check, 1_000);
    // Retour sur un onglet resté caché : vérifier tout de suite, sans
    // attendre le prochain tic (les minuteurs sont ralentis en arrière-plan).
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity, { capture: true });
      }
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [lock, markActive, touch]);

  return (
    <Dialog
      open={phase === "warning"}
      onOpenChange={(open) => {
        if (!open) markActive();
      }}
    >
      <DialogContent aria-describedby="inactivity-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="size-4 text-progress" aria-hidden />
            {t.session.inactivity.title}
          </DialogTitle>
          <DialogDescription id="inactivity-detail">
            {t.session.inactivity.detailBefore(IDLE_MINUTES)}
            <strong className="text-primary tabular-nums" aria-live="polite">
              {t.session.inactivity.seconds(secondsLeft)}
            </strong>
            {t.session.inactivity.detailAfter}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => void lock()}>
            {t.session.inactivity.signOutNow}
          </Button>
          <Button size="sm" onClick={markActive} autoFocus>
            {t.session.inactivity.staySignedIn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
