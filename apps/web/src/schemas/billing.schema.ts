import { z } from "zod"

export const catalogStatusSchema = z.enum(["active", "inactive"])
export const planTypeSchema = z.enum(["individual", "club"])
export const planCatalogRoleSchema = z.enum(["none", "free", "full"])
export const durationUnitSchema = z.enum(["month", "year"])
export const discountTypeSchema = z.enum(["percentage", "fixed"])

export const moneyAmountSchema = z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Ingresá un monto válido con hasta 2 decimales")
    .refine((value) => Number(value) >= 0, "El monto no puede ser negativo")

const optionalDateInput = z.preprocess((value) => {
    if (value == null || value === "") return null
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
    if (typeof value === "string") {
        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? null : date
    }
    return null
}, z.date().nullable())

const optionalMaxUses = z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return null
    const parsed = typeof value === "number" ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : value
}, z.number().int().min(1).nullable())

export function discountCodeFromName(name: string): string {
    return name.trim().toUpperCase().replace(/\s+/g, "").slice(0, 40)
}

function resolveDiscountCode(code: unknown, name: string): string {
    const fromInput =
        code == null ? "" : String(code).trim().toUpperCase().replace(/\s+/g, "")
    if (fromInput.length > 0) return fromInput.slice(0, 40)
    return discountCodeFromName(name)
}

export const planPermissionInputSchema = z.object({
    permissionId: z.string().min(1),
    value: z.number().int().min(0).nullable(),
})

export type PlanPermissionInput = z.infer<typeof planPermissionInputSchema>

export const planCreateSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    type: planTypeSchema,
    catalogRole: planCatalogRoleSchema.default("none"),
    status: catalogStatusSchema.default("active"),
    permissions: z.array(planPermissionInputSchema).default([]),
})

export type PlanCreateInput = z.infer<typeof planCreateSchema>

export const planUpdateSchema = planCreateSchema.extend({
    id: z.string().min(1, "id obligatorio"),
})

export type PlanUpdateInput = z.infer<typeof planUpdateSchema>

export const planStatusUpdateSchema = z.object({
    id: z.string().min(1, "id obligatorio"),
    status: catalogStatusSchema,
})

export type PlanStatusUpdateInput = z.infer<typeof planStatusUpdateSchema>

export const planListSortBySchema = z.enum(["name", "type", "status", "createdAt"])

export type PlanListSortBy = z.infer<typeof planListSortBySchema>

export const getPlansPaginatedParamsSchema = z.object({
    page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
    take: z.coerce.number().int().min(1).max(100).default(10).catch(10),
    filters: z
        .object({
            search: z.string().trim().max(120).nullable().optional(),
            type: planTypeSchema.nullable().optional(),
            status: catalogStatusSchema.nullable().optional(),
        })
        .optional(),
    sortBy: planListSortBySchema.default("name").catch("name"),
    sortDir: z.enum(["asc", "desc"]).default("asc").catch("asc"),
})

export const planOfferCreateSchema = z
    .object({
        planId: z.string().min(1),
        name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
        durationValue: z.coerce.number().int().min(1, "La duración debe ser al menos 1"),
        durationUnit: durationUnitSchema,
        price: moneyAmountSchema,
        currency: z.string().trim().min(1).max(8).default("ARS"),
        validFrom: optionalDateInput,
        validUntil: optionalDateInput,
        status: catalogStatusSchema.default("active"),
        discountIds: z.array(z.string().min(1)).default([]),
    })
    .refine(
        (data) =>
            !data.validFrom ||
            !data.validUntil ||
            data.validFrom.getTime() <= data.validUntil.getTime(),
        { message: "La vigencia hasta no puede ser anterior al desde", path: ["validUntil"] },
    )

export type PlanOfferCreateInput = z.infer<typeof planOfferCreateSchema>

export const planOfferUpdateSchema = planOfferCreateSchema.extend({
    id: z.string().min(1, "id obligatorio"),
})

export type PlanOfferUpdateInput = z.infer<typeof planOfferUpdateSchema>

export const planOfferStatusUpdateSchema = z.object({
    id: z.string().min(1),
    status: catalogStatusSchema,
})

export const discountCreateSchema = z
    .object({
        name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
        type: discountTypeSchema,
        value: moneyAmountSchema,
        code: z.union([z.string(), z.null()]).optional(),
        validFrom: optionalDateInput,
        validUntil: optionalDateInput,
        maxUses: optionalMaxUses,
        status: catalogStatusSchema.default("active"),
    })
    .refine(
        (data) => data.type !== "percentage" || Number(data.value) <= 100,
        { message: "El porcentaje no puede superar 100", path: ["value"] },
    )
    .refine(
        (data) =>
            !data.validFrom ||
            !data.validUntil ||
            data.validFrom.getTime() <= data.validUntil.getTime(),
        { message: "La vigencia hasta no puede ser anterior al desde", path: ["validUntil"] },
    )
    .transform((data) => ({
        ...data,
        code: resolveDiscountCode(data.code, data.name),
    }))
    .refine((data) => data.code.length > 0, {
        message: "No se pudo generar un código a partir del nombre",
        path: ["code"],
    })

export type DiscountCreateInput = z.infer<typeof discountCreateSchema>

export const discountUpdateSchema = z
    .object({
        id: z.string().min(1, "id obligatorio"),
        name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
        type: discountTypeSchema,
        value: moneyAmountSchema,
        code: z.union([z.string(), z.null()]).optional(),
        validFrom: optionalDateInput,
        validUntil: optionalDateInput,
        maxUses: optionalMaxUses,
        status: catalogStatusSchema.default("active"),
    })
    .refine(
        (data) => data.type !== "percentage" || Number(data.value) <= 100,
        { message: "El porcentaje no puede superar 100", path: ["value"] },
    )
    .refine(
        (data) =>
            !data.validFrom ||
            !data.validUntil ||
            data.validFrom.getTime() <= data.validUntil.getTime(),
        { message: "La vigencia hasta no puede ser anterior al desde", path: ["validUntil"] },
    )
    .transform((data) => ({
        ...data,
        code: resolveDiscountCode(data.code, data.name),
    }))
    .refine((data) => data.code.length > 0, {
        message: "No se pudo generar un código a partir del nombre",
        path: ["code"],
    })

export type DiscountUpdateInput = z.infer<typeof discountUpdateSchema>

export const discountStatusUpdateSchema = z.object({
    id: z.string().min(1),
    status: catalogStatusSchema,
})

export const discountListSortBySchema = z.enum(["name", "type", "status", "createdAt"])

export type DiscountListSortBy = z.infer<typeof discountListSortBySchema>

export const getDiscountsPaginatedParamsSchema = z.object({
    page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
    take: z.coerce.number().int().min(1).max(100).default(10).catch(10),
    filters: z
        .object({
            search: z.string().trim().max(120).nullable().optional(),
            status: catalogStatusSchema.nullable().optional(),
        })
        .optional(),
    sortBy: discountListSortBySchema.default("name").catch("name"),
    sortDir: z.enum(["asc", "desc"]).default("asc").catch("asc"),
})

export const previewOfferPriceSchema = z.object({
    planOfferId: z.string().min(1),
    discountId: z.string().min(1).optional().or(z.literal("")),
    code: z.string().trim().max(40).optional().or(z.literal("")),
})

export type PreviewOfferPriceInput = z.infer<typeof previewOfferPriceSchema>

export const clubMemberAccessUpdateSchema = z.object({
    memberId: z.string().min(1),
    clubAccessEnabled: z.boolean(),
})

export type ClubMemberAccessUpdateInput = z.infer<typeof clubMemberAccessUpdateSchema>

export const checkoutPreferenceSchema = z.object({
    planOfferId: z.string().min(1),
    discountCode: z.string().trim().max(40).optional().or(z.literal("")),
})

export type CheckoutPreferenceInput = z.infer<typeof checkoutPreferenceSchema>

export const assignUserPlanSchema = z.object({
    userId: z.string().min(1, "Usuario obligatorio"),
    planId: z.string().min(1, "Plan obligatorio"),
    /** YYYY-MM-DD; obligatorio salvo plan Free (se ignora). */
    endDate: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
        .optional()
        .or(z.literal("")),
})

export type AssignUserPlanInput = z.infer<typeof assignUserPlanSchema>

export const paymentStatusFilterSchema = z.enum([
    "pending",
    "completed",
    "failed",
    "cancelled",
])

export type PaymentStatusFilter = z.infer<typeof paymentStatusFilterSchema>

export const paymentListSortBySchema = z.enum(["createdAt", "paidAt", "amount", "status"])

export type PaymentListSortBy = z.infer<typeof paymentListSortBySchema>

export const getPaymentsPaginatedParamsSchema = z.object({
    page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
    take: z.coerce.number().int().min(1).max(100).default(10).catch(10),
    filters: z
        .object({
            search: z.string().trim().max(200).optional(),
            status: paymentStatusFilterSchema.optional(),
        })
        .optional(),
    sortBy: paymentListSortBySchema.default("createdAt").catch("createdAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc").catch("desc"),
})

export type GetPaymentsPaginatedParams = z.infer<typeof getPaymentsPaginatedParamsSchema>
