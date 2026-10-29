/**
 * Thème de l'interface : sombre par défaut, clair sur demande.
 *
 * Le sombre n'est pas une préférence esthétique : un radiologue lit dans
 * une pièce assombrie, et une interface claire à côté d'une image en
 * niveaux de gris dégrade sa perception du contraste. Le clair reste
 * disponible pour le personnel des cliniques, en bureau éclairé.
 *
 * Le réglage du système n'est pas suivi, pour la même raison : il ferait
 * basculer l'interface d'un radiologue en clair parce que son portable
 * est configuré ainsi.
 *
 * Le choix vit dans `localStorage`, sous la clé `theme` (celle de
 * next-themes, employé jusqu'en octobre 2026 : les choix déjà faits sont
 * conservés). Il se lit sur la classe de `<html>`, posée avant le premier
 * affichage par `THEME_SCRIPT`.
 */

/** Thèmes proposés. */
export const THEMES = ["dark", "light"] as const;

export type Theme = (typeof THEMES)[number];

/** Thème d'un premier venu, ou d'une valeur stockée illisible. */
export const DEFAULT_THEME: Theme = "dark";

/** Clé du choix dans `localStorage`. */
export const THEME_STORAGE_KEY = "theme";

/**
 * Thème désigné par une valeur stockée.
 *
 * @param value Valeur lue dans `localStorage`, ou `null` sans choix.
 * @returns Le thème, ou le thème par défaut si la valeur n'en est pas un.
 */
export function parseTheme(value: string | null | undefined): Theme {
  return THEMES.find((theme) => theme === value) ?? DEFAULT_THEME;
}

/**
 * Script en ligne qui pose le thème choisi sur `<html>`.
 *
 * Exécuté pendant l'analyse du document, avant le premier affichage : la
 * page ne s'affiche jamais dans un thème pour basculer dans l'autre. Un
 * stockage refusé (navigation privée stricte) laisse le thème par défaut.
 * Il reprend `parseTheme` à la main : il part tel quel dans la page, sans
 * le code de l'application.
 */
export const THEME_SCRIPT = `(function () {
  var theme;
  try {
    theme = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
  } catch (error) {}
  if (${JSON.stringify(THEMES)}.indexOf(theme) < 0) theme = ${JSON.stringify(DEFAULT_THEME)};
  var root = document.documentElement;
  root.classList.remove.apply(root.classList, ${JSON.stringify(THEMES)});
  root.classList.add(theme);
  root.style.colorScheme = theme;
})();`;
