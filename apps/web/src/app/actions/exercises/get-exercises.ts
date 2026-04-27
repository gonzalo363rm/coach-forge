"use server"

import { z } from "zod"

import { getExercisesPaginatedParamsSchema } from "@/schemas/exercise.schema"
import {
    exercisesListPaginated,
    type ExercisesPaginatedData,
} from "@/services/exercises.service"

import type { ExerciseActionResult } from "./types"

export async function getExercisesPaginatedAction(
    input: unknown,
): Promise<ExerciseActionResult<ExercisesPaginatedData>> {
    const parsed = getExercisesPaginatedParamsSchema.safeParse(input ?? {})
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const { page, take, filters, sortBy, sortDir } = parsed.data
    const f = filters ?? {}
    const result = await exercisesListPaginated(
        page,
        take,
        {
            search: f.search ?? undefined,
            sport: f.sport ?? undefined,
            difficulty: f.difficulty ?? undefined,
        },
        { sortBy, sortDir },
    )
    if (!result.ok) return result

    return { ok: true, data: result.data }
}
