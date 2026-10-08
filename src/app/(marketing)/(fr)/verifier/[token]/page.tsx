import type { Metadata } from "next";

import { VerifyPage } from "@/components/marketing/pages/verify-page";
import { marketingCopy } from "@/content/marketing";
import { publicPageMetadata } from "@/lib/i18n/metadata";

const t = marketingCopy("fr").meta;

/**
 * La page est publique mais ne doit pas être indexée : chaque adresse
 * contient un code, et un moteur qui les collecterait rendrait
 * vérifiables des documents au hasard.
 */
export async function generateMetadata({
  params,
}: PageProps<"/verifier/[token]">): Promise<Metadata> {
  const { token } = await params;
  // Adresse canonique et équivalents avec le code : chaque document a la
  // sienne, et le sélecteur de langue la conserve.
  return publicPageMetadata("fr", `/verifier/${encodeURIComponent(token)}`, {
    title: t.verifyTitle,
    description: t.verifyDescription,
    index: false,
  });
}

/** Vérification d’un compte-rendu, en français. */
export default async function FrenchVerifyPage({
  params,
}: PageProps<"/verifier/[token]">) {
  const { token } = await params;
  return <VerifyPage token={token} locale="fr" />;
}
