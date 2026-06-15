import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/auth/AppHeader";
import { AppProviders } from "@/components/providers/AppProviders";
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
  title: "Coach Forge - Editor de Gráficos",
  description: "Editor de gráficos 2D dinámicos",
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
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}

