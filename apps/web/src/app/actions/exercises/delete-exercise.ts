"use server"

import type { Exercise } from "@prisma/client"
import { z } from "zod"

import { requireExerciseManageAccess } from "@/lib/resource-access"
import { enforceDeleteExercise } from "@/lib/plan-enforce"
import { exerciseDeleteParamsSchema } from "@/schemas/exercise.schema"
import { exerciseDelete } from "@/services/exercises.service"

import { revalidateExercisesViews } from "./revalidate-exercises"
import type { ExerciseActionResult } from "./types"

export async function deleteExerciseAction(input: unknown): Promise<ExerciseActionResult<Exercise>> {
    const raw = typeof input === "string" ? { id: input } : input
    const parsed = exerciseDeleteParamsSchema.safeParse(raw)
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const access = await requireExerciseManageAccess(parsed.data.id)
    if (!access.ok) return access

    const deleteCheck = await enforceDeleteExercise(access.user.id)
    if (!deleteCheck.ok) return deleteCheck

    const result = await exerciseDelete(parsed.data.id)
    if (!result.ok) return result

    revalidateExercisesViews()
    return { ok: true, data: result.data }
}
