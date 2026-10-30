"use client";

import { EditorContent, useEditor } from "@tiptap/react";

import {
  DOCUMENT_TEXT_CLASSES,
  sectionExtensions,
} from "@/components/editor/extensions";
import {
  DEFAULT_LAYOUT,
  isSectionEmpty,
  type ReportLayout,
  type ReportSections,
  sectionsOf,
} from "@/components/editor/sections";
import { messagesFor } from "@/i18n";
import { useLocale } from "@/i18n/client";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

/**
 * Une section, rendue en lecture seule.
 *
 * Le contenu passe par le **même éditeur** que la rédaction, simplement
 * verrouillé. Ce détour n'est pas gratuit : Tiptap analyse le HTML au
 * travers du schéma restreint défini pour les comptes-rendus et écarte
 * tout ce qui n'y figure pas. Injecter la chaîne directement dans le DOM
 * exposerait l'écran à ce qu'un client d'API mal intentionné aurait pu
 * écrire dans la base.
 */
function DocumentSection({
  title,
  html,
  variant = "section",
}: {
  title: string;
  html: string;
  /** Texte libre sans intitulé visible, ou conclusion encadrée : voir `ReportEditor`. */
  variant?: "section" | "free" | "conclusion";
}) {
  const editor = useEditor({
    extensions: sectionExtensions(),
    content: html,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // Mêmes classes que l'éditeur : un document signé a exactement
        // l'allure qu'il avait pendant sa rédaction.
        class: DOCUMENT_TEXT_CLASSES,
        // Le texte figé reste une zone de texte pour les lecteurs d'écran :
        // elle porte le nom de sa section.
        "aria-label": title,
        "aria-readonly": "true",
      },
    },
  });

  if (variant === "conclusion") {
    return (
      <section className="px-5 pt-2 pb-5 sm:px-10 sm:pb-6">
        <div className="rounded-lg border border-border-default bg-surface-sunken/60 px-4 py-3 sm:px-5 sm:py-4">
          <h3 className="label-eyebrow mb-2">{title}</h3>
          <div className="[&_p]:font-medium">
            <EditorContent editor={editor} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border-subtle px-5 py-5 last:border-b-0 sm:px-10 sm:py-6">
      <h3 className={cn("label-eyebrow mb-2", variant === "free" && "sr-only")}>
        {title}
      </h3>
      <EditorContent editor={editor} />
    </section>
  );
}

/**
 * Compte-rendu signé, en consultation.
 *
 * Même mise en page que l'éditeur — mêmes marges, même mesure de ligne,
 * même feuille — mais sans barre d'outils ni curseur. Un document signé
 * qui s'afficherait dans un cadre différent de celui où il a été rédigé
 * sèmerait le doute sur ce qui a réellement été signé.
 *
 * Les sections vides sont **omises** : un compte-rendu où « Comparatif »
 * apparaît sans contenu donne l'impression d'un document incomplet,
 * alors que l'absence de comparatif est une information en soi, que le
 * radiologue écrit quand elle compte.
 *
 * Les intitulés suivent la langue du compte-rendu quand elle est connue
 * (`language`, celle du contrat de la clinique), comme sur le PDF ; à
 * défaut, celle de l'utilisateur.
 *
 * **Feuille blanche** (`layout`) : le texte libre tel que le radiologue
 * l'a mis en forme, sans intitulé ajouté, puis la conclusion, encadrée
 * comme dans l'éditeur. Le PDF l'imprime à la même place, en gras.
 *
 * @param sections Contenu du compte-rendu.
 * @param layout   Mise en page du compte-rendu.
 * @param language Langue du compte-rendu.
 */
export function ReportDocument({
  sections,
  layout = DEFAULT_LAYOUT,
  language,
  className,
}: {
  sections: ReportSections;
  layout?: ReportLayout;
  language?: Locale;
  className?: string;
}) {
  const locale = useLocale();
  const titles = messagesFor(language ?? locale).reading.sections.titles;
  return (
    <article
      data-layout={layout}
      className={cn(
        "mx-auto max-w-3xl rounded-xl border border-border-subtle",
        "bg-surface-raised shadow-raised",
        className,
      )}
    >
      {sectionsOf(layout)
        .filter((section) => !isSectionEmpty(sections[section.key]))
        .map((section) => (
          <DocumentSection
            key={section.key}
            title={titles[section.key]}
            html={sections[section.key]}
            variant={
              layout === "free"
                ? section.key === "corps"
                  ? "free"
                  : "conclusion"
                : "section"
            }
          />
        ))}
    </article>
  );
}
