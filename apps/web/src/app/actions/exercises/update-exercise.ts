"use server"

import type { Exercise } from "@prisma/client"
import { z } from "zod"

import { exerciseReplaceSchema } from "@/schemas/exercise.schema"
import { exerciseUpdate } from "@/services/exercises.service"

import { revalidateExercisesViews } from "./revalidate-exercises"
import type { ExerciseActionResult } from "./types"

export async function updateExerciseAction(
    input: unknown,
): Promise<ExerciseActionResult<Exercise>> {
    const parsed = exerciseReplaceSchema.safeParse(input)
    if (!parsed.success) {
        const issues = parsed.error.issues
        const error = issues.map((i) => i.message).filter(Boolean).join(" ") || "Validación fallida"
        return {
            ok: false,
            error,
            details: z.treeifyError(parsed.error),
        }
    }

    const { id, ...rest } = parsed.data

    try {
        const data = await exerciseUpdate(id, rest)
        revalidateExercisesViews()
        return { ok: true, data }
    } catch (e) {
        console.error("[updateExerciseAction]", e)
        return { ok: false, error: "Error al actualizar el ejercicio" }
    }
}
