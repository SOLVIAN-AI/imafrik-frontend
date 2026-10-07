import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/nav";
import type { Locale } from "@/lib/i18n/locale";

/**
 * Disposition de la vitrine publique, dans une langue.
 *
 * Elle vit dans la même application que le produit : même système de
 * design, même déploiement, un seul dépôt. Le coût (redéployer
 * l'application pour corriger un paragraphe d'accueil) est négligeable
 * sur Vercel, et l'alternative reviendrait à maintenir deux fois la même
 * palette et le même composant de bouton.
 *
 * À la différence du produit, la page défile normalement : rien ici ne
 * justifie de bloquer la hauteur à celle de la fenêtre.
 *
 * @param locale Langue de la page ; la balise `<html lang>` est posée par
 *               la disposition racine, d'après l'adresse.
 */
export function MarketingShell({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-surface-base">
      <MarketingNav locale={locale} />
      <main className="flex-1">{children}</main>
      <MarketingFooter locale={locale} />
    </div>
  );
}
