"use client";

import { EditorContent, useEditor } from "@tiptap/react";

import {
  DOCUMENT_TEXT_CLASSES,
  sectionExtensions,
} from "@/components/editor/extensions";
import {
  REPORT_SECTIONS,
  isSectionEmpty,
  type ReportSections,
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
function DocumentSection({ title, html }: { title: string; html: string }) {
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
      },
    },
  });

  return (
    <section className="border-b border-border-subtle px-5 py-5 last:border-b-0 sm:px-10 sm:py-6">
      <h3 className="label-eyebrow mb-2">{title}</h3>
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
 * @param sections Contenu du compte-rendu.
 * @param language Langue du compte-rendu.
 */
export function ReportDocument({
  sections,
  language,
  className,
}: {
  sections: ReportSections;
  language?: Locale;
  className?: string;
}) {
  const locale = useLocale();
  const titles = messagesFor(language ?? locale).reading.sections.titles;
  return (
    <article
      className={cn(
        "mx-auto max-w-3xl rounded-xl border border-border-subtle",
        "bg-surface-raised shadow-raised",
        className,
      )}
    >
      {REPORT_SECTIONS.filter(
        (section) => !isSectionEmpty(sections[section.key]),
      ).map((section) => (
        <DocumentSection
          key={section.key}
          title={titles[section.key]}
          html={sections[section.key]}
        />
      ))}
    </article>
  );
}
