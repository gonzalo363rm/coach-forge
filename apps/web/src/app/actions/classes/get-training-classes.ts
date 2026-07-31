"use server"

import { z } from "zod"

import { getTrainingClassesPaginatedParamsSchema } from "@/schemas/training-class.schema"
import {
    trainingClassesListPaginated,
    type TrainingClassesPaginatedData,
} from "@/services/classes.service"

import type { ClassActionResult } from "./types"

export async function getTrainingClassesPaginatedAction(
    input: unknown,
): Promise<ClassActionResult<TrainingClassesPaginatedData>> {
    const parsed = getTrainingClassesPaginatedParamsSchema.safeParse(input ?? {})
    if (!parsed.success) {
        return {
            ok: false,
            error: "Parámetros de listado inválidos",
            details: z.treeifyError(parsed.error),
        }
    }

    const { page, take, filters, sortBy, sortDir } = parsed.data
    const result = await trainingClassesListPaginated(
        page,
        take,
        {
            search: filters?.search ?? null,
            sport: filters?.sport ?? null,
            difficulty: filters?.difficulty ?? null,
            visibility: filters?.visibility ?? null,
            creatorId: filters?.creatorId ?? null,
        },
        { sortBy, sortDir },
    )

    if (!result.ok) return result
    return { ok: true, data: result.data }
}
