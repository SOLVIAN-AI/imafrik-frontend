import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/nav";

/**
 * Disposition de la vitrine publique.
 *
 * Elle vit dans la même application que le produit : même système de
 * design, même déploiement, un seul dépôt. Le coût — redéployer
 * l'application pour corriger un paragraphe d'accueil — est négligeable
 * sur Vercel, et l'alternative reviendrait à maintenir deux fois la même
 * palette et le même composant de bouton.
 *
 * À la différence du produit, la page défile normalement : rien ici ne
 * justifie de bloquer la hauteur à celle de la fenêtre.
 */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-base">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
