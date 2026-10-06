import { isApiConfigured } from "@/lib/api/config";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Indique si l'application tourne sur le jeu de démonstration.
 *
 * **Une seule définition, utilisée partout** — par la couche de données
 * pour choisir sa source, et par l'interface pour afficher le bandeau
 * « Démonstration ». Les deux décisions étaient prises séparément : la
 * session se disait réelle dès que Supabase était configuré, pendant que
 * les données retombaient sur le jeu de démonstration dès que l'API ne
 * l'était pas. Un aperçu configuré à moitié affichait alors des patients
 * inventés **sans** le bandeau qui le signale.
 *
 * La démonstration est donc active dès qu'il manque l'un des deux
 * services, et le bandeau suit. En production, ce cas n'arrive jamais :
 * le proxy refuse de servir un déploiement incomplet (voir
 * `lib/deployment.ts`).
 */
export function isDemoMode(): boolean {
  return !isSupabaseConfigured() || !isApiConfigured();
}
