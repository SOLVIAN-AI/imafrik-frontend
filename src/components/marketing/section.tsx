import { cn } from "@/lib/utils";

/**
 * Section de la vitrine.
 *
 * Toutes partagent la même largeur utile, la même gouttière et le même
 * rythme vertical. Sans cette contrainte, une page longue se met à
 * respirer différemment d'un bloc à l'autre, et l'ensemble paraît assemblé
 * plutôt que composé.
 *
 * **Deux alignements d'en-tête.** Centré (par défaut) au-dessus d'une
 * grille symétrique : un titre calé à gauche au-dessus de colonnes
 * centrées crée un déséquilibre que l'œil remarque sans savoir le nommer.
 * À gauche quand le contenu qui suit est lui-même asymétrique (une liste
 * face à un titre, une capture plus large que le texte).
 *
 * L'en-tête apparaît au défilement (`data-reveal`, voir `reveal.tsx`) ;
 * sans script ou avec « moins de mouvement », il est simplement là.
 *
 * @param eyebrow Étiquette courte au-dessus du titre. Elle situe la
 *                section dans le discours ; elle ne le résume pas.
 * @param lead    Phrase d'introduction, sous le titre.
 * @param align   `center` par défaut ; `left` pour un contenu asymétrique.
 */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  align = "center",
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  children: React.ReactNode;
  className?: string;
}) {
  const centered = align === "center";

  return (
    <section
      id={id}
      className={cn(
        // Une ancre visée ne se cache pas sous l'en-tête fixe du site.
        "mx-auto max-w-7xl scroll-mt-16 px-4 py-20 sm:px-6 md:py-24 lg:px-8",
        className,
      )}
    >
      {(eyebrow ?? title ?? lead) && (
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          lead={lead}
          className={cn(centered && "mx-auto text-center")}
        />
      )}
      {children}
    </section>
  );
}

/**
 * En-tête d'une section : étiquette, titre et introduction.
 *
 * Exporté pour les sections qui le placent elles-mêmes (dans une colonne,
 * sur une bande sombre).
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  className,
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)} data-reveal>
      {eyebrow && <p className="label-eyebrow text-accent">{eyebrow}</p>}
      {title && (
        <h2 className="mt-3.5 text-[2rem] leading-[1.1] font-semibold text-balance md:text-[2.75rem] md:leading-[1.06]">
          {title}
        </h2>
      )}
      {lead && (
        <p className="mt-5 text-base leading-relaxed text-pretty text-secondary md:text-lg md:leading-[1.7]">
          {lead}
        </p>
      )}
    </div>
  );
}
