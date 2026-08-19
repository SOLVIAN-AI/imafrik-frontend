import type { Metadata } from "next";

import { StatusScreen } from "@/components/layout/status-screen";
import { missingProductionConfig } from "@/lib/deployment";

export const metadata: Metadata = {
  title: "Configuration requise",
  robots: { index: false, follow: false },
};

/**
 * Déploiement de production non configuré.
 *
 * **Cet écran remplace un refus brutal.** Un déploiement de production
 * auquel il manque des variables ne doit surtout pas servir le jeu de
 * démonstration — de faux patients présentés à de vrais utilisateurs
 * feraient plus de dégâts qu'une panne. Mais lever une exception à
 * chaque requête produirait un 500 qui ne dit rien : ni au visiteur, ni
 * à celui qui doit corriger.
 *
 * Il nomme donc **exactement** ce qui manque, et à quoi chaque variable
 * sert. Une liste figée finirait par mentir le jour où l'une d'elles
 * changerait de nom.
 */
export default function ConfigurationRequiredPage() {
  const missing = missingProductionConfig();

  return (
    <StatusScreen
      code="503"
      tone="urgent"
      title="Ce déploiement n’est pas configuré"
      detail={
        <>
          <p>
            Le service refuse de servir plutôt que de présenter des données de
            démonstration sous une adresse de production.
          </p>

          {missing.length > 0 && (
            <dl className="mt-6 divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-surface-raised text-left">
              {missing.map((variable) => (
                <div key={variable.name} className="px-4 py-3">
                  <dt className="font-mono text-xs text-primary">
                    {variable.name}
                  </dt>
                  <dd className="mt-1 text-2xs text-tertiary">
                    {variable.purpose}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p className="mt-6 text-xs text-tertiary">
            À déclarer dans les variables d’environnement du déploiement, puis
            redéployer.
          </p>
        </>
      }
    />
  );
}
