"use client";

import * as React from "react";

/**
 * Apparition des blocs de la vitrine au défilement.
 *
 * Chaque élément marqué `data-reveal` monte de quelques pixels en
 * apparaissant, une fois, la première fois qu'il entre à l'écran ;
 * `--reveal-order` décale les éléments d'une même rangée. Le style est dans
 * `globals.css`.
 *
 * **Rien n'est caché sans raison.** Le masquage n'est activé qu'une fois
 * ce script prêt (`data-reveal-ready` sur `<html>`), et ce qui est déjà à
 * l'écran à ce moment est marqué apparu avant le premier rendu : sans
 * script, avec « moins de mouvement », ou pour ce qu'on voit en arrivant,
 * le contenu est simplement là. Ancré au milieu de la page (`/#tarifs`),
 * le visiteur ne voit donc rien s'animer sous ses yeux.
 *
 * Un seul observateur pour toute la page, retiré au démontage.
 */
export function Reveal() {
  React.useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const elements = [
      ...document.querySelectorAll<HTMLElement>("[data-reveal]"),
    ];
    const show = (element: Element) =>
      element.setAttribute("data-revealed", "");

    // Ce qui est déjà visible le reste, sans transition.
    for (const element of elements) {
      const box = element.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) show(element);
    }
    root.setAttribute("data-reveal-ready", "");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          observer.unobserve(entry.target);
        }
      },
      // Déclenché un peu avant le bas de l'écran : le mouvement se termine
      // quand l'œil arrive, il ne le précède pas.
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const element of elements)
      if (!element.hasAttribute("data-revealed")) observer.observe(element);

    return () => {
      observer.disconnect();
      root.removeAttribute("data-reveal-ready");
    };
  }, []);

  return null;
}
