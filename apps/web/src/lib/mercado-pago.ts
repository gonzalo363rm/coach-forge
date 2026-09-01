import { getAppUrl } from "@/lib/app-url"

type CreatePreferenceInput = {
    title: string
    quantity: number
    unitPrice: number
    currencyId: string
    externalReference: string
    payerEmail?: string | null
}

type PreferenceResult = {
    id: string
    initPoint: string
    sandboxInitPoint: string | null
}

function getAccessToken(): string {
    const token = process.env.MP_ACCESS_TOKEN?.trim()
    if (!token) {
        throw new Error("MP_ACCESS_TOKEN no está configurado")
    }
    return token
}

export function isMercadoPagoConfigured(): boolean {
    return Boolean(process.env.MP_ACCESS_TOKEN?.trim())
}

/** MP no acepta localhost en back_urls con auto_return (invalid_auto_return). */
function isMercadoPagoPublicAppUrl(url: string): boolean {
    try {
        const { hostname, protocol } = new URL(url)
        const host = hostname.toLowerCase()
        if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0") {
            return false
        }
        if (
            /^10\./.test(host) ||
            /^192\.168\./.test(host) ||
            /^172\.(1[6-9]|2\d|3[01])\./.test(host)
        ) {
            return false
        }
        return protocol === "https:" || protocol === "http:"
    } catch {
        return false
    }
}

function mercadoPagoAppUrl(): string {
    const override = process.env.MP_PUBLIC_APP_URL?.trim()
    if (override) return override.replace(/\/$/, "")
    return getAppUrl()
}

export async function createCheckoutPreference(
    input: CreatePreferenceInput,
): Promise<PreferenceResult> {
    const appUrl = mercadoPagoAppUrl()
    const backUrls = {
        success: `${appUrl}/plans/checkout/success`,
        failure: `${appUrl}/plans/checkout/failure`,
        pending: `${appUrl}/plans/checkout/pending`,
    }
    const canAutoReturn = isMercadoPagoPublicAppUrl(appUrl)
    const accessToken = getAccessToken()
    const isTestToken = accessToken.startsWith("TEST-")

    const body = {
        items: [
            {
                title: input.title.slice(0, 256),
                quantity: input.quantity,
                unit_price: input.unitPrice,
                currency_id: input.currencyId,
            },
        ],
        external_reference: input.externalReference,
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        back_urls: backUrls,
        ...(canAutoReturn ? { auto_return: "approved" as const } : {}),
        ...(input.payerEmail
            ? { payer: { email: input.payerEmail } }
            : {}),
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
        const text = await response.text()
        console.error("[createCheckoutPreference]", response.status, text, { appUrl, canAutoReturn })
        throw new Error("Mercado Pago rechazó la preferencia")
    }

    const data = (await response.json()) as {
        id: string
        init_point?: string
        sandbox_init_point?: string
    }

    const initPoint = isTestToken
        ? data.sandbox_init_point || data.init_point
        : data.init_point || data.sandbox_init_point
    if (!data.id || !initPoint) {
        throw new Error("Respuesta inválida de Mercado Pago")
    }

    return {
        id: data.id,
        initPoint,
        sandboxInitPoint: data.sandbox_init_point ?? null,
    }
}

export async function fetchMercadoPagoPayment(paymentId: string): Promise<{
    id: string
    status: string
    statusDetail: string | null
    externalReference: string | null
    merchantOrderId: string | null
    paymentMethodId: string | null
    paymentTypeId: string | null
    raw: unknown
}> {
    const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
        {
            headers: {
                Authorization: `Bearer ${getAccessToken()}`,
            },
            cache: "no-store",
        },
    )

    if (!response.ok) {
        const text = await response.text()
        console.error("[fetchMercadoPagoPayment]", response.status, text)
        throw new Error("No se pudo consultar el pago en Mercado Pago")
    }

    const data = (await response.json()) as {
        id: number | string
        status: string
        status_detail?: string
        external_reference?: string
        order?: { id?: number | string }
        payment_method_id?: string
        payment_type_id?: string
    }

    return {
        id: String(data.id),
        status: data.status,
        statusDetail: data.status_detail ?? null,
        externalReference: data.external_reference ?? null,
        merchantOrderId: data.order?.id != null ? String(data.order.id) : null,
        paymentMethodId: data.payment_method_id ?? null,
        paymentTypeId: data.payment_type_id ?? null,
        raw: data,
    }
}

export async function fetchMercadoPagoMerchantOrder(orderId: string): Promise<{
    id: string
    externalReference: string | null
    paymentIds: string[]
}> {
    const response = await fetch(
        `https://api.mercadopago.com/merchant_orders/${encodeURIComponent(orderId)}`,
        {
            headers: {
                Authorization: `Bearer ${getAccessToken()}`,
            },
            cache: "no-store",
        },
    )

    if (!response.ok) {
        const text = await response.text()
        console.error("[fetchMercadoPagoMerchantOrder]", response.status, text)
        throw new Error("No se pudo consultar la orden en Mercado Pago")
    }

    const data = (await response.json()) as {
        id?: number | string
        external_reference?: string
        payments?: Array<{ id?: number | string }>
    }

    const paymentIds = (data.payments ?? [])
        .map((payment) => (payment.id != null ? String(payment.id) : null))
        .filter((id): id is string => Boolean(id))

    return {
        id: String(data.id ?? orderId),
        externalReference: data.external_reference ?? null,
        paymentIds,
    }
}

export function mapMercadoPagoPaymentMethod(
    paymentTypeId: string | null,
):
    | "credit_card"
    | "debit_card"
    | "account_money"
    | "ticket"
    | "bank_transfer"
    | "other"
    | null {
    switch (paymentTypeId) {
        case "credit_card":
            return "credit_card"
        case "debit_card":
            return "debit_card"
        case "account_money":
            return "account_money"
        case "ticket":
            return "ticket"
        case "bank_transfer":
            return "bank_transfer"
        default:
            return paymentTypeId ? "other" : null
    }
}
