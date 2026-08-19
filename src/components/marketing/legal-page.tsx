import type { Metadata } from "next";

/**
 * Fabrique les métadonnées d'une page légale.
 *
 * Ces pages sont publiques et doivent être indexables — c'est même une
 * obligation pratique : une mention légale introuvable ne remplit pas sa
 * fonction.
 */
export function legalMetadata(title: string, description: string): Metadata {
  return { title, description, robots: { index: true, follow: true } };
}

/**
 * Gabarit d'une page de texte long.
 *
 * La mesure de ligne est bornée à 68 caractères et l'interligne élargi :
 * un document juridique se lit mal, autant ne pas y ajouter une
 * typographie hostile. Les styles sont appliqués par sélecteurs
 * descendants plutôt que classe par classe — c'est le seul endroit de
 * l'application où le contenu est rédigé plutôt que composé.
 *
 * @param updatedAt Date de dernière mise à jour, en toutes lettres. Une
 *                  page de conditions sans date ne vaut rien : on ne
 *                  peut pas savoir à quoi on a consenti.
 */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <p className="label-eyebrow text-accent">Informations légales</p>
      <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{title}</h1>
      <p className="mt-3 text-xs text-tertiary">
        Dernière mise à jour : {updatedAt}
      </p>

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
        ].join(" ")}
      >
        {children}
      </div>
    </article>
  );
}
