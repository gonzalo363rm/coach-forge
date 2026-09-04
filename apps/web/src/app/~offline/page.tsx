import type { Metadata } from "next";
import Link from "next/link";

import { SITE_NAME } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Sin conexión",
  description: `No hay conexión a internet. Reintentá cuando vuelvas a estar online.`,
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        {SITE_NAME}
      </p>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Sin conexión
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No se pudo cargar esta página. Revisá tu red y volvé a intentarlo.
      </p>
      <Link
        href="/"
        className="mt-2 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
      >
        Ir al inicio
      </Link>
    </main>
  );
}
