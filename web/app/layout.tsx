import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { Toaster } from "@/components/ui/sonner";
import { SessionSync } from "@/components/auth/session-sync";
import { SiteMetadataSync } from "@/components/layout/site-metadata-sync";
import { COMMON_OPEN_GRAPH, DEFAULT_OPEN_GRAPH_IMAGE, SEO_SITE_NAME } from "@/lib/seo/metadata";

import "./globals.css";

const notoSans = localFont({
  src: "../public/fonts/noto-sans-kr-app-subset.woff2",
  weight: "100 900",
  display: "swap",
  preload: true,
  variable: "--font-body-runtime",
});

const maruBuri = localFont({
  src: "../public/fonts/maruburi-light-subset.woff2",
  display: "swap",
  preload: true,
  variable: "--font-display-runtime",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SEO_SITE_NAME} — 디지털 악보 마켓`,
    template: `%s | ${SEO_SITE_NAME}`,
  },
  description: "악기별 디지털 악보를 한 곡부터 가볍게 찾고 받아보세요.",
  openGraph: {
    ...COMMON_OPEN_GRAPH,
    title: `${SEO_SITE_NAME} — 디지털 악보 마켓`,
    description: "검색부터 보관함까지 이어지는 디지털 악보 마켓이에요.",
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "rgb(194 65 12)",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${notoSans.variable} ${maruBuri.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className={`${notoSans.className} min-h-screen bg-canvas text-ink-900 antialiased`}>
        <SessionSync />
        <SiteMetadataSync />
        <a className="skip-link" href="#main">
          본문 바로가기
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
