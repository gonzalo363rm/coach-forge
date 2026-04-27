import { z } from "zod"

import { slugPattern, slugifySportName } from "@/utils/slug"

/**
 * Cuerpo para crear un deporte (sin `id`).
 * Si no envías `slug`, se deriva de `name`.
 */
export const sportCreateSchema = z
    .object({
        name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
        slug: z
            .string()
            .trim()
            .max(80)
            .regex(slugPattern, "Slug: solo minúsculas, números y guiones internos")
            .optional(),
    })
    .transform(({ name, slug }) => {
        const raw = slug && slug.length > 0 ? slug : slugifySportName(name)
        return { name: name.trim(), slug: raw }
    })
    .refine((d) => d.slug.length > 0, {
        message: "No se pudo generar un slug válido a partir del nombre",
        path: ["name"],
    })

export type SportCreateInput = z.infer<typeof sportCreateSchema>

/**
 * Actualizar deporte: `name` obligatorio; `slug` opcional (si no se envía, se mantiene el actual en la action).
 */
export const sportUpdateSchema = z.object({
    id: z.string().min(1, "id obligatorio"),
    name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
    slug: z
        .string()
        .trim()
        .max(80)
        .regex(slugPattern, "Slug: solo minúsculas, números y guiones internos")
        .optional(),
})

export type SportUpdateInput = z.infer<typeof sportUpdateSchema>

export const sportDeleteSchema = z.object({
    id: z.string().min(1, "id obligatorio"),
})

export type SportDeleteInput = z.infer<typeof sportDeleteSchema>

export const sportListSortBySchema = z.enum(["name", "createdAt"])

export type SportListSortBy = z.infer<typeof sportListSortBySchema>

export const getSportsPaginatedParamsSchema = z.object({
    page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
    take: z.coerce.number().int().min(1).max(100).default(10).catch(10),
    filters: z
        .object({
            search: z.string().optional().nullable(),
        })
        .optional(),
    sortBy: sportListSortBySchema.default("name").catch("name"),
    sortDir: z.enum(["asc", "desc"]).default("asc").catch("asc"),
})