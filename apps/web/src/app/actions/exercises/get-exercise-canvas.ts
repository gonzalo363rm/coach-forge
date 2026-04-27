"use server"

import { z } from "zod"

import type { ExerciseCanvas as ExerciseCanvasData } from "@/interfaces"
import { exerciseGetById } from "@/services/exercises.service"

import type { ExerciseActionResult } from "./types"

const paramsSchema = z.object({
    id: z.string().min(1),
})

export async function getExerciseCanvasAction(
    input: unknown,
): Promise<ExerciseActionResult<ExerciseCanvasData>> {
    const raw = typeof input === "string" ? { id: input } : input
    const parsed = paramsSchema.safeParse(raw)
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    try {
        const row = await exerciseGetById(parsed.data.id)
        if (!row) return { ok: false, error: "Ejercicio no encontrado" }
        return { ok: true, data: row.canvas as unknown as ExerciseCanvasData }
    } catch (e) {
        console.error("[getExerciseCanvasAction]", e)
        return { ok: false, error: "Error al cargar el canvas del ejercicio" }
    }
}

