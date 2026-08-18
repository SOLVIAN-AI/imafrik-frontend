import type { Metadata } from "next";

import { Audiences } from "@/components/marketing/audiences";
import { FinalCta } from "@/components/marketing/cta";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { SecurityTeaser } from "@/components/marketing/security-teaser";

/**
 * Référencement de la page d'accueil.
 *
 * C'est le **seul** écran du service qui doit être indexé : tout le
 * reste est derrière authentification et manipule des données de santé.
 * La consigne globale posée dans la disposition racine interdit
 * l'indexation ; elle est levée ici, et seulement ici.
 */
export const metadata: Metadata = {
  // `absolute` court-circuite le gabarit « %s · IMAFRIK » de la
  // disposition racine : le nom y figure déjà.
  title: {
    absolute: "IMAFRIK — Téléradiologie pour l’Afrique de l’Ouest",
  },
  description:
    "Vos examens lus le jour même par des radiologues inscrits à l’Ordre. Aucun investissement matériel : votre PACS envoie, nous lisons, vous recevez un compte-rendu signé.",
  robots: { index: true, follow: true },
};

/**
 * Page d'accueil.
 *
 * L'ordre des sections suit celui d'une conversation commerciale : ce
 * que ça change (accroche), comment ça marche, pour qui, est-ce sûr,
 * combien, et les objections. Chacune répond à la question que soulève
 * la précédente.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Audiences />
      <SecurityTeaser />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
