"use server"

import { z } from "zod"

import { revalidateExercisesViews } from "@/app/actions/exercises/revalidate-exercises"
import type { ClassDraft } from "@/components/classes/class-draft-storage"
import { auth } from "@/auth"
import { resolveExercisePreviewUrl } from "@/lib/exercise-preview-resolve"
import { canManageOwnedResource } from "@/lib/user-permissions"
import { trainingClassGetById } from "@/services/classes.service"
import { exerciseCloneForUser } from "@/services/exercises.service"

import type { ClassActionResult } from "./types"

const inputSchema = z.object({
    sourceClassId: z.string().min(1),
})

/**
 * Clona ejercicios ajenos (privados) y arma el draft de clase.
 * No crea la TrainingClass. Los ejercicios propios se reutilizan por referencia.
 */
export async function prepareClassFromTemplateAction(
    input: unknown,
): Promise<ClassActionResult<ClassDraft>> {
    const parsed = inputSchema.safeParse(input)
    if (!parsed.success) {
        return { ok: false, error: "ID de clase inválido" }
    }

    const session = await auth()
    if (!session?.user?.id) {
        return { ok: false, error: "Debes iniciar sesión" }
    }

    const sourceClass = await trainingClassGetById(parsed.data.sourceClassId)
    if (
        !sourceClass ||
        (!sourceClass.isPublic &&
            !canManageOwnedResource(session.user, sourceClass.creatorId))
    ) {
        return { ok: false, error: "Clase no encontrada o sin acceso" }
    }

    const userId = session.user.id

    try {
        const willClone = sourceClass.items.some(
            (item) => item.exercise.creatorId !== userId,
        )
        const items = await Promise.all(
            sourceClass.items.map(async (item) => {
                const isOwn = item.exercise.creatorId === userId
                let exerciseId = item.exerciseId
                let creatorId = item.exercise.creatorId
                let title = item.exercise.title
                let difficulty = item.exercise.difficulty

                if (!isOwn) {
                    const cloned = await exerciseCloneForUser(item.exerciseId, userId)
                    exerciseId = cloned.id
                    creatorId = cloned.creatorId
                    title = cloned.title
                    difficulty = cloned.difficulty
                }

                return {
                    exerciseId,
                    title,
                    difficulty,
                    previewUrl: await resolveExercisePreviewUrl(exerciseId),
                    sortOrder: item.sortOrder,
                    durationMinutes: item.durationMinutes,
                    isOptional: item.isOptional,
                    creatorId,
                }
            }),
        )

        if (willClone) {
            revalidateExercisesViews()
        }

        return {
            ok: true,
            data: {
                title: "",
                description: sourceClass.description ?? "",
                sportId: sourceClass.sportId,
                difficulty: sourceClass.difficulty,
                isPublic: false,
                items,
            },
        }
    } catch (e) {
        console.error("[prepareClassFromTemplateAction]", e)
        return { ok: false, error: "Error al preparar la plantilla de clase" }
    }
}
