import { z } from "zod"

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
    sportId: z.union([z.string().min(1), z.null()]).optional(),
    difficulty: z.number().int().min(1).max(5),
    isPublic: z.boolean().default(false),
    items: z.array(trainingClassItemSchema).min(1, "Añade al menos un ejercicio"),
})

export type TrainingClassCreateInput = z.infer<typeof trainingClassCreateSchema>
export type TrainingClassItemInput = z.infer<typeof trainingClassItemSchema>

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
