import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moai's Catalog",
    short_name: "MoaiCatalog",
    description: "Catálogo de diseños laser cut — Moai's Crafts",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1214",
    theme_color: "#0f1214",
    lang: "es",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
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
