import { z } from "zod"

import { passwordSchema } from "@/schemas/auth.schema"

const roleSchema = z.enum(["admin", "coach"])

export const userCreateSchema = z
    .object({
        firstName: z.string().trim().min(1, "El nombre es obligatorio").max(80),
        lastName: z.string().trim().min(1, "El apellido es obligatorio").max(80),
        email: z.email({ error: "Introduce un email válido" }),
        phoneNumber: z.string().trim().max(30).optional(),
        role: roleSchema,
        emailVerified: z.boolean(),
        avatarUrl: z.url().max(2000).optional().or(z.literal("")),
        password: passwordSchema,
        confirmPassword: z.string({ error: "Confirma la contraseña" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    })

export type UserCreateInput = z.infer<typeof userCreateSchema>

export const userUpdateSchema = z
    .object({
        id: z.string().min(1, "id obligatorio"),
        firstName: z.string().trim().min(1, "El nombre es obligatorio").max(80),
        lastName: z.string().trim().min(1, "El apellido es obligatorio").max(80),
        email: z.email({ error: "Introduce un email válido" }),
        phoneNumber: z.string().trim().max(30).optional(),
        role: roleSchema,
        emailVerified: z.boolean(),
        avatarUrl: z.string().trim().url().max(2000).optional().or(z.literal("")),
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

export type UserUpdateInput = z.infer<typeof userUpdateSchema>

export const userDeleteParamsSchema = z.object({
    id: z.string().min(1, "id obligatorio"),
})

export const userListSortBySchema = z.enum([
    "firstName",
    "lastName",
    "email",
    "role",
    "createdAt",
    "updatedAt",
])

export type UserListSortBy = z.infer<typeof userListSortBySchema>

export const userListFiltersSchema = z.object({
    search: z.string().optional().nullable(),
    role: roleSchema.optional().nullable(),
})

export type UserListFilters = z.infer<typeof userListFiltersSchema>

export const getUsersPaginatedParamsSchema = z.object({
    page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
    take: z.coerce.number().int().min(1).max(100).default(10).catch(10),
    filters: userListFiltersSchema.optional(),
    sortBy: userListSortBySchema.default("updatedAt").catch("updatedAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc").catch("desc"),
})
