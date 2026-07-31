import type { ContentVisibility } from "@prisma/client"

/** Tipos y constantes seguros para cliente (sin imports de servidor). */

export const DEFAULT_REST_SECONDS = 60
export const REST_INCREMENT_SECONDS = 60

export type ClassSessionExercise = {
    key: string
    exerciseId: string
    title: string
    previewUrl: string
    durationSeconds: number | null
    isOptional: boolean
}

export type ClassSessionData = {
    classId: string
    title: string
    sportName: string | null
    sportId: string | null
    difficulty: number
    description: string | null
    visibility: ContentVisibility
    estimatedTotalSeconds: number
    exercises: ClassSessionExercise[]
}

export function computeEstimatedTotalSeconds(
    exercises: Pick<ClassSessionExercise, "durationSeconds">[],
): number {
    return exercises.reduce((sum, ex) => sum + (ex.durationSeconds ?? 0), 0)
}
