"use server"

import { z } from "zod"

import { getAuthenticatedUserId } from "@/lib/get-authenticated-user-id"
import { trainingClassCreateSchema } from "@/schemas/training-class.schema"
import { trainingClassCreate } from "@/services/classes.service"

import { revalidateClassesViews } from "./revalidate-classes"
import type { ClassActionResult } from "./types"

export async function createTrainingClassAction(
    input: unknown,
): Promise<ClassActionResult<{ id: string }>> {
    const parsed = trainingClassCreateSchema.safeParse(input)
    if (!parsed.success) {
        const issues = parsed.error.issues
        const error =
            issues.map((i) => i.message).filter(Boolean).join(" ") || "Validación fallida"
        return {
            ok: false,
            error,
            details: z.treeifyError(parsed.error),
        }
    }

    try {
        const creatorId = await getAuthenticatedUserId()
        const created = await trainingClassCreate(parsed.data, creatorId)
        revalidateClassesViews()
        return { ok: true, data: { id: created.id } }
    } catch (e) {
        console.error("[createTrainingClassAction]", e)
        return { ok: false, error: "Error al guardar la clase" }
    }
}
