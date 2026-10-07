import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";

import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER } from "@/lib/i18n/locale";
import "./globals.css";

// L'italique est chargé explicitement : sans lui, l'emphase de l'éditeur
// de comptes-rendus était un faux italique — le romain penché par le
// navigateur, aux formes déformées.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "IMAFRIK",
    template: "%s · IMAFRIK",
  },
  description: "Plateforme de téléradiologie",
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
