import type { Metadata } from "next";

import { StatusScreen } from "@/components/layout/status-screen";

export const metadata: Metadata = {
  title: "Configuration requise",
  robots: { index: false, follow: false },
};

/**
 * Déploiement de production non configuré.
 *
 * **Cet écran remplace un refus brutal.** Un déploiement de production
 * auquel il manque les variables d'environnement ne doit surtout pas
 * servir le jeu de démonstration — de faux patients présentés à de vrais
 * utilisateurs feraient plus de dégâts qu'une panne. Mais lever une
 * exception à chaque requête produirait un 500 qui ne dit rien : ni au
 * visiteur, ni à celui qui doit corriger.
 *
 * L'écran dit donc les deux choses utiles : le service n'est pas en
 * cause, et voici précisément ce qui manque. Aucune donnée n'est servie
 * tant qu'il s'affiche.
 */
export default function ConfigurationRequiredPage() {
  return (
    <StatusScreen
      code="503"
      tone="urgent"
      title="Ce déploiement n’est pas configuré"
      detail={
        <>
          <p>
            Le service refuse de démarrer plutôt que de servir des données de
            démonstration sous une adresse de production.
          </p>
          <p className="mt-4">
            Il manque{" "}
            <code className="font-mono text-xs text-primary">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            et{" "}
            <code className="font-mono text-xs text-primary">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            dans les variables d’environnement du déploiement.
          </p>
        </>
      }
    />
  );
}
