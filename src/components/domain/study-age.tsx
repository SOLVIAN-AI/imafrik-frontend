"use client";

import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

/** Seuil au-delà duquel l'attente d'un examen est signalée. */
export const STALE_AFTER_HOURS = 4;

/**
 * Exprime une ancienneté en durée relative courte.
 *
 * Ce qui compte dans une worklist n'est pas l'horodatage mais le délai
 * écoulé : un examen reçu il y a trois heures appelle une action, une date
 * absolue oblige à faire le calcul soi-même.
 *
 * @param date Date de réception.
 * @param now  Instant de référence, injectable pour les tests.
 * @returns Une durée compacte : « 12 min », « 3 h », « 2 j ».
 */
export function formatAge(date: Date, now: Date = new Date()): string {
  const minutes = Math.max(
    0,
    Math.round((now.getTime() - date.getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} j`;
}

/**
 * Ancienneté d'un examen, calculée côté client uniquement.
 *
 * **Pourquoi pas au rendu serveur.** Une durée relative dépend de
 * l'instant où on la calcule. Le serveur produit « 8 min », le navigateur
 * reprend la main quelques secondes plus tard et calcule « 10 min » :
 * React constate que le texte diffère, avertit, et régénère l'arbre. Le
 * problème n'est pas propre au jeu de démonstration — il se reproduira
 * avec les vraies dates de réception.
 *
 * La cellule est donc vide au premier rendu, puis se remplit et se met à
 * jour toute seule au rythme de l'horloge partagée.
 *
 * L'attribut `dateTime` — l'horodatage machine, lu par les technologies
 * d'assistance — n'apparaît qu'à ce moment-là, et pas avant. Il dérive
 * lui aussi d'une date que les deux côtés ne partagent pas forcément :
 * le jeu de démonstration fabrique ses dates à partir de l'instant de
 * chargement du module, évalué une fois au démarrage du serveur et une
 * autre fois dans le navigateur. Émettre l'attribut au rendu serveur
 * rejouerait donc exactement la divergence que ce composant existe pour
 * éviter.
 *
 * La teinte ambre passé le seuil n'est pas décorative : une durée seule
 * demande une comparaison mentale, la couleur fait ressortir ce qui
 * traîne sans qu'on ait à lire chaque ligne.
 *
 * @param date  Date de réception de l'examen.
 * @param muted Neutralise le signal d'attente — un examen livré n'attend
 *              plus rien.
 */
export function StudyAge({
  date,
  muted = false,
  className,
}: {
  date: Date;
  muted?: boolean;
  className?: string;
}) {
  const now = useNow();
  if (!now) return <time className={className} />;

  const hours = (now - date.getTime()) / 3_600_000;
  const stale = !muted && hours > STALE_AFTER_HOURS;

  return (
    <time
      dateTime={date.toISOString()}
      className={cn(stale ? "text-progress" : "text-tertiary", className)}
    >
      {formatAge(date, new Date(now))}
    </time>
  );
}
