"use server"

import { revalidatePath } from "next/cache"

import { getEffectiveEntitlements } from "@/lib/entitlements"
import {
    createCheckoutPreference,
    isMercadoPagoConfigured,
} from "@/lib/mercado-pago"
import { getPrisma } from "@/lib/prisma"
import { requireAuthenticatedUser } from "@/lib/resource-access"
import { checkoutPreferenceSchema } from "@/schemas/billing.schema"
import { isPlanOfferCheaperThanCurrentPlan } from "@/services/plans.service"
import { createPendingSubscription } from "@/services/subscriptions.service"

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function createCheckoutPreferenceAction(
    input: unknown,
): Promise<ActionResult<{ initPoint: string; preferenceId: string }>> {
    const authResult = await requireAuthenticatedUser()
    if (!authResult.ok) return authResult

    if (!isMercadoPagoConfigured()) {
        return {
            ok: false,
            error: "Mercado Pago no está configurado (MP_ACCESS_TOKEN).",
        }
    }

    const parsed = checkoutPreferenceSchema.safeParse(input)
    if (!parsed.success) {
        return { ok: false, error: "Oferta inválida" }
    }

    const entitlements = await getEffectiveEntitlements(authResult.user.id)
    if (!entitlements.subject?.canManageBilling) {
        return { ok: false, error: "No podés gestionar la suscripción de este plan" }
    }

    if (
        entitlements.catalogRole === "full" &&
        !entitlements.inGracePeriod &&
        entitlements.planId &&
        (await isPlanOfferCheaperThanCurrentPlan(
            entitlements.planId,
            parsed.data.planOfferId,
        ))
    ) {
        return {
            ok: false,
            error: "No podés cambiar a un plan inferior mientras tu suscripción está activa",
        }
    }

    const pending = await createPendingSubscription({
        userId: authResult.user.id,
        planOfferId: parsed.data.planOfferId,
        discountCode: parsed.data.discountCode,
    })
    if (!pending.ok) return pending

    try {
        const preference = await createCheckoutPreference({
            title: `${pending.data.planName} · ${pending.data.offerName}`,
            quantity: 1,
            unitPrice: pending.data.amount,
            currencyId: pending.data.currency,
            externalReference: pending.data.paymentId,
            payerEmail: authResult.user.email,
        })

        await getPrisma().payment.update({
            where: { id: pending.data.paymentId },
            data: { preferenceId: preference.id },
        })

        revalidatePath("/plans")
        return {
            ok: true,
            data: { initPoint: preference.initPoint, preferenceId: preference.id },
        }
    } catch (e) {
        console.error("[createCheckoutPreferenceAction]", e)
        await getPrisma().subscription.update({
            where: { id: pending.data.subscriptionId },
            data: { status: "cancelled" },
        })
        await getPrisma().payment.update({
            where: { id: pending.data.paymentId },
            data: { status: "failed" },
        })
        return {
            ok: false,
            error: e instanceof Error ? e.message : "No se pudo crear el checkout",
        }
    }
}
