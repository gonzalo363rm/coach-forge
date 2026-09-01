import type { Metadata } from "next"
import Link from "next/link"

import { isMercadoPagoConfigured } from "@/lib/mercado-pago"
import { createPageMetadata } from "@/lib/seo"
import { processMercadoPagoPaymentNotification } from "@/services/mercado-pago-sync.service"

export const metadata: Metadata = createPageMetadata({
    title: "Pago exitoso",
    description: "Tu suscripción se está activando.",
    noIndex: true,
})

function firstQueryValue(value: string | string[] | undefined): string {
    if (value === undefined) return ""
    return Array.isArray(value) ? (value[0] ?? "") : value
}

interface Props {
    searchParams: Promise<{
        payment_id?: string | string[]
        collection_id?: string | string[]
        status?: string | string[]
        collection_status?: string | string[]
        external_reference?: string | string[]
    }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
    const params = await searchParams
    const paymentId =
        firstQueryValue(params.payment_id) || firstQueryValue(params.collection_id)
    const status =
        firstQueryValue(params.status) || firstQueryValue(params.collection_status)

    let syncMessage =
        "Cuando Mercado Pago confirme el pago, tu suscripción quedará activa automáticamente."
    let activated = false

    if (paymentId && paymentId !== "null" && isMercadoPagoConfigured()) {
        try {
            const result = await processMercadoPagoPaymentNotification(paymentId)
            if (result.ok && (result.activated || result.already)) {
                activated = true
                syncMessage = "Tu suscripción ya está activa."
            } else if (!result.ok) {
                console.error("[checkout-success]", result.error)
                syncMessage =
                    "Recibimos el retorno de Mercado Pago, pero todavía no pudimos activar la suscripción. Si en unos minutos no aparece, revisá Mis pagos."
            } else {
                syncMessage =
                    status === "approved"
                        ? "El pago está aprobado; la activación puede demorar unos segundos. Revisá Mis pagos."
                        : syncMessage
            }
        } catch (error) {
            console.error("[checkout-success]", error)
            syncMessage =
                "Recibimos el retorno de Mercado Pago. Si el plan no se activa solo, revisá Mis pagos en unos minutos."
        }
    }

    return (
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">
                {activated ? "Suscripción activa" : "Pago recibido"}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{syncMessage}</p>
            <div className="flex flex-wrap gap-4">
                <Link
                    href="/plans"
                    className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                    Ver planes
                </Link>
                <Link
                    href="/payments/mine"
                    className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                    Mis pagos
                </Link>
            </div>
        </div>
    )
}
