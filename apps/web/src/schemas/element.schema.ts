import { z } from "zod"

import { MAX_IMAGE_FILE_BYTES } from "@/utils/element-image-file"
import { slugPattern, slugifySportName } from "@/utils/slug"

const MAX_ELEMENT_IMAGE_BASE64_CHARS = Math.floor(MAX_IMAGE_FILE_BYTES * 1.4)

const undefinedToNull = (v: unknown) => (v === undefined ? null : v)

const elementImageBase64Schema = z
    .string()
    .min(1)
    .max(MAX_ELEMENT_IMAGE_BASE64_CHARS)
    .refine((s) => /^[A-Za-z0-9+/=]+$/.test(s), "Base64 inválido")

const elementImageMimeSchema = z.enum([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
])

export const elementCreateSchema = z
    .object({
        id: z
            .string()
            .trim()
            .max(80)
            .regex(slugPattern, "Id: solo minúsculas, números y guiones internos")
            .optional(),
        sportId: z.preprocess(
            undefinedToNull,
            z.union([z.string().min(1), z.null()]),
        ),
        name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
        type: z.literal("image"),
        width: z.number().positive("El ancho debe ser mayor que 0"),
        height: z.number().positive("El alto debe ser mayor que 0"),
        imageBase64: elementImageBase64Schema,
        imageMime: elementImageMimeSchema,
    })
    .transform(({ id, name, ...rest }) => ({
        ...rest,
        id: id && id.length > 0 ? id : slugifySportName(name),
        name: name.trim(),
    }))
    .refine((d) => d.id.length > 0, {
        message: "No se pudo generar un id válido a partir del nombre",
        path: ["name"],
    })

export type ElementCreateInput = z.infer<typeof elementCreateSchema>

export const elementUpdateSchema = z
    .object({
        id: z.string().min(1),
        sportId: z.union([z.string().min(1), z.null()]).optional(),
        name: z.string().trim().min(1).max(200).optional(),
        width: z.number().positive().optional(),
        height: z.number().positive().optional(),
        imageBase64: elementImageBase64Schema.optional(),
        imageMime: elementImageMimeSchema.optional(),
    })
    .strict()
    .refine((obj) => Object.keys(obj).filter((k) => k !== "id").length > 0, {
        message: "Se requiere al menos un campo para actualizar",
    })
    .refine(
        (obj) =>
            (obj.imageBase64 === undefined && obj.imageMime === undefined) ||
            (obj.imageBase64 !== undefined && obj.imageMime !== undefined),
        { message: "Imagen e imageMime deben enviarse juntos", path: ["imageBase64"] },
    )

export type ElementUpdateInput = z.infer<typeof elementUpdateSchema>

export const elementDeleteParamsSchema = z.object({
    id: z.string().min(1),
})

export const elementListSortBySchema = z.enum(["name", "sport", "width", "height", "updatedAt"])

export type ElementListSortBy = z.infer<typeof elementListSortBySchema>

export const getElementsPaginatedParamsSchema = z.object({
    page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
    take: z.coerce.number().int().min(1).max(100).default(10).catch(10),
    filters: z
        .object({
            search: z.string().optional().nullable(),
            sport: z.string().optional().nullable(),
        })
        .optional(),
    sortBy: elementListSortBySchema.default("updatedAt").catch("updatedAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc").catch("desc"),
})
