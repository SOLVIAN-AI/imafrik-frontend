import { fill, marketingCopy } from "@/content/marketing";
import type { Locale } from "@/lib/i18n/locale";
import { legalUpdatedAt } from "@/lib/legal";

/** Étiquette au-dessus du titre, dans chaque langue. */
const EYEBROW: Record<Locale, string> = {
  fr: "Informations légales",
  en: "Legal information",
};

/**
 * Gabarit d'une page de texte long.
 *
 * La mesure de ligne est bornée à 68 caractères et l'interligne élargi :
 * un document juridique se lit mal, autant ne pas y ajouter une
 * typographie hostile. Les styles sont appliqués par sélecteurs
 * descendants plutôt que classe par classe — c'est le seul endroit de
 * l'application où le contenu est rédigé plutôt que composé.
 *
 * Ces pages sont publiques et indexables : une mention légale introuvable
 * ne remplit pas sa fonction. Une page de conditions porte toujours sa
 * date de mise à jour, sans laquelle on ne peut pas savoir à quoi on a
 * consenti.
 *
 * Une traduction rappelle, sous le titre, que la version française fait
 * foi : c'est elle que le contrat désigne.
 *
 * @param locale Langue de la page.
 * @param title  Titre du document.
 */
export function LegalPage({
  locale,
  title,
  children,
}: {
  locale: Locale;
  title: string;
  children: React.ReactNode;
}) {
  const t = marketingCopy(locale).legal;
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <p className="label-eyebrow text-accent">{EYEBROW[locale]}</p>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{title}</h1>
      <p className="mt-3 text-xs text-tertiary">
        {fill(t.updatedAt, { date: legalUpdatedAt(locale) })}
      </p>
      {t.translationNotice && (
        <p className="mt-6 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 text-xs leading-relaxed text-secondary">
          {t.translationNotice}
        </p>
      )}

      <div
        className={[
          "prose-justify mt-12 text-sm leading-relaxed text-secondary",
          "[&>h2]:mt-10 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:text-primary",
          "[&>h3]:mt-7 [&>h3]:text-sm [&>h3]:font-semibold [&>h3]:text-primary",
          "[&>p]:mt-4",
          "[&>ul]:mt-4 [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-5",
          "[&_li]:list-disc",
          "[&_strong]:font-medium [&_strong]:text-primary",
          "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2",
          // Jamais de césure dans un lien : « contact@ima-frik.tech »,
          // recopié tel quel, n'arriverait nulle part.
          "[&_a]:[hyphens:none]",
        ].join(" ")}
      >
        {children}
      </div>
    </article>
  );
}
