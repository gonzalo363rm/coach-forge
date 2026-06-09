"use server"

import type { Exercise } from "@prisma/client"
import { z } from "zod"

import { getAuthenticatedUserId } from "@/lib/get-authenticated-user-id"
import { exerciseCreateSchema } from "@/schemas/exercise.schema"
import { exerciseCreate } from "@/services/exercises.service"

import { revalidateExercisesViews } from "./revalidate-exercises"
import type { ExerciseActionResult } from "./types"

export async function createExerciseAction(
    input: unknown,
): Promise<ExerciseActionResult<Exercise>> {
    const parsed = exerciseCreateSchema.safeParse(input)
    if (!parsed.success) {
        const issues = parsed.error.issues
        const error = issues.map((i) => i.message).filter(Boolean).join(" ") || "Validación fallida"
        return {
            ok: false,
            error,
            details: z.treeifyError(parsed.error),
        }
    }

    try {
        const creatorId = await getAuthenticatedUserId()
        const data = await exerciseCreate(parsed.data, creatorId)
        revalidateExercisesViews()
        return { ok: true, data }
    } catch (e) {
        console.error("[createExerciseAction]", e)
        return { ok: false, error: "Error al guardar el ejercicio" }
    }
}
