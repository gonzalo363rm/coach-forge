import type { Exercise } from "@prisma/client"

import { auth } from "@/auth"
import { canManageOwnedResource } from "@/lib/user-permissions"
import { exerciseGetById } from "@/services/exercises.service"
import { trainingClassGetById } from "@/services/classes.service"
import type { AuthUser } from "@/types/auth-user"

export const RESOURCE_FORBIDDEN_ERROR =
    "No tienes permiso para modificar este recurso"

export type AuthenticatedUserResult =
    | { ok: true; user: AuthUser }
    | { ok: false; error: string }

export async function requireAuthenticatedUser(): Promise<AuthenticatedUserResult> {
    const session = await auth()
    if (!session?.user) {
        return { ok: false, error: "No autenticado" }
    }
    return { ok: true, user: session.user }
}

type ExerciseAccessResult =
    | { ok: true; user: AuthUser; exercise: Exercise }
    | { ok: false; error: string }

export async function requireExerciseManageAccess(
    exerciseId: string,
): Promise<ExerciseAccessResult> {
    const authResult = await requireAuthenticatedUser()
    if (!authResult.ok) return authResult

    const exercise = await exerciseGetById(exerciseId)
    if (!exercise) {
        return { ok: false, error: "Ejercicio no encontrado" }
    }

    if (!canManageOwnedResource(authResult.user, exercise.creatorId)) {
        return { ok: false, error: RESOURCE_FORBIDDEN_ERROR }
    }

    return { ok: true, user: authResult.user, exercise }
}

type TrainingClassAccessResult =
    | {
          ok: true
          user: AuthUser
          trainingClass: NonNullable<Awaited<ReturnType<typeof trainingClassGetById>>>
      }
    | { ok: false; error: string }

export async function requireTrainingClassManageAccess(
    classId: string,
): Promise<TrainingClassAccessResult> {
    const authResult = await requireAuthenticatedUser()
    if (!authResult.ok) return authResult

    const trainingClass = await trainingClassGetById(classId)
    if (!trainingClass) {
        return { ok: false, error: "Clase no encontrada" }
    }

    if (!canManageOwnedResource(authResult.user, trainingClass.creatorId)) {
        return { ok: false, error: RESOURCE_FORBIDDEN_ERROR }
    }

    return { ok: true, user: authResult.user, trainingClass }
}
