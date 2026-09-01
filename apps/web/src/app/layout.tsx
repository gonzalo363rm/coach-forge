import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/auth/AppHeader";
import { BillingGraceBanner } from "@/components/billing/BillingGraceBanner";
import { AppProviders } from "@/components/providers/AppProviders";
import { getAppUrl } from "@/lib/app-url";
import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import "./globals.css";
import "@/styles/exercise-canvas-modals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: `${SITE_NAME} | Editor de ejercicios y clases`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  keywords: [
    "coach",
    "entrenamiento",
    "ejercicios",
    "clases",
    "deportes",
    "editor visual",
    "plantillas",
    "Coach Forge",
  ],
  openGraph: {
    type: "website",
    locale: "es",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Editor de ejercicios y clases`,
    description: DEFAULT_DESCRIPTION,
    url: getAppUrl(),
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} | Editor de ejercicios y clases`,
    description: DEFAULT_DESCRIPTION,
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
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-dvh flex-col antialiased`}
        suppressHydrationWarning
      >
        <AppProviders>
          <AppHeader />
          <BillingGraceBanner />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}

