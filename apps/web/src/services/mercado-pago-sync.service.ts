import {
    fetchMercadoPagoMerchantOrder,
    fetchMercadoPagoPayment,
    mapMercadoPagoPaymentMethod,
} from "@/lib/mercado-pago"
import { getPrisma } from "@/lib/prisma"
import { activateSubscriptionAfterPayment } from "@/services/subscriptions.service"

export type MpSyncResult =
    | { ok: true; already?: boolean; activated?: boolean }
    | { ok: false; error: string }

export async function processMercadoPagoPaymentNotification(
    mpPaymentId: string,
): Promise<MpSyncResult> {
    const mpPayment = await fetchMercadoPagoPayment(mpPaymentId)
    if (!mpPayment.externalReference) {
        return { ok: false, error: "Sin external_reference" }
    }

    const payment = await getPrisma().payment.findUnique({
        where: { id: mpPayment.externalReference },
    })
    if (!payment) {
        return { ok: false, error: "Payment local no encontrado" }
    }

    if (payment.status === "completed") {
        return { ok: true, already: true }
    }

    if (mpPayment.status === "approved") {
        const result = await activateSubscriptionAfterPayment({
            subscriptionId: payment.subscriptionId,
            paymentId: payment.id,
            externalId: mpPayment.id,
            merchantOrderId: mpPayment.merchantOrderId,
            providerStatus: mpPayment.status,
            providerPayload: mpPayment.raw,
            paymentMethod: mapMercadoPagoPaymentMethod(mpPayment.paymentTypeId),
        })
        return result.ok
            ? { ok: true, activated: true }
            : { ok: false, error: result.error }
    }

    if (
        mpPayment.status === "cancelled" ||
        mpPayment.status === "rejected" ||
        mpPayment.status === "refunded"
    ) {
        await getPrisma().payment.update({
            where: { id: payment.id },
            data: {
                status: mpPayment.status === "cancelled" ? "cancelled" : "failed",
                externalId: mpPayment.id,
                providerStatus: mpPayment.status,
                providerPayload: mpPayment.raw as object,
            },
        })
        await getPrisma().subscription.update({
            where: { id: payment.subscriptionId },
            data: { status: "cancelled" },
        })
    }

    return { ok: true }
}

export async function processMercadoPagoMerchantOrderNotification(
    merchantOrderId: string,
): Promise<MpSyncResult> {
    const order = await fetchMercadoPagoMerchantOrder(merchantOrderId)
    if (order.paymentIds.length === 0) {
        return { ok: true }
    }

    let lastError: string | null = null
    let activated = false
    let already = false

    for (const paymentId of order.paymentIds) {
        const result = await processMercadoPagoPaymentNotification(paymentId)
        if (!result.ok) {
            lastError = result.error
            continue
        }
        if (result.activated) activated = true
        if (result.already) already = true
    }

    if (lastError && !activated && !already) {
        return { ok: false, error: lastError }
    }

    return { ok: true, activated, already }
}
