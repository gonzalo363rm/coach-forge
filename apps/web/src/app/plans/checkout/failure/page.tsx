import type { Metadata } from "next"
import Link from "next/link"

import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Pago fallido",
    description: "No se pudo completar el pago.",
    noIndex: true,
})

export default function CheckoutFailurePage() {
    return (
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Pago no completado</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Podés intentar de nuevo desde la página de planes.
            </p>
            <Link
                href="/plans"
                className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
                Volver a planes
            </Link>
        </div>
    )
}
