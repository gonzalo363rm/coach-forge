"use server"

import { z } from "zod"

import { requireTrainingClassManageAccess } from "@/lib/resource-access"
import { trainingClassUpdateSchema } from "@/schemas/training-class.schema"
import { trainingClassUpdate } from "@/services/classes.service"

import { revalidateClassesViews } from "./revalidate-classes"
import type { ClassActionResult } from "./types"

export async function updateTrainingClassAction(
    input: unknown,
): Promise<ClassActionResult<{ id: string }>> {
    const parsed = trainingClassUpdateSchema.safeParse(input)
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

    const access = await requireTrainingClassManageAccess(parsed.data.id)
    if (!access.ok) return access

    const result = await trainingClassUpdate(parsed.data)
    if (!result.ok) return result

    revalidateClassesViews(result.data.id)
    return { ok: true, data: { id: result.data.id } }
}
