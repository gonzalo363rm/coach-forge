import { z } from "zod"

import { contentVisibilitySchemaValues } from "@/lib/content-visibility"

export const trainingClassItemSchema = z
    .object({
        exerciseId: z.string().min(1),
        sortOrder: z.number().int().min(0),
        durationMinutes: z.union([z.number().int().positive(), z.null()]).optional(),
        isOptional: z.boolean().default(false),
    })
    .superRefine((item, ctx) => {
        if (item.isOptional) return
        if (item.durationMinutes == null || item.durationMinutes < 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "La duración es obligatoria si el ejercicio no es opcional",
                path: ["durationMinutes"],
            })
        }
    })

export const trainingClassCreateSchema = z.object({
    title: z.string().trim().min(1, "El título es obligatorio").max(500),
    description: z
        .union([z.string().trim().max(2000, "Máximo 2000 caracteres"), z.null()])
        .optional(),
    sportId: z.union([z.string().min(1), z.null()]).optional(),
    difficulty: z.number().int().min(1).max(5),
    visibility: z.enum(contentVisibilitySchemaValues).default("private"),
    items: z.array(trainingClassItemSchema).min(1, "Añade al menos un ejercicio"),
})

export type TrainingClassCreateInput = z.infer<typeof trainingClassCreateSchema>
export type TrainingClassItemInput = z.infer<typeof trainingClassItemSchema>

export const trainingClassUpdateSchema = trainingClassCreateSchema.extend({
    id: z.string().min(1, "id obligatorio"),
})

export type TrainingClassUpdateInput = z.infer<typeof trainingClassUpdateSchema>

export const trainingClassDeleteSchema = z.object({
    id: z.string().min(1, "id obligatorio"),
})

export type TrainingClassDeleteInput = z.infer<typeof trainingClassDeleteSchema>

export const trainingClassListSortBySchema = z.enum([
    "title",
    "description",
    "sport",
    "difficulty",
    "exerciseCount",
    "totalMinutes",
    "visibility",
    "updatedAt",
    "createdAt",
])

export type TrainingClassListSortBy = z.infer<typeof trainingClassListSortBySchema>

export const trainingClassListFiltersSchema = z.object({
    search: z.string().optional().nullable(),
    sport: z.string().optional().nullable(),
    difficulty: z.number().int().min(1).max(5).optional().nullable(),
    visibility: z.enum(contentVisibilitySchemaValues).optional().nullable(),
    creatorId: z.string().min(1).optional().nullable(),
})

export type TrainingClassListFilters = z.infer<typeof trainingClassListFiltersSchema>

export const getTrainingClassesPaginatedParamsSchema = z.object({
    page: z.coerce.number().int().min(1).max(10_000).default(1).catch(1),
    take: z.coerce.number().int().min(1).max(100).default(10).catch(10),
    filters: trainingClassListFiltersSchema.optional(),
    sortBy: trainingClassListSortBySchema.default("updatedAt").catch("updatedAt"),
    sortDir: z.enum(["asc", "desc"]).default("desc").catch("desc"),
})

export function computeExerciseCount(items: { isOptional?: boolean }[]): number {
    return items.length
}

export function computeTotalMinutes(
    items: { durationMinutes?: number | null; isOptional: boolean }[],
): number {
    return items.reduce((sum, item) => {
        if (item.isOptional) return sum
        return sum + (item.durationMinutes ?? 0)
    }, 0)
}
