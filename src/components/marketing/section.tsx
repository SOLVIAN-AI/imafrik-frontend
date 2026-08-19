import { cn } from "@/lib/utils";

/**
 * Section de la vitrine.
 *
 * Toutes partagent la même largeur utile et le même rythme vertical.
 * Sans cette contrainte, une page longue se met à respirer différemment
 * d\'un bloc à l\'autre, et l\'ensemble paraît assemblé plutôt que
 * composé.
 *
 * **L\'en-tête est centré par défaut.** Sur une page d\'accueil, le
 * contenu qui suit est presque toujours une grille symétrique : un titre
 * calé à gauche au-dessus de trois colonnes centrées crée un
 * déséquilibre que l\'œil remarque sans savoir le nommer. Les pages de
 * lecture suivie gardent l\'alignement à gauche, où le retour à la ligne
 * compte plus que la symétrie.
 *
 * @param eyebrow Étiquette courte au-dessus du titre. Elle situe la
 *                section dans le discours ; elle ne le résume pas.
 * @param lead    Phrase d\'introduction, sous le titre.
 * @param align   `center` par défaut ; `left` pour du texte suivi.
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
      className={cn("mx-auto max-w-6xl px-6 py-16 md:py-24", className)}
    >
      {(eyebrow ?? title ?? lead) && (
        <div className={cn("max-w-2xl", centered && "mx-auto text-center")}>
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
