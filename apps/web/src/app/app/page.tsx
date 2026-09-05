import type { Metadata } from "next"

import { InstallAppGuide } from "@/components/pwa/InstallAppGuide"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Instalar app",
    description:
        "Cómo instalar Coach Forge en el celular: instrucciones para iPhone (Safari) y Android (Chrome).",
    path: "/app",
})

export default function InstallAppPage() {
    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 sm:p-8">
                <header className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        App móvil
                    </p>
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                        Instalar Coach Forge
                    </h1>
                    <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
                        Agregala a la pantalla de inicio del celular para abrirla como una app,
                        con acceso más rápido y mejor experiencia en cancha.
                    </p>
                </header>

                <InstallAppGuide />
            </main>
        </div>
    )
}
