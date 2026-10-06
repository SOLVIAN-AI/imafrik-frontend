import type { MetadataRoute } from "next";

/**
 * Manifeste web : l'application installable sur l'écran d'accueil.
 *
 * L'usage attendu est en grande partie mobile — un radiologue d'astreinte,
 * une clinique qui suit ses examens depuis un téléphone. Installée, l'application s'ouvre en plein écran,
 * sur sa propre icône, sans la barre d'adresse du navigateur.
 *
 * `start_url` mène à la connexion, qui redirige chacun vers son portail ;
 * les couleurs sont celles du thème sombre, pour que l'écran de
 * lancement ne flashe pas en blanc.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "IMAFRIK — Téléradiologie",
    short_name: "IMAFRIK",
    description:
      "Vos examens lus par des radiologues inscrits à l’Ordre, le compte-rendu signé le jour même.",
    lang: "fr",
    start_url: "/connexion",
    display: "standalone",
    background_color: "#04060d",
    theme_color: "#0b1124",
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
