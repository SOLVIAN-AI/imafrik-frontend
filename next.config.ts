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
    // Le logo d'une clinique (2 Mo au plus) part en base64 dans une action
    // serveur : 2,7 Mo, au-delà du mégaoctet par défaut. Vercel plafonne
    // de toute façon le corps d'une requête à 4,5 Mo.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
