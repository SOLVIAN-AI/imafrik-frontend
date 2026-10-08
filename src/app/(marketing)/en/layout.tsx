import { MarketingShell } from "@/components/marketing/marketing-shell";

/** Vitrine publique en anglais, sous le préfixe `/en`. */
export default function EnglishMarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingShell locale="en">{children}</MarketingShell>;
}
