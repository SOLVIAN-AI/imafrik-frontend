import { cn } from "@/lib/utils";

/**
 * Section de la vitrine.
 *
 * Toutes partagent la même largeur utile et le même rythme vertical.
 * Sans cette contrainte, une page longue se met à respirer
 * différemment d'un bloc à l'autre, et l'ensemble paraît assemblé plutôt
 * que composé.
 *
 * @param eyebrow Étiquette courte au-dessus du titre. Elle situe la
 *                section dans le discours ; elle ne le résume pas.
 * @param lead    Phrase d'introduction, sous le titre.
 */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn("mx-auto max-w-6xl px-6 py-16 md:py-24", className)}
    >
      {(eyebrow ?? title ?? lead) && (
        <div className="max-w-2xl">
          {eyebrow && <p className="label-eyebrow text-accent">{eyebrow}</p>}
          {title && (
            <h2 className="mt-3 text-3xl font-semibold md:text-4xl">{title}</h2>
          )}
          {lead && (
            <p className="mt-4 text-base leading-relaxed text-secondary">
              {lead}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
