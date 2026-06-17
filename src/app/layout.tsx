import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yoremio.com";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Yöremio | Yerel üretici pazarı",
    template: "%s | Yöremio",
  },
  description:
    "Yöremio, yerel üretici ve satıcıları alıcılarla buluşturan güven odaklı pazar yeri deneyimidir.",
  keywords: [
    "Yöremio",
    "yerel üretici",
    "organik ürün",
    "köy ürünleri",
    "üreticiden al",
    "yerel pazar",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Yöremio | Yerel üretici pazarı",
    description:
      "Güven skoru, talep, teklif ve canlı chat ile premium yerel pazar deneyimi.",
    url: "/",
    siteName: "Yöremio",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/yoremio-og.svg",
        width: 1200,
        height: 630,
        alt: "Yöremio yerel üretici pazarı",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yöremio | Yerel üretici pazarı",
    description:
      "Yerel üreticiden doğrudan ürün keşfi, talep, teklif ve chat akışları.",
    images: ["/yoremio-og.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`h-full scroll-smooth ${manrope.variable} ${fraunces.variable}`}>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
