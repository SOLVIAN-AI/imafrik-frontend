"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import * as React from "react";

/**
 * Fournit le thème à l'application.
 *
 * `defaultTheme="dark"` n'est pas une préférence esthétique : un
 * radiologue lit dans une pièce assombrie, et une interface claire à côté
 * d'une image en niveaux de gris dégrade sa perception du contraste. Le
 * clair reste disponible pour le personnel des cliniques, en bureau
 * éclairé.
 *
 * `enableSystem` est désactivé pour la même raison : suivre le réglage du
 * système ferait basculer l'interface d'un radiologue en clair parce que
 * son portable est configuré ainsi.
 *
 * `disableTransitionOnChange` évite qu'un basculement anime chaque
 * couleur de la page — spectaculaire une fois, pénible ensuite.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={["dark", "light"]}
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
