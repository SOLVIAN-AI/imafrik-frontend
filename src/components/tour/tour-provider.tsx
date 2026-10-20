"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

import { useSession } from "@/components/providers/session-provider";
import { readLocalTours, writeLocalTours } from "@/components/tour/storage";
import { visibleSteps } from "@/components/tour/targets";
import { TourBubble } from "@/components/tour/tour-bubble";
import {
  mainTourFor,
  tourFor,
  TOUR_IDS,
  TOURS,
  type TourDefinition,
  type TourId,
  type TourStep,
} from "@/components/tour/tours";
import { completeTour } from "@/lib/actions/tours";

/**
 * Moteur des visites guidées.
 *
 * Une visite démarre seule quand l'utilisateur ouvre pour la première fois
 * un écran qui en a une, une fois la page posée : polices chargées, forme
 * définitive de l'écran de lecture connue, aucune autre fenêtre ouverte.
 * Faite ou passée, elle est notée sur le profil et ne revient plus ; le
 * bouton d'aide la relance à la demande.
 */

/** Délai avant le démarrage automatique, le temps que la page s'installe. */
const AUTO_START_DELAY_MS = 600;

/** Intervalle et nombre d'essais pour attendre une page tranquille. */
const QUIET_POLL_MS = 250;
const QUIET_MAX_TRIES = 40;

/**
 * Visite demandée depuis un autre écran (« Visite guidée de l'accueil ») :
 * retenue le temps d'y arriver, même si l'écran d'arrivée change de
 * disposition, donc de fournisseur.
 */
const REQUEST_KEY = "imafrik-visite-demandee";

/** Une visite en cours : ses étapes affichables et la position. */
interface Run {
  tour: TourDefinition;
  steps: TourStep[];
  index: number;
}

/** Ce que le moteur offre au reste de l'écran : le bouton d'aide. */
interface TourContextValue {
  /** Visite de l'écran courant pour ce rôle, s'il en a une. */
  screenTour: TourDefinition | null;
  /** Visite de l'écran d'accueil du rôle. */
  mainTour: TourDefinition | null;
  /** Lance une visite de l'écran courant, faite ou non. */
  start: (id: TourId) => void;
  /**
   * Demande une visite d'un autre écran : elle démarrera à l'arrivée.
   * L'appelant mène lui-même à l'écran.
   */
  request: (id: TourId) => void;
}

const TourContext = React.createContext<TourContextValue | null>(null);

/**
 * Le moteur des visites de l'écran.
 *
 * @throws Hors d'un {@link TourProvider} : une erreur de structure.
 */
export function useTour(): TourContextValue {
  const context = React.useContext(TourContext);
  if (!context) {
    throw new Error(
      "useTour doit être appelé dans un TourProvider, posé par la disposition.",
    );
  }
  return context;
}

/**
 * Vrai quand la page est prête à être montrée : forme définitive connue,
 * onglet au premier plan, aucune fenêtre ni aucun menu ouverts par-dessus.
 */
function pageIsQuiet(): boolean {
  return (
    document.visibilityState === "visible" &&
    document.querySelector("[data-pending-layout]") === null &&
    document.querySelector(
      '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="menu"][data-state="open"]',
    ) === null
  );
}

function readRequest(): TourId | null {
  try {
    const value = window.sessionStorage.getItem(REQUEST_KEY);
    return TOUR_IDS.find((id) => id === value) ?? null;
  } catch {
    return null;
  }
}

function writeRequest(id: TourId | null): void {
  try {
    if (id) window.sessionStorage.setItem(REQUEST_KEY, id);
    else window.sessionStorage.removeItem(REQUEST_KEY);
  } catch {
    // Stockage refusé : la visite se relancera depuis le bouton d'aide.
  }
}

/**
 * Pose le moteur des visites sous une disposition.
 *
 * À placer dans le `SessionProvider` : les visites dépendent du rôle actif
 * et des visites déjà faites, que la session apporte.
 */
export function TourProvider({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const userId = session.user.id;
  const role = session.active.role;
  const screenTour = tourFor(pathname, role);
  const mainTour = mainTourFor(role);

  const [completed, setCompleted] = React.useState<ReadonlySet<string>>(
    () => new Set(session.toursCompleted),
  );
  // Copie locale lue après le montage : le serveur ne la connaît pas.
  const [loaded, setLoaded] = React.useState(false);
  const [requested, setRequested] = React.useState<TourId | null>(null);
  const [run, setRun] = React.useState<Run | null>(null);

  const serverTours = session.toursCompleted.join(",");
  React.useEffect(() => {
    setCompleted(
      (current) =>
        new Set([
          ...current,
          ...(serverTours ? serverTours.split(",") : []),
          ...readLocalTours(userId),
        ]),
    );
    setRequested(readRequest());
    setLoaded(true);
  }, [userId, serverTours]);

  const begin = React.useCallback((tour: TourDefinition) => {
    const steps = visibleSteps(tour.steps);
    if (steps.length > 0) setRun({ tour, steps, index: 0 });
  }, []);

  // Démarrage automatique, ou sur demande venue d'un autre écran.
  React.useEffect(() => {
    if (!loaded || run || !screenTour) return;
    const wanted = requested === screenTour.id || !completed.has(screenTour.id);
    if (!wanted) return;

    let tries = 0;
    let timer = window.setTimeout(function attempt() {
      if (pageIsQuiet()) {
        if (requested === screenTour.id) {
          writeRequest(null);
          setRequested(null);
        }
        begin(screenTour);
        return;
      }
      // Une fenêtre reste ouverte : la visite attendra la prochaine visite
      // de l'écran plutôt que de s'imposer par-dessus.
      tries += 1;
      if (tries < QUIET_MAX_TRIES)
        timer = window.setTimeout(attempt, QUIET_POLL_MS);
    }, AUTO_START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [loaded, run, screenTour, requested, completed, begin]);

  // Un changement d'écran en cours de visite l'interrompt, sans la noter :
  // elle reviendra à la prochaine ouverture de son écran.
  React.useEffect(() => {
    setRun((current) =>
      current && !current.tour.matches(pathname) ? null : current,
    );
  }, [pathname]);

  const markDone = React.useCallback(
    (id: TourId) => {
      if (completed.has(id)) return;
      const next = new Set([...completed, id]);
      setCompleted(next);
      writeLocalTours(
        userId,
        [...next].filter((entry) => TOURS.some((tour) => tour.id === entry)),
      );
      // Sans attendre : la copie locale suffit si le service ne répond pas.
      if (!session.isDemo) void completeTour(id).catch(() => undefined);
    },
    [completed, userId, session.isDemo],
  );

  // Terminée ou passée, la visite est faite : elle ne revient plus seule.
  const close = React.useCallback(() => {
    if (run) markDone(run.tour.id);
    setRun(null);
  }, [run, markDone]);

  const go = React.useCallback((delta: 1 | -1) => {
    setRun((current) => {
      if (!current) return current;
      const index = current.index + delta;
      if (index < 0 || index >= current.steps.length) return current;
      return { ...current, index };
    });
  }, []);

  const value = React.useMemo<TourContextValue>(
    () => ({
      screenTour,
      mainTour,
      start: (id) => {
        const tour = TOURS.find((entry) => entry.id === id);
        if (tour && tour.matches(pathname) && tour.roles.includes(role))
          begin(tour);
      },
      request: (id) => {
        writeRequest(id);
        setRequested(id);
      },
    }),
    [screenTour, mainTour, pathname, role, begin],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {run && (
        <TourBubble
          tourId={run.tour.id}
          step={run.steps[run.index]}
          index={run.index}
          total={run.steps.length}
          onNext={() => go(1)}
          onPrevious={() => go(-1)}
          onClose={close}
        />
      )}
    </TourContext.Provider>
  );
}
