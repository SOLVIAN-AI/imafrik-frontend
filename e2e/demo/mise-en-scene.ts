import type { BrowserContext, Locator, Page } from "@playwright/test";

/**
 * Mise en scène de la vidéo de démonstration.
 *
 * La vidéo est celle que Playwright enregistre de la page : tout ce que
 * le spectateur doit voir en plus de l'application (sous-titres, cartons
 * de titre, pointeur, cadre autour d'un bouton) est donc **injecté dans
 * la page**, par-dessus l'interface, sans jamais la modifier. Ces
 * éléments ne captent aucun clic (`pointer-events: none`) et vivent hors
 * de l'arbre de React, qui ne les connaît pas.
 *
 * Les attentes fixes, proscrites dans les tests, sont ici le propos : ce
 * sont les temps de lecture du spectateur. Elles passent toutes par
 * {@link Scene.pause}, pour que le rythme se règle à un seul endroit.
 */

/** Identifiants des éléments injectés. */
const IDS = {
  caption: "imafrik-demo-sous-titre",
  card: "imafrik-demo-carton",
  cursor: "imafrik-demo-pointeur",
  ripple: "imafrik-demo-clic",
  ring: "imafrik-demo-cadre",
} as const;

/** Couche au-dessus de tout, y compris des fenêtres de Radix (`z-50`). */
const Z_TOP = 2147483640;

/** Durée des fondus des sous-titres et des cartons, en millisecondes. */
const FADE_MS = 280;

/**
 * Règles d'écriture du produit, vérifiées sur chaque texte affiché : la
 * vidéo est montrée à des clients, elle suit la même typographie que
 * l'interface (voir `src/lib/typography.test.ts`).
 *
 * @param text Texte d'un sous-titre ou d'un carton.
 * @throws Si le texte contient une apostrophe droite ou un tiret long.
 */
export function checkTypography(text: string): void {
  if (/['—–]/.test(text))
    throw new Error(
      `Typographie : apostrophe droite ou tiret long dans « ${text} »`,
    );
}

/**
 * Cookie d'un carton à monter dès le chargement de la page suivante.
 *
 * Un cookie plutôt que le stockage de session : il se pose depuis le
 * scénario avant même que la première page existe, et le script
 * d'initialisation le lit de façon synchrone, avant le premier rendu.
 */
const PENDING_CARD_COOKIE = "imafrik-demo-carton";

/**
 * Éléments de mise en scène présents dans chaque page chargée.
 *
 * - **Le pointeur.** Un navigateur sans interface ne dessine pas de
 *   pointeur : sans lui, les clics paraîtraient venir de nulle part. Le
 *   script dessine une flèche, que `window.__imafrikDemoGlide` fait
 *   glisser d'un point à un autre avec une courbe d'accélération de
 *   vraie main. Elle suit aussi les événements `mousemove` (molette,
 *   clic) et marque chaque clic d'une onde brève.
 * - **Les cartons.** `window.__imafrikDemoCard` dessine un carton plein
 *   écran. Un carton demandé avant une navigation complète (changement de
 *   portail) est monté dès le début du chargement suivant, avant le
 *   premier rendu : le spectateur ne voit pas la page se recharger.
 *
 * Le script d'initialisation s'exécute avant que le document ait un
 * élément racine : tout ajout attend donc qu'il existe.
 *
 * @param context Contexte du navigateur ; le script s'applique à chaque page chargée.
 */
export async function installOverlays(context: BrowserContext): Promise<void> {
  await context.addInitScript(
    ({ ids, z, pendingCookie }) => {
      /** Ajoute un élément à la racine du document, dès qu'elle existe. */
      const attach = (node: HTMLElement) => {
        if (document.documentElement) {
          document.documentElement.appendChild(node);
          return;
        }
        const observer = new MutationObserver(() => {
          if (!document.documentElement) return;
          observer.disconnect();
          document.documentElement.appendChild(node);
        });
        observer.observe(document, { childList: true });
      };

      const card = (title: string, subtitle: string) => {
        document.getElementById(ids.card)?.remove();
        const node = document.createElement("div");
        node.id = ids.card;
        node.setAttribute("aria-hidden", "true");
        Object.assign(node.style, {
          position: "fixed",
          inset: "0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "22px",
          padding: "0 120px",
          background:
            "radial-gradient(ellipse at 30% 20%, #115e55 0%, #0b3b34 38%, #0a1220 100%)",
          color: "#ffffff",
          fontFamily: "Inter, system-ui, sans-serif",
          textAlign: "center",
          pointerEvents: "none",
          zIndex: String(z + 5),
        });
        const brand = document.createElement("div");
        brand.textContent = "IMAFRIK";
        Object.assign(brand.style, {
          font: "700 22px/1 Inter, system-ui, sans-serif",
          letterSpacing: "0.34em",
          color: "#5eead4",
        });
        const rule = document.createElement("div");
        Object.assign(rule.style, {
          width: "56px",
          height: "3px",
          borderRadius: "2px",
          background: "#5eead4",
          opacity: "0.7",
        });
        const heading = document.createElement("div");
        heading.textContent = title;
        Object.assign(heading.style, {
          font: "650 54px/1.15 Inter, system-ui, sans-serif",
          letterSpacing: "-0.01em",
          maxWidth: "1100px",
        });
        const line = document.createElement("div");
        line.textContent = subtitle;
        Object.assign(line.style, {
          font: "400 26px/1.45 Inter, system-ui, sans-serif",
          maxWidth: "980px",
          color: "rgba(255, 255, 255, 0.84)",
        });
        node.append(brand, rule, heading, line);
        attach(node);
      };
      (window as unknown as Record<string, unknown>).__imafrikDemoCard = card;

      const pending = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith(`${pendingCookie}=`));
      if (pending) {
        document.cookie = `${pendingCookie}=; max-age=0; path=/`;
        const { title, subtitle } = JSON.parse(
          decodeURIComponent(pending.slice(pendingCookie.length + 1)),
        ) as { title: string; subtitle: string };
        card(title, subtitle);
      }

      /** Stockage de session, absent d'une page vide (`about:blank`). */
      const session = (): Storage | null => {
        try {
          return window.sessionStorage;
        } catch {
          return null;
        }
      };

      /** Flèche du pointeur, pointe en haut à gauche (point chaud en 0,0). */
      const ARROW =
        '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">' +
        '<path d="M3 2 L3 22 L8.6 17.2 L12.4 25.6 L16 24 L12.3 15.8 L19.6 15.4 Z" ' +
        'fill="#0f172a" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/></svg>';

      const mountCursor = () => {
        if (document.getElementById(ids.cursor)) return;
        const pointer = document.createElement("div");
        pointer.id = ids.cursor;
        pointer.setAttribute("aria-hidden", "true");
        pointer.innerHTML = ARROW;
        Object.assign(pointer.style, {
          position: "fixed",
          left: "0",
          top: "0",
          width: "28px",
          height: "28px",
          marginLeft: "-3px",
          marginTop: "-2px",
          filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35))",
          pointerEvents: "none",
          zIndex: String(z + 3),
          transform:
            session()?.getItem(ids.cursor) ?? "translate(-100px, -100px)",
          transformOrigin: "3px 2px",
        });
        attach(pointer);
      };
      /** Place la flèche, en glissant pendant `duration` millisecondes. */
      const place = (x: number, y: number, duration: number) => {
        mountCursor();
        const pointer = document.getElementById(ids.cursor);
        if (!pointer) return;
        const transform = `translate(${x}px, ${y}px)`;
        if (pointer.style.transform === transform) return;
        pointer.style.transition = duration
          ? `transform ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1)`
          : "none";
        pointer.style.transform = transform;
        // Le pointeur reste en place d'une page à l'autre.
        session()?.setItem(ids.cursor, transform);
      };
      (window as unknown as Record<string, unknown>).__imafrikDemoGlide = place;
      const move = (event: MouseEvent) =>
        place(event.clientX, event.clientY, 0);
      /** Onde brève à l'endroit d'un clic. */
      const ripple = (event: MouseEvent) => {
        const ring = document.createElement("div");
        ring.className = ids.ripple;
        ring.setAttribute("aria-hidden", "true");
        Object.assign(ring.style, {
          position: "fixed",
          left: `${event.clientX - 22}px`,
          top: `${event.clientY - 22}px`,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "rgba(13, 148, 136, 0.28)",
          border: "2px solid rgba(13, 148, 136, 0.85)",
          pointerEvents: "none",
          zIndex: String(z + 2),
          transform: "scale(0.4)",
          opacity: "1",
          transition: "transform 420ms ease-out, opacity 420ms ease-out",
        });
        attach(ring);
        requestAnimationFrame(() => {
          ring.style.transform = "scale(1.25)";
          ring.style.opacity = "0";
        });
        window.setTimeout(() => ring.remove(), 480);
      };
      window.addEventListener("mousemove", move, true);
      window.addEventListener("mousedown", ripple, true);
      if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", mountCursor);
      else mountCursor();
    },
    { ids: IDS, z: Z_TOP, pendingCookie: PENDING_CARD_COOKIE },
  );
}

/**
 * Où placer un sous-titre.
 *
 * - `page` : centré en bas de l'écran ;
 * - `images` : en bas du volet d'images de l'écran de lecture, pour
 *   laisser lisible le compte-rendu, à droite.
 */
export type CaptionZone = "page" | "images";

/** Position horizontale de chaque zone de sous-titre. */
const CAPTION_ZONES: Record<
  CaptionZone,
  { left: string; width: string; maxWidth: string }
> = {
  page: { left: "50%", width: "max-content", maxWidth: "1080px" },
  // Le volet d'images occupe un peu plus de la moitié gauche (806 px sur
  // 1 440) : le sous-titre s'y centre, sans déborder sur le texte.
  images: { left: "28%", width: "max-content", maxWidth: "740px" },
};

/** Rythme de la vidéo, en millisecondes. */
export interface Tempo {
  /** Temps de lecture d'un sous-titre, par caractère. */
  perCharacter: number;
  /** Temps de lecture minimal d'un sous-titre. */
  minimum: number;
}

/**
 * Rythme par défaut : une lecture confortable pour un public qui
 * découvre, sans temps mort (environ 17 caractères par seconde, la norme
 * des sous-titres de télévision).
 */
export const DEFAULT_TEMPO: Tempo = { perCharacter: 50, minimum: 2300 };

/**
 * Une scène filmée : la page, et les gestes de mise en scène.
 */
export class Scene {
  /** Dernière position connue du pointeur. */
  private pointer: { x: number; y: number } | null = null;

  /**
   * Instant où le dernier carton de {@link gotoBehindCard} est apparu
   * sur la page chargée, en millisecondes depuis l'époque.
   */
  lastCardShownAt: number | null = null;

  /**
   * @param page    Page filmée.
   * @param baseURL Adresse du serveur de démonstration.
   * @param tempo   Rythme de lecture des sous-titres.
   */
  constructor(
    readonly page: Page,
    private readonly baseURL: string,
    private readonly tempo: Tempo = DEFAULT_TEMPO,
  ) {}

  /**
   * Temps de lecture du spectateur.
   *
   * @param ms Durée de la pause.
   */
  async pause(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Affiche un sous-titre en bas de l'écran, laisse le temps de le lire,
   * puis l'efface en fondu.
   *
   * Un sous-titre ne survit pas à son temps de lecture : un geste qui
   * change d'écran ne laisse jamais à l'image le texte de l'écran
   * précédent. `keep` le laisse affiché pour accompagner les gestes qui
   * suivent (défilement des coupes) ; le sous-titre suivant, ou
   * {@link clearCaption}, l'efface.
   *
   * @param text    Texte, court, en français.
   * @param options `hold` : durée de lecture, proportionnelle au texte par
   *                défaut ; `zone` : où le placer (voir {@link CaptionZone}) ;
   *                `keep` : ne pas l'effacer à la fin de la lecture.
   */
  async caption(
    text: string,
    options: { hold?: number; zone?: CaptionZone; keep?: boolean } = {},
  ): Promise<void> {
    checkTypography(text);
    const zone = CAPTION_ZONES[options.zone ?? "page"];
    await this.page.evaluate(
      ({ id, z, text, zone, fade }) => {
        let node = document.getElementById(id);
        if (!node) {
          node = document.createElement("div");
          node.id = id;
          node.setAttribute("aria-hidden", "true");
          Object.assign(node.style, {
            position: "fixed",
            bottom: "40px",
            padding: "14px 28px",
            borderRadius: "14px",
            background: "rgba(10, 18, 32, 0.94)",
            color: "#ffffff",
            font: "500 25px/1.4 Inter, system-ui, sans-serif",
            letterSpacing: "0.005em",
            textAlign: "center",
            // Lignes équilibrées : jamais un mot seul sur la seconde.
            textWrap: "balance",
            boxShadow: "0 10px 34px rgba(0, 0, 0, 0.32)",
            pointerEvents: "none",
            zIndex: String(z),
            opacity: "0",
            transform: "translate(-50%, 8px)",
            transition: `opacity ${fade}ms ease-out, transform ${fade}ms ease-out`,
          });
          document.documentElement.appendChild(node);
        }
        node.style.left = zone.left;
        node.style.width = zone.width;
        node.style.maxWidth = zone.maxWidth;
        node.textContent = text;
        // Lecture forcée du style : le fondu part bien de l'état masqué.
        void node.offsetWidth;
        node.style.opacity = "1";
        node.style.transform = "translate(-50%, 0)";
      },
      { id: IDS.caption, z: Z_TOP, text, zone, fade: FADE_MS },
    );
    await this.pause(
      options.hold ??
        Math.max(this.tempo.minimum, text.length * this.tempo.perCharacter),
    );
    if (!options.keep) await this.clearCaption();
  }

  /** Efface le sous-titre affiché, en fondu. */
  async clearCaption(): Promise<void> {
    const shown = await this.page.evaluate(
      ({ id, fade }) => {
        const node = document.getElementById(id);
        if (!node) return false;
        node.removeAttribute("id");
        node.style.opacity = "0";
        node.style.transform = "translate(-50%, 8px)";
        window.setTimeout(() => node.remove(), fade + 40);
        return true;
      },
      { id: IDS.caption, fade: FADE_MS },
    );
    if (shown) await this.pause(FADE_MS + 60);
  }

  /**
   * Carton plein écran, entre deux parties de la vidéo.
   *
   * @param title    Titre de la partie.
   * @param subtitle Ligne d'explication.
   * @param hold     Durée d'affichage.
   */
  async titleCard(title: string, subtitle: string, hold = 3200): Promise<void> {
    await this.showCard(title, subtitle);
    await this.pause(hold);
  }

  /**
   * Affiche un carton, en fondu.
   *
   * @param title    Titre de la partie.
   * @param subtitle Ligne d'explication.
   */
  async showCard(title: string, subtitle: string): Promise<void> {
    checkTypography(title);
    checkTypography(subtitle);
    await this.clearCaption();
    await this.page.evaluate(
      ({ title, subtitle, id, fade }) => {
        const card = (window as unknown as Record<string, unknown>)
          .__imafrikDemoCard as (title: string, subtitle: string) => void;
        card(title, subtitle);
        const node = document.getElementById(id);
        if (!node) return;
        node.style.opacity = "0";
        void node.offsetWidth;
        node.style.transition = `opacity ${fade * 2}ms ease-out`;
        node.style.opacity = "1";
      },
      { title, subtitle, id: IDS.card, fade: FADE_MS },
    );
    await this.pause(FADE_MS * 2);
  }

  /**
   * Change de page derrière un carton : le carton est monté avant le
   * premier rendu de la page suivante, puis retiré après `hold`.
   *
   * @param path     Adresse à ouvrir.
   * @param title    Titre du carton.
   * @param subtitle Ligne d'explication.
   * @param hold     Durée d'affichage, une fois la page chargée.
   */
  async gotoBehindCard(
    path: string,
    title: string,
    subtitle: string,
    hold = 3200,
  ): Promise<void> {
    checkTypography(title);
    checkTypography(subtitle);
    // Sur une page déjà ouverte, le carton couvre aussi le départ.
    const started = Date.now();
    if (this.page.url().startsWith(this.baseURL))
      await this.showCard(title, subtitle);
    await this.page.context().addCookies([
      {
        name: PENDING_CARD_COOKIE,
        value: encodeURIComponent(JSON.stringify({ title, subtitle })),
        url: this.baseURL,
      },
    ]);
    await this.page.goto(path);
    await this.page.waitForLoadState("networkidle");
    this.lastCardShownAt = Date.now();
    // Le temps de chargement compte dans le temps de lecture du carton.
    await this.pause(Math.max(800, hold - (Date.now() - started)));
    await this.hideCard();
  }

  /** Retire le carton affiché, avec un fondu. */
  async hideCard(): Promise<void> {
    await this.page.evaluate(
      ({ id, fade }) => {
        const card = document.getElementById(id);
        if (!card) return;
        card.style.transition = `opacity ${fade * 2}ms ease-in-out`;
        card.style.opacity = "0";
        window.setTimeout(() => card.remove(), fade * 2 + 40);
      },
      { id: IDS.card, fade: FADE_MS },
    );
    await this.pause(FADE_MS * 2 + 80);
  }

  /**
   * Amène le pointeur sur un élément, d'un mouvement continu.
   *
   * La flèche glisse d'abord seule (transition CSS, fluide quelle que
   * soit la charge de la machine), puis la souris de Playwright la
   * rejoint d'un coup : l'élément ne réagit au survol qu'à l'arrivée de
   * la flèche, comme sous une vraie main. La durée suit la distance : un
   * mouvement court reste vif, un long reste posé.
   *
   * @param target Élément visé.
   * @returns Le centre de l'élément, en coordonnées de la fenêtre.
   */
  async pointTo(target: Locator): Promise<{ x: number; y: number }> {
    // Un élément déjà entièrement à l'écran ne fait pas bouger la page :
    // `scrollIntoViewIfNeeded` défile parfois quand même (en-tête collant).
    const viewport = this.page.viewportSize();
    const before = await target.boundingBox();
    const visible =
      before !== null &&
      viewport !== null &&
      before.y >= 64 &&
      before.y + before.height <= viewport.height - 120;
    if (!visible) await target.scrollIntoViewIfNeeded();
    const box = visible ? before : await target.boundingBox();
    if (!box) throw new Error(`Élément invisible : ${target}`);
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const from = this.pointer ?? { x: 720, y: 450 };
    const distance = Math.hypot(point.x - from.x, point.y - from.y);
    const duration = Math.round(Math.min(750, Math.max(260, distance * 0.7)));
    await this.page.evaluate(
      ({ x, y, duration }) => {
        const glide = (window as unknown as Record<string, unknown>)
          .__imafrikDemoGlide as (x: number, y: number, ms: number) => void;
        glide(x, y, duration);
      },
      { ...point, duration },
    );
    await this.pause(duration);
    await this.page.mouse.move(point.x, point.y);
    this.pointer = point;
    await this.pause(260);
    return point;
  }

  /**
   * Clique sur un élément après y avoir amené le pointeur.
   *
   * @param target Élément visé.
   */
  async click(target: Locator): Promise<void> {
    await this.pointTo(target);
    await target.click();
  }

  /**
   * Montre un élément sans s'en servir : pointeur posé dessus, cadre
   * pointillé autour.
   *
   * C'est ainsi que la vidéo présente un geste indisponible en
   * démonstration (dépôt, signature, téléchargement) : on le désigne, le
   * sous-titre dit ce qu'il fait en service, et on ne clique pas.
   *
   * @param target Élément désigné.
   */
  async designate(target: Locator): Promise<void> {
    await this.pointTo(target);
    const box = await target.boundingBox();
    if (!box) return;
    await this.page.evaluate(
      ({ id, z, box, fade }) => {
        document.getElementById(id)?.remove();
        const ring = document.createElement("div");
        ring.id = id;
        ring.setAttribute("aria-hidden", "true");
        Object.assign(ring.style, {
          position: "fixed",
          left: `${box.x - 8}px`,
          top: `${box.y - 8}px`,
          width: `${box.width + 16}px`,
          height: `${box.height + 16}px`,
          border: "3px dashed #f59e0b",
          borderRadius: "12px",
          boxShadow: "0 0 0 6px rgba(245, 158, 11, 0.16)",
          pointerEvents: "none",
          zIndex: String(z),
          opacity: "0",
          transition: `opacity ${fade}ms ease-out`,
        });
        document.documentElement.appendChild(ring);
        void ring.offsetWidth;
        ring.style.opacity = "1";
      },
      { id: IDS.ring, z: Z_TOP, box, fade: FADE_MS },
    );
  }

  /** Retire le cadre posé par {@link designate}. */
  async clearDesignation(): Promise<void> {
    await this.page.evaluate((id) => {
      document.getElementById(id)?.remove();
    }, IDS.ring);
  }

  /**
   * Fait défiler la page sous le pointeur, en douceur.
   *
   * La molette agit sur la zone qui défile sous le pointeur, quelle
   * qu'elle soit (la page, ou le contenu principal de l'application).
   *
   * @param distance Distance totale, en pixels (négative pour remonter).
   * @param steps    Nombre de crans.
   */
  async scroll(distance: number, steps = 14): Promise<void> {
    for (let index = 0; index < steps; index += 1) {
      await this.page.mouse.wheel(0, distance / steps);
      await this.pause(40);
    }
    await this.pause(300);
  }
}
