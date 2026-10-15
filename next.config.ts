import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Une page déjà vue, ou préchargée depuis la navigation, s'affiche
    // aussitôt si on l'ouvre dans les 30 secondes : mesuré le 15 octobre
    // 2026, 3 à 8 ms au lieu de 300 à 600. Les deux durées sont alignées :
    // une page préchargée (« static », 5 minutes par défaut) ne doit pas
    // vieillir plus qu'une page visitée. Un geste (prise en charge,
    // signature) revalide les pages qu'il touche, et la file se rafraîchit
    // de toute façon toutes les 30 secondes.
    staleTimes: { dynamic: 30, static: 30 },
  },
};

export default nextConfig;
