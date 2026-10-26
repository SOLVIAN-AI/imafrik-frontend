import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";

import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER } from "@/lib/i18n/locale";
import { shareImage } from "@/lib/i18n/share-image";
import { siteOrigin } from "@/lib/seo/site";
import { messagesFor } from "@/i18n";
import "./globals.css";

// L'italique est chargé explicitement : sans lui, l'emphase de l'éditeur
// de comptes-rendus était un faux italique — le romain penché par le
// navigateur, aux formes déformées.
//
// Aucune police n'est préchargée : le navigateur découvre chaque fonte dans
// la feuille de style, au premier calcul de mise en page, et ne télécharge
// que celles que la page emploie. Préchargées, les trois (romain, italique,
// chasse fixe) partaient à chaque page avant l'image du premier écran,
// italique compris, que la vitrine n'emploie nulle part. Le texte s'affiche
// d'abord dans la police de secours, aux métriques ajustées sur Geist par
// Next : la bascule ne décale pas la mise en page.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await headers()).get(LOCALE_HEADER);
  return {
    ...BASE_METADATA,
    description: messagesFor(isLocale(locale) ? locale : DEFAULT_LOCALE).common
      .appDescription,
  };
}

/** Métadonnées communes à toutes les pages ; la description suit la langue. */
const BASE_METADATA: Metadata = {
  // Base des adresses absolues des métadonnées, dont les images de
  // partage (`opengraph-image.png`). Sans elle, Next les bâtirait sur
  // l'adresse du déploiement : un aperçu `*.vercel.app`, éphémère, que
  // WhatsApp ou LinkedIn garderaient en cache.
  metadataBase: new URL(siteOrigin()),
  // Pages sans bloc Open Graph propre (connexion, application) : l'image
  // de partage française, la langue par défaut.
  ...shareImage(DEFAULT_LOCALE),
  title: {
    default: "IMAFRIK",
    template: "%s · IMAFRIK",
  },
  applicationName: "IMAFRIK",
  // Installation sur l'écran d'accueil d'un iPhone : nom sous l'icône,
  // ouverture en plein écran, barre d’état sombre et opaque — « translucent »
  // ferait passer l’en-tête de l’application sous l’encoche.
  // L'icône elle-même est `app/apple-icon.png`, déclarée par Next.
  appleWebApp: {
    capable: true,
    title: "IMAFRIK",
    statusBarStyle: "black",
  },
  // Aucune indexation : chaque écran est derrière authentification et
  // manipule des données de santé.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // Accordé au fond de l'interface : sans cela, la barre du navigateur
  // mobile resterait claire au-dessus d'une application sombre.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1124" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8f9" },
  ],
};

/**
 * Disposition racine.
 *
 * Elle lit le nonce de la politique de sécurité du contenu, posé par le
 * proxy pour cette requête, et le transmet à next-themes — dont le script
 * d'initialisation du thème est le seul script en ligne de l'application
 * que Next ne marque pas lui-même. Lire les en-têtes rend chaque page
 * dynamique : c'est la condition, documentée par Next, pour qu'un nonce
 * différent puisse être servi à chaque requête.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  // Langue posée par le proxy d'après l'adresse : `/en/…` est en anglais,
  // tout le reste (site public français et application) en français.
  const locale = requestHeaders.get(LOCALE_HEADER);
  const lang = isLocale(locale) ? locale : DEFAULT_LOCALE;

  return (
    // suppressHydrationWarning : next-themes pose la classe de thème sur
    // <html> avant l'hydratation, ce que React signalerait autrement
    // comme une divergence.
    <html lang={lang} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider nonce={nonce}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
