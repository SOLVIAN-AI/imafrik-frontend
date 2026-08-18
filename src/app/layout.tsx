import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
  // Aucune indexation : chaque écran est derrière authentification et
  // manipule des données de santé.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // Accordé au fond de l'interface : sans cela, la barre du navigateur
  // mobile resterait claire au-dessus d'une application sombre.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0c0e12" },
    { media: "(prefers-color-scheme: light)", color: "#f7f8f9" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : next-themes pose la classe de thème sur
    // <html> avant l'hydratation, ce que React signalerait autrement
    // comme une divergence.
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
