import type { ClassSessionData } from "@/components/classes/class-session"
import { computeEstimatedTotalSeconds } from "@/components/classes/class-session"
import { resolveExercisePreviewUrl } from "@/lib/exercise-preview-resolve"
import type { TrainingClassWithItems } from "@/services/classes.service"

export async function buildClassSessionData(
    trainingClass: TrainingClassWithItems & {
        sport?: { name: string; slug?: string } | null
    },
): Promise<ClassSessionData> {
    const exercises = await Promise.all(
        trainingClass.items.map(async (item) => ({
            key: item.id,
            exerciseId: item.exerciseId,
            title: item.exercise.title,
            previewUrl: await resolveExercisePreviewUrl(item.exerciseId),
            durationSeconds: item.isOptional
                ? null
                : Math.max(60, (item.durationMinutes ?? 5) * 60),
            isOptional: item.isOptional,
        })),
    )

    return {
        classId: trainingClass.id,
        title: trainingClass.title,
        sportName: trainingClass.sport?.name ?? null,
        sportId: trainingClass.sportId,
        difficulty: trainingClass.difficulty,
        description: trainingClass.description ?? null,
        visibility: trainingClass.visibility,
        estimatedTotalSeconds: computeEstimatedTotalSeconds(exercises),
        exercises,
    }
}
