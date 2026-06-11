"use server"

import { z } from "zod"

import { getAuthenticatedUserId } from "@/lib/get-authenticated-user-id"
import { getTrainingClassesPaginatedParamsSchema } from "@/schemas/training-class.schema"
import {
    trainingClassesListPaginated,
    type TrainingClassesPaginatedData,
} from "@/services/classes.service"

import type { ClassActionResult } from "./types"

export async function getMyTrainingClassesPaginatedAction(
    input: unknown,
): Promise<ClassActionResult<TrainingClassesPaginatedData>> {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
        return { ok: false, error: "No autenticado" }
    }

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
            isPublic: filters?.isPublic ?? null,
            creatorId: userId,
        },
        { sortBy, sortDir },
    )

    if (!result.ok) return result
    return { ok: true, data: result.data }
}
