import { z } from "zod"

import { contentVisibilitySchemaValues } from "@/lib/content-visibility"
import { passwordSchema } from "@/schemas/auth.schema"

export const clubUpdateSchema = z.object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
    address: z
        .union([z.string().trim().max(300), z.literal(""), z.null()])
        .optional(),
    logoUrl: z.union([z.string().trim().url().max(2000), z.literal(""), z.null()]).optional(),
})

export type ClubUpdateInput = z.infer<typeof clubUpdateSchema>

const clubMemberBaseSchema = z.object({
    firstName: z.string().trim().min(1, "El nombre es obligatorio").max(80),
    lastName: z.string().trim().min(1, "El apellido es obligatorio").max(80),
    email: z.email({ error: "Introduce un email válido" }),
    phoneNumber: z.string().trim().max(30).optional(),
    emailVerified: z.boolean(),
})

export const clubMemberCreateSchema = clubMemberBaseSchema
    .extend({
        password: passwordSchema,
        confirmPassword: z.string({ error: "Confirma la contraseña" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    })

export type ClubMemberCreateInput = z.infer<typeof clubMemberCreateSchema>

export const clubMemberUpdateSchema = clubMemberBaseSchema
    .extend({
        id: z.string().min(1),
        password: z.union([z.literal(""), passwordSchema]).optional(),
        confirmPassword: z.string().optional(),
    })
    .refine(
        (data) => {
            const wantsPasswordChange = Boolean(data.password && data.password.length > 0)
            if (!wantsPasswordChange) return true
            return Boolean(data.confirmPassword)
        },
        { message: "Confirma la contraseña", path: ["confirmPassword"] },
    )
    .refine(
        (data) => {
            const wantsPasswordChange = Boolean(data.password && data.password.length > 0)
            if (!wantsPasswordChange) return true
            return data.password === data.confirmPassword
        },
        { message: "Las contraseñas no coinciden", path: ["confirmPassword"] },
    )

export type ClubMemberUpdateInput = z.infer<typeof clubMemberUpdateSchema>

export const clubAdminUpdateSchema = clubUpdateSchema.extend({
    id: z.string().min(1, "id obligatorio"),
    maxMembers: z
        .number({ error: "El cupo es obligatorio" })
        .int("El cupo debe ser un entero")
        .min(1, "Mínimo 1 coach")
        .max(1000, "Máximo 1000 coaches"),
})

export type ClubAdminUpdateInput = z.infer<typeof clubAdminUpdateSchema>

export const clubListSortBySchema = z.enum([
    "name",
    "maxMembers",
    "createdAt",
    "updatedAt",
])

export type ClubListSortBy = z.infer<typeof clubListSortBySchema>

export const clubListFiltersSchema = z.object({
    search: z.string().optional().nullable(),
})

export type ClubListFilters = z.infer<typeof clubListFiltersSchema>

export const getClubsPaginatedParamsSchema = z.object({
    page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
    take: z.coerce.number().int().min(1).max(100).default(10).catch(10),
    filters: clubListFiltersSchema.optional(),
    sortBy: clubListSortBySchema.default("updatedAt").catch("updatedAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc").catch("desc"),
})

export const clubMemberListSortBySchema = z.enum([
    "firstName",
    "lastName",
    "email",
    "phoneNumber",
    "createdAt",
    "updatedAt",
])

export type ClubMemberListSortBy = z.infer<typeof clubMemberListSortBySchema>

export const clubMemberListFiltersSchema = z.object({
    search: z.string().optional().nullable(),
})

export type ClubMemberListFilters = z.infer<typeof clubMemberListFiltersSchema>

export const getClubMembersPaginatedParamsSchema = z.object({
    page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
    take: z.coerce.number().int().min(1).max(100).default(10).catch(10),
    filters: clubMemberListFiltersSchema.optional(),
    sortBy: clubMemberListSortBySchema.default("lastName").catch("lastName"),
    sortDir: z.enum(["asc", "desc"]).default("asc").catch("asc"),
})

export const contentVisibilityFieldSchema = z.enum(contentVisibilitySchemaValues)
