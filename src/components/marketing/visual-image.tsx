import { sourceSet, type Visual } from "@/content/marketing/visuals";

/**
 * Image de la vitrine, servie à partir de fichiers déjà réduits.
 *
 * Chaque visuel existe à plusieurs largeurs (`content/marketing/visuals.ts`)
 * : le navigateur choisit la plus juste d'après `sizes` et la densité de
 * l'écran. La largeur et la hauteur intrinsèques sont toujours posées, si
 * bien que la place de l'image est réservée avant son arrivée : aucun
 * décalage de mise en page.
 *
 * `next/image` n'apporterait ici qu'un ré-encodage, fait à la demande par
 * le serveur au premier visiteur : les fichiers sont déjà en WebP, à la
 * bonne taille.
 *
 * @param visual   Visuel pré-généré.
 * @param alt      Texte de remplacement ; vide pour une image décorative
 *                 dont le texte voisin porte l'information.
 * @param sizes    Largeur d'affichage, au format de l'attribut `sizes`.
 * @param priority Image de la première vue : chargée au plus tôt, jamais
 *                 différée.
 */
export function VisualImage({
  visual,
  alt,
  sizes,
  priority = false,
  className,
}: {
  visual: Visual;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const { src, srcSet } = sourceSet(visual);
  const width = visual.widths[visual.widths.length - 1];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- fichiers déjà réduits à chaque largeur, voir plus haut.
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={width}
      height={Math.round(width * visual.ratio)}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      className={className}
    />
  );
}
