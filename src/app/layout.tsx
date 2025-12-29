import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlayOne",
  description: "Juega UNO online o contra bots de forma gratuita y sin registros.",
  manifest: "/manifest.json",
  icons: [
    {
      url: "/vercel.svg",
      type: "image/svg+xml",
    }
  ]
};

export const viewport: Viewport = {
  themeColor: "#065f46",
  width: 'device-width',
	initialScale: 1,
	userScalable: false,
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
