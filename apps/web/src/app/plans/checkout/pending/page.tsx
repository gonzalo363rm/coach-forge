import type { Metadata } from "next"
import Link from "next/link"

import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Pago pendiente",
    description: "Tu pago está pendiente de confirmación.",
    noIndex: true,
})

export default function CheckoutPendingPage() {
    return (
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Pago pendiente</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Cuando se acredite, activaremos tu suscripción.
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
