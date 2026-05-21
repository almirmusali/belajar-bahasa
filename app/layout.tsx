import type { Metadata, Viewport } from "next";
import { SWRegister } from "@/components/sw-register";
import { InstallHint } from "@/components/install-hint";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://belajar-bahasa.vercel.app"),
  title: {
    default: "Belajar Bahasa — Индонезийский для русских",
    template: "%s · Belajar Bahasa",
  },
  description:
    "Курс из 16 уроков и словарь с карточками для изучения индонезийского языка (Bahasa Indonesia) с нуля.",
  applicationName: "Belajar Bahasa",
  appleWebApp: {
    capable: true,
    title: "Belajar",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icon-192.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#dc2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased">
        {children}
        <InstallHint />
        <SWRegister />
      </body>
    </html>
  );
}
