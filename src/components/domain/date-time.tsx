"use client";

import { useHydrated } from "@/hooks/use-hydrated";
import { formatDate, formatDateTime } from "@/lib/format";

/**
 * Une date affichée, rendue côté client uniquement.
 *
 * **Pourquoi une règle générale.** Le rendu serveur et l'hydratation
 * doivent produire exactement le même texte. Une date ne le garantit
 * jamais tout à fait : le jeu de démonstration fabrique ses horodatages à
 * partir de l'instant de chargement du module — évalué une fois au
 * démarrage du serveur, une autre fois dans le navigateur — et, en
 * production, un format dépendant du fuseau du lecteur poserait le même
 * problème.
 *
 * Plutôt que de traiter chaque cas, la règle est unique : **toute date
 * visible passe par ce composant**, et n'apparaît qu'une fois le rendu
 * arrivé dans le navigateur. Le décalage se compte en millisecondes ;
 * l'alternative est un avertissement React et un arbre régénéré à chaque
 * chargement.
 *
 * L'attribut `dateTime` porte l'horodatage machine, lisible par les
 * technologies d'assistance, et suit la même règle pour la même raison.
 *
 * @param date  Date à afficher.
 * @param withTime Ajoute l'heure. Faux pour une date seule.
 */
export function DateTime({
  date,
  withTime = true,
  className,
}: {
  date: Date;
  withTime?: boolean;
  className?: string;
}) {
  const hydrated = useHydrated();

  if (!hydrated) return <time className={className} />;

  return (
    <time dateTime={date.toISOString()} className={className}>
      {withTime ? formatDateTime(date) : formatDate(date)}
    </time>
  );
}
