"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** Une entrée du sommaire. */
interface Entry {
  id: string;
  label: string;
}

/**
 * Ancre lisible tirée d'un intitulé : minuscules, sans accents ni
 * ponctuation (« 2. Données de santé » → « donnees-de-sante »).
 *
 * @param text Intitulé de section.
 */
export function anchorFor(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Sommaire d'une page légale, fixé à droite du texte sur grand écran.
 *
 * Lu dans la page plutôt que déclaré à part : les intitulés de section
 * (`h2`) du document sont la seule source, et un sommaire tenu à la main
 * finirait par diverger du texte. Une section sans ancre en reçoit une,
 * tirée de son intitulé, si bien que chaque section devient adressable.
 *
 * Construit après l'affichage : le rendu serveur n'en a pas besoin, et le
 * texte reste lisible et indexé sans lui.
 *
 * @param contentId Identifiant du conteneur du texte.
 * @param label     Nom du sommaire, pour les lecteurs d'écran.
 */
export function LegalToc({
  contentId,
  label,
}: {
  contentId: string;
  label: string;
}) {
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [current, setCurrent] = React.useState<string | null>(null);

  React.useEffect(() => {
    const content = document.getElementById(contentId);
    if (!content) return;
    const headings = [...content.querySelectorAll<HTMLHeadingElement>("h2")];
    const found = headings.map((heading) => {
      if (!heading.id) heading.id = anchorFor(heading.textContent ?? "");
      return { id: heading.id, label: heading.textContent ?? "" };
    });
    // Publié à l'image suivante, une fois les ancres posées dans la page.
    const frame = requestAnimationFrame(() => {
      setEntries(found);
      setCurrent(found[0]?.id ?? null);
    });

    // La section courante : la dernière dont l'intitulé est passé sous le
    // haut de la fenêtre.
    const observer = new IntersectionObserver(
      (observed) => {
        for (const entry of observed) {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        }
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [contentId]);

  if (entries.length < 3) return null;
  return (
    <nav aria-label={label} className="sticky top-24 hidden xl:block">
      <p className="label-eyebrow">{label}</p>
      <ol className="mt-4 flex flex-col gap-1 border-l border-border-subtle">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={current === entry.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-1 pl-4 text-xs leading-snug transition-colors",
                current === entry.id
                  ? "border-accent text-primary"
                  : "border-transparent text-tertiary hover:text-secondary",
              )}
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
