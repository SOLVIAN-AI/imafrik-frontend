"use client";

import { EditorContent, useEditor } from "@tiptap/react";

import {
  REPORT_SECTIONS,
  isSectionEmpty,
  sectionExtensions,
  type ReportSections,
} from "@/components/editor/report-editor";
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
        class: cn(
          "max-w-[68ch] text-[0.9375rem] leading-[1.75]",
          "[&_p+p]:mt-3 [&_strong]:font-semibold",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
        ),
      },
    },
  });

  return (
    <section className="border-b border-border-subtle px-10 py-6 last:border-b-0">
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
 */
export function ReportDocument({
  sections,
  className,
}: {
  sections: ReportSections;
  className?: string;
}) {
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
          title={section.title}
          html={sections[section.key]}
        />
      ))}
    </article>
  );
}
