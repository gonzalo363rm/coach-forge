"use server"

import { z } from "zod"

import { exerciseSavePreview } from "@/services/exercises.service"

import { revalidateExercisesViews } from "./revalidate-exercises"
import type { ExerciseActionResult } from "./types"

const savePreviewInputSchema = z.object({
    exerciseId: z.string().min(8),
    /** WebP codificado en base64 (sin prefijo data:). */
    webpBase64: z.string().min(1).max(18_000_000),
})

export async function saveExercisePreviewAction(
    input: unknown,
): Promise<ExerciseActionResult<{ url: string }>> {
    const parsed = savePreviewInputSchema.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false,
            error: "Datos de vista previa inválidos",
            details: z.treeifyError(parsed.error),
        }
    }

    let buf: Buffer
    try {
        buf = Buffer.from(parsed.data.webpBase64, "base64")
    } catch {
        return { ok: false, error: "Base64 inválido" }
    }

    try {
        const data = await exerciseSavePreview(parsed.data.exerciseId, buf)
        revalidateExercisesViews()
        return { ok: true, data }
    } catch (e) {
        console.error("[saveExercisePreviewAction]", e)
        const msg = e instanceof Error ? e.message : "Error al guardar la vista previa"
        return { ok: false, error: msg }
    }
}
