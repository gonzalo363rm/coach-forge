"use server"

import { z } from "zod"

import { trainingClassDeleteSchema } from "@/schemas/training-class.schema"
import { trainingClassDelete } from "@/services/classes.service"

import { revalidateClassesViews } from "./revalidate-classes"
import type { ClassActionResult } from "./types"

export async function deleteTrainingClassAction(
    input: unknown,
): Promise<ClassActionResult<{ id: string }>> {
    const raw = typeof input === "string" ? { id: input } : input
    const parsed = trainingClassDeleteSchema.safeParse(raw)
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await trainingClassDelete(parsed.data.id)
    if (!result.ok) return result

    revalidateClassesViews()
    return { ok: true, data: { id: result.data.id } }
}
