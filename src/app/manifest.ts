import type { MetadataRoute } from "next";

/** Matches Gastly's vite-plugin-pwa manifest shape (any + maskable icons). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Moai's Crafts",
    short_name: "Moai's Crafts",
    description: "Catálogo de diseños laser cut — Moai's Crafts",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f1214",
    theme_color: "#0f1214",
    lang: "es-MX",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
