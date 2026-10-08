/**
 * Audit de mise en page, exécuté dans la page.
 *
 * Repris du script d'audit manuel : il cherche ce qu'une capture d'écran
 * montrerait à un œil attentif, mais sur chaque page et chaque largeur.
 *
 * 1. **Défilement horizontal** de la page entière.
 * 2. **Texte rogné** : un élément porteur de texte plus large que sa boîte,
 *    sans ellipse ni défilement prévus.
 * 3. **Chevauchements** entre textes visibles ou contrôles : le texte est
 *    mesuré ligne par ligne (une boîte de paragraphe recouvre volontiers
 *    une icône voisine), dans la zone réellement visible de ses ancêtres
 *    qui rognent, et seulement si les deux éléments sont effectivement
 *    au premier plan au point de contact.
 * 4. **Cibles tactiles** de moins de 24 px sur téléphone (WCAG 2.2, 2.5.8).
 *
 * Seul le texte visible compte : un descendant `.sr-only` (texte destiné
 * aux lecteurs d'écran, rogné à 1 px) fausserait la mesure.
 *
 * La fonction est sérialisée vers le navigateur par `page.evaluate` : elle
 * ne doit rien référencer hors de son propre corps.
 */

/** Une anomalie relevée. */
export interface LayoutIssue {
  kind: "page-overflow-x" | "text-overflow" | "overlap" | "small-target";
  detail: string;
}

/**
 * Inspecte la page courante.
 *
 * @param options.mobile Vrai sur un écran de téléphone : active le
 *                       contrôle des cibles tactiles.
 * @returns Les anomalies, vide si la page est propre.
 */
export function inspectLayout({ mobile }: { mobile: boolean }): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const CONTROLS = "button, a, input, select, textarea, [role=button], kbd";

  const describe = (el: Element): string => {
    const text = (
      (el as HTMLElement).innerText ||
      el.getAttribute("aria-label") ||
      el.tagName
    )
      .trim()
      .replace(/\s+/g, " ");
    const cls = (el.getAttribute("class") ?? "")
      .split(" ")
      .slice(0, 4)
      .join(".");
    return `<${el.tagName.toLowerCase()}${cls ? `.${cls}` : ""}> « ${text.slice(0, 50)} »`;
  };

  const visible = (el: Element): boolean => {
    if (el.closest(".sr-only")) return false;
    const closed = el.closest("details:not([open])");
    if (closed && !el.closest("summary")) return false;
    const style = getComputedStyle(el);
    if (
      style.visibility === "hidden" ||
      style.display === "none" ||
      Number(style.opacity) === 0
    )
      return false;
    const r = el.getBoundingClientRect();
    // Hors de l'écran à dessein (champ piège anti-robots…).
    if (r.right <= 0 || r.bottom + window.scrollY <= 0) return false;
    return r.width > 0 && r.height > 0;
  };

  const hasOwnText = (el: Element): boolean =>
    [...el.childNodes].some(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
    );

  // 1. Défilement horizontal de la page.
  const overflowX = document.documentElement.scrollWidth - window.innerWidth;
  if (overflowX > 1) {
    // Coupables : les éléments les plus profonds qui dépassent à droite.
    const culprits = [...document.querySelectorAll("body *")].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.right <= window.innerWidth + 1 || r.width === 0) return false;
      if (getComputedStyle(el).position === "fixed") return false;
      return ![...el.children].some(
        (c) => c.getBoundingClientRect().right > window.innerWidth + 1,
      );
    });
    issues.push({
      kind: "page-overflow-x",
      detail: `${overflowX}px ← ${culprits.slice(0, 3).map(describe).join(" | ")}`,
    });
  }

  // 2. Texte qui déborde de sa boîte (sans ellipse) ou rogné.
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el) || el.closest("svg, [data-sonner-toaster], .ProseMirror"))
      continue;
    if (!hasOwnText(el)) continue;
    const style = getComputedStyle(el);
    if (style.textOverflow === "ellipsis") continue;
    if (["auto", "scroll"].includes(style.overflowX)) continue;
    if (
      el.scrollWidth > el.clientWidth + 1 &&
      el.clientWidth > 0 &&
      style.display !== "inline"
    ) {
      issues.push({
        kind: "text-overflow",
        detail: `${describe(el)} ${el.scrollWidth}>${el.clientWidth}`,
      });
    }
  }

  // 3. Chevauchements entre éléments porteurs de texte ou interactifs.
  const isControl = (el: Element) => el.matches(CONTROLS);
  const candidates = [...document.querySelectorAll("body *")].filter((el) => {
    if (!visible(el) || el.closest("[data-sonner-toaster]")) return false;
    if (isControl(el)) return true;
    if (el.closest("button, a")) return false; // le contrôle parent suffit
    return hasOwnText(el);
  });

  interface Box {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }
  // Zone réellement visible : intersection avec chaque ancêtre qui rogne.
  const clip = (el: Element, r: DOMRect): Box | null => {
    let { left, top, right, bottom } = r;
    for (let a: Element | null = el; a; a = a.parentElement) {
      const st = getComputedStyle(a);
      if (st.overflowX !== "visible" || st.overflowY !== "visible") {
        const c = a.getBoundingClientRect();
        left = Math.max(left, c.left);
        top = Math.max(top, c.top);
        right = Math.min(right, c.right);
        bottom = Math.min(bottom, c.bottom);
      }
    }
    return right - left > 0 && bottom - top > 0
      ? { left, top, right, bottom }
      : null;
  };
  // Rectangles ligne par ligne pour le texte, boîte entière pour un contrôle.
  const rectsOf = (el: Element): Box[] => {
    const raw = isControl(el)
      ? [el.getBoundingClientRect()]
      : [...el.childNodes]
          .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
          .flatMap((n) => {
            const range = document.createRange();
            range.selectNodeContents(n);
            return [...range.getClientRects()];
          });
    return raw.map((r) => clip(el, r)).filter((b): b is Box => b !== null);
  };
  // Bouton posé volontairement dans un champ (afficher le mot de passe…).
  const adornment = (a: Element, b: Element): boolean => {
    const field = a.matches("input, textarea")
      ? a
      : b.matches("input, textarea")
        ? b
        : null;
    if (!field) return false;
    const other = field === a ? b : a;
    return (
      getComputedStyle(other).position === "absolute" &&
      other.parentElement === field.parentElement
    );
  };

  const boxes = candidates
    .map((el) => ({ el, rs: rectsOf(el) }))
    .filter((box) => box.rs.length > 0);
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.el.contains(b.el) || b.el.contains(a.el) || adornment(a.el, b.el))
        continue;
      let hit: { x: number; y: number; cx: number; cy: number } | null = null;
      for (const ra of a.rs)
        for (const rb of b.rs) {
          const x = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const y = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (x >= 2 && y >= 2)
            hit = {
              x,
              y,
              cx: Math.max(ra.left, rb.left) + x / 2,
              cy: Math.max(ra.top, rb.top) + y / 2,
            };
        }
      if (!hit) continue;
      if (
        hit.cx >= 0 &&
        hit.cy >= 0 &&
        hit.cx <= window.innerWidth &&
        hit.cy <= window.innerHeight
      ) {
        // Un élément recouvert par un autre (panneau, menu) ne se voit pas :
        // ce n'est pas un chevauchement de texte.
        const stack = document.elementsFromPoint(hit.cx, hit.cy);
        const seen = (el: Element) =>
          stack.some((s) => s === el || el.contains(s) || s.contains(el));
        if (!(seen(a.el) && seen(b.el))) continue;
      }
      issues.push({
        kind: "overlap",
        detail: `${describe(a.el)} ⨯ ${describe(b.el)} (${Math.round(hit.x)}×${Math.round(hit.y)})`,
      });
    }
  }

  // 4. Cibles tactiles trop petites (WCAG 2.2 : 24 px).
  if (mobile) {
    for (const el of document.querySelectorAll(
      "button, a, input, select, [role=button]",
    )) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (el.matches("a") && getComputedStyle(el).display === "inline")
        continue; // lien dans un texte
      if (el.matches("input") && el.closest("label")) continue; // le libellé entier est la cible
      if (r.width < 24 || r.height < 24)
        issues.push({
          kind: "small-target",
          detail: `${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`,
        });
    }
  }

  // Une même anomalie se répète souvent (une ligne par examen) : une seule fois suffit.
  const unique = new Map(
    issues.map((issue) => [`${issue.kind}${issue.detail}`, issue]),
  );
  return [...unique.values()];
}
