import { MARK, WORDMARK } from "@/components/brand/geometry";
import { cn } from "@/lib/utils";

/**
 * Logotype IMAFRIK — « La Série ».
 *
 * Le nom dessiné comme une série de onze coupes d'imagerie, l'Afrique à
 * la place du A ; la coupe de l'Afrique de l'Ouest, en turquoise, en fait
 * la barre. Le logotype **est** la marque : il ne s'accompagne pas du nom
 * écrit à côté.
 *
 * Les coupes prennent la couleur du texte (`currentColor`) et suivent
 * donc le thème ; la coupe lue prend `--brand-signal`, réglé par thème
 * dans `globals.css`. La taille se donne par la hauteur (`h-5`…), la
 * largeur suit.
 *
 * Tracés produits par `tools/brand/build.py` — voir ce fichier pour la
 * construction.
 *
 * @param title Nom annoncé aux lecteurs d'écran ; vide si un texte voisin
 *              le donne déjà.
 */
export function Wordmark({
  className,
  title = "IMAFRIK",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox={WORDMARK.viewBox}
      className={cn("h-5 w-auto shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <path fill="currentColor" d={WORDMARK.slices} />
      <path fill="var(--brand-signal)" d={WORDMARK.read} />
    </svg>
  );
}

/**
 * Icône IMAFRIK : le A africain, détaché du logotype.
 *
 * Pour les espaces où le nom ne tient pas — icône d'application, onglet,
 * avatar de l'organisation. Trois dessins, un par plage de taille : sous
 * 48 pixels, onze coupes se confondraient ; la version `compact` en garde
 * huit, la version `micro` cinq.
 *
 * @param variant Dessin à employer ; `compact` par défaut, qui couvre la
 *                plupart des usages d'interface (20 à 48 px).
 */
export function BrandMark({
  className,
  variant = "compact",
  title = "IMAFRIK",
}: {
  className?: string;
  variant?: "full" | "compact" | "micro";
  title?: string;
}) {
  const drawing = MARK[variant];
  return (
    <svg
      viewBox={MARK.viewBox}
      className={cn("size-6 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <path fill="currentColor" d={drawing.slices} />
      <path fill="var(--brand-signal)" d={drawing.read} />
    </svg>
  );
}

/**
 * Logotype en tête de la barre latérale, posé sur un halo.
 *
 * Le halo — un dégradé radial très dilué — donne une source lumineuse
 * implicite en haut de la navigation, comme le négatoscope derrière un
 * film. Sans lui, une interface sombre n'est qu'un aplat.
 */
export function BrandLockup() {
  return (
    <div className="relative flex h-14 shrink-0 items-center px-4">
      <div
        className="pointer-events-none absolute -top-8 left-0 h-24 w-44 rounded-full blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, var(--glow-accent), transparent)",
        }}
        aria-hidden
      />
      <Wordmark className="relative h-5" />
    </div>
  );
}
