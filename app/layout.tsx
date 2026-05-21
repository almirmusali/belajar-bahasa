import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Belajar Bahasa — Учим индонезийский",
  description: "Платформа для изучения индонезийского языка (Bahasa Indonesia)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
