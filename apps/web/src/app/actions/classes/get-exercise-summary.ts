"use server"

import { z } from "zod"

import {
    exerciseGetById,
    exercisePreviewPublicUrl,
    type ExerciseListItem,
} from "@/services/exercises.service"

import type { ClassActionResult } from "./types"

const paramsSchema = z.object({
    id: z.string().min(1),
})

export async function getExerciseSummaryAction(
    input: unknown,
): Promise<ClassActionResult<ExerciseListItem>> {
    const parsed = paramsSchema.safeParse(input)
    if (!parsed.success) {
        return { ok: false, error: "ID de ejercicio inválido" }
    }

    try {
        const row = await exerciseGetById(parsed.data.id)
        if (!row) {
            return { ok: false, error: "Ejercicio no encontrado" }
        }
        return {
            ok: true,
            data: {
                ...row,
                previewUrl: exercisePreviewPublicUrl(row.id),
            },
        }
    } catch (e) {
        console.error("[getExerciseSummaryAction]", e)
        return { ok: false, error: "Error al cargar el ejercicio" }
    }
}
