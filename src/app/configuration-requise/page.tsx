import type { Metadata } from "next";

import { StatusScreen } from "@/components/layout/status-screen";
import { messagesFor, type AppMessages } from "@/i18n";
import {
  missingProductionConfig,
  REPORT_BACKUP_SECRET_MIN_LENGTH,
  type DeploymentPurpose,
} from "@/lib/deployment";
import { requestLocale } from "@/lib/i18n/server";

/** Titre de l'onglet, dans la langue de la requête ; page non indexée. */
export async function generateMetadata(): Promise<Metadata> {
  const t = messagesFor(await requestLocale());
  return {
    title: t.session.configuration.metaTitle,
    robots: { index: false, follow: false },
  };
}

/**
 * Texte du rôle d'une variable, dans la langue du visiteur.
 *
 * @param t       Textes de l'application.
 * @param purpose Clé du rôle, fournie par `missingProductionConfig`.
 */
function purposeText(t: AppMessages, purpose: DeploymentPurpose): string {
  const purposes = t.session.configuration.purposes;
  return purpose === "backupSecret"
    ? purposes.backupSecret(REPORT_BACKUP_SECRET_MIN_LENGTH)
    : purposes[purpose];
}

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
 *
 * La langue est celle de la requête, et non celle d'un profil : sur un
 * déploiement à moitié configuré, l'écran ne doit dépendre d'aucun appel
 * à Supabase.
 */
export default async function ConfigurationRequiredPage() {
  const locale = await requestLocale();
  const t = messagesFor(locale);
  const missing = missingProductionConfig();

  return (
    <StatusScreen
      code="503"
      tone="urgent"
      locale={locale}
      title={t.session.configuration.title}
      detail={
        <>
          <p>{t.session.configuration.lead}</p>

          {missing.length > 0 && (
            <dl className="mt-6 divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-surface-raised text-left">
              {missing.map((variable) => (
                <div
                  key={`${variable.name}:${variable.purpose}`}
                  className="px-4 py-3"
                >
                  <dt className="font-mono text-xs text-primary">
                    {variable.name}
                  </dt>
                  <dd className="mt-1 text-2xs text-tertiary">
                    {purposeText(t, variable.purpose)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p className="mt-6 text-xs text-tertiary">
            {t.session.configuration.footer}
          </p>
        </>
      }
    />
  );
}
