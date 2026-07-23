import type { Metadata, Viewport } from "next";
import { Outfit, Sora } from "next/font/google";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moai's Crafts",
  description: "Catálogo de diseños laser cut — Moai's Crafts",
  applicationName: "Moai's Crafts",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Moai's Crafts",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1214",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      className={`${outfit.variable} ${sora.variable} h-full antialiased`}
    >
      <head>
        {/* iOS still honors the apple-prefixed tag for standalone home-screen apps. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full">
        {children}
        <InstallAppPrompt />
      </body>
    </html>
  );
}
