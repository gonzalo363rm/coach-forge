import { NextResponse } from "next/server"

import {
    processMercadoPagoMerchantOrderNotification,
    processMercadoPagoPaymentNotification,
} from "@/services/mercado-pago-sync.service"

export const runtime = "nodejs"

export async function POST(request: Request) {
    try {
        const url = new URL(request.url)
        let topic = url.searchParams.get("topic") || url.searchParams.get("type")
        let id = url.searchParams.get("id") || url.searchParams.get("data.id")

        const contentType = request.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
            const body = (await request.json().catch(() => null)) as {
                type?: string
                action?: string
                data?: { id?: string }
            } | null
            if (body?.type) topic = body.type
            if (body?.data?.id) id = String(body.data.id)
        }

        if (!id) {
            return NextResponse.json({ received: true })
        }

        if (topic === "payment" || topic === "payment.updated") {
            const result = await processMercadoPagoPaymentNotification(id)
            if (!result.ok) {
                console.error("[mp-webhook]", topic, id, result.error)
            }
        } else if (topic === "merchant_order" || topic === "merchant_orders") {
            const result = await processMercadoPagoMerchantOrderNotification(id)
            if (!result.ok) {
                console.error("[mp-webhook]", topic, id, result.error)
            }
        } else {
            console.info("[mp-webhook] topic ignorado", topic, id)
        }

        // MP espera 200 rápido; errores de negocio se loguean.
        return NextResponse.json({ received: true })
    } catch (e) {
        console.error("[mp-webhook]", e)
        return NextResponse.json({ received: true })
    }
}

export async function GET(request: Request) {
    // Algunos entornos prueban el endpoint con GET.
    return POST(request)
}
