"use client";

import * as React from "react";

import type { Locale } from "@/lib/i18n/locale";

/**
 * Reporte la langue d'un segment sur `<html lang>`.
 *
 * La disposition racine pose la langue au premier chargement, d'après la
 * requête. Mais elle ne se rend plus lors d'une navigation interne : passer
 * du site anglais à l'application française laisserait `lang="en"` sur
 * une page en français, et un lecteur d'écran la lirait avec la mauvaise
 * prononciation. Chaque disposition déclare donc sa langue, et ce
 * composant la reporte à chaque changement de segment.
 *
 * @param lang Langue du segment.
 */
export function HtmlLang({ lang }: { lang: Locale }) {
  React.useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
