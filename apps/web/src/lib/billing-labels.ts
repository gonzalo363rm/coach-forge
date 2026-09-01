import type {
    CatalogStatus,
    PaymentMethod,
    PaymentStatus,
    PlanCatalogRole,
    PlanType,
    SubscriptionStatus,
} from "@prisma/client"

export function permissionAppliesToPlanType(
    appliesToPlanType: PlanType | null,
    planType: PlanType,
): boolean {
    return appliesToPlanType == null || appliesToPlanType === planType
}

export function formatPlanType(type: PlanType): string {
    return type === "club" ? "Club" : "Individual"
}

export function formatCatalogStatus(status: CatalogStatus): string {
    return status === "active" ? "Activo" : "Inactivo"
}

export function formatPlanCatalogRole(role: PlanCatalogRole): string | null {
    if (role === "free") return "Free"
    if (role === "full") return "Full"
    return null
}

export function formatDuration(value: number, unit: "month" | "year"): string {
    if (unit === "year") return value === 1 ? "1 año" : `${value} años`
    return value === 1 ? "1 mes" : `${value} meses`
}

/** Etiqueta de período para pricing (tabs y cards). */
export function formatBillingPeriodLabel(value: number, unit: "month" | "year"): string {
    if (unit === "month" && value === 1) return "Mensual"
    if (unit === "month" && value === 3) return "Trimestral"
    if (unit === "year" && value === 1) return "Anual"
    return formatDuration(value, unit)
}

export function durationToMonths(value: number, unit: "month" | "year"): number {
    return unit === "year" ? value * 12 : value
}

export function formatPlanFeature(
    permission: {
        name: string
        valueKind: "flag" | "limit"
        value: number | null
    },
): string {
    if (permission.valueKind === "flag") return permission.name
    if (permission.value == null) return `${permission.name}: ilimitado`
    return `${permission.name}: ${permission.value}`
}

export function toDateInputValue(date: Date | null | undefined): string {
    if (!date) return ""
    const local = new Date(date)
    const year = local.getFullYear()
    const month = String(local.getMonth() + 1).padStart(2, "0")
    const day = String(local.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

export function formatPaymentStatus(status: PaymentStatus): string {
    switch (status) {
        case "pending":
            return "Pendiente"
        case "completed":
            return "Completado"
        case "failed":
            return "Fallido"
        case "cancelled":
            return "Cancelado"
    }
}

export function formatSubscriptionStatus(status: SubscriptionStatus): string {
    switch (status) {
        case "pending":
            return "Pendiente"
        case "active":
            return "Activa"
        case "expired":
            return "Vencida"
        case "cancelled":
            return "Cancelada"
    }
}

export function formatPaymentMethod(method: PaymentMethod | null | undefined): string {
    if (!method) return "—"
    switch (method) {
        case "credit_card":
            return "Tarjeta de crédito"
        case "debit_card":
            return "Tarjeta de débito"
        case "account_money":
            return "Dinero en cuenta"
        case "ticket":
            return "Efectivo / Rapipago"
        case "bank_transfer":
            return "Transferencia"
        case "other":
            return "Otro"
    }
}

export function formatBillingDateTime(date: Date | string | null | undefined): string {
    if (!date) return "—"
    return new Intl.DateTimeFormat("es-AR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(date))
}
