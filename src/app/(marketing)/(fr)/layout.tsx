import { MarketingShell } from "@/components/marketing/marketing-shell";

/** Vitrine publique en français, langue par défaut, sans préfixe d'adresse. */
export default function FrenchMarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell locale="fr">{children}</MarketingShell>;
}
