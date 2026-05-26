import type { ClassSessionData } from "@/components/classes/class-session"
import { computeEstimatedTotalSeconds } from "@/components/classes/class-session"
import type { TrainingClassWithItems } from "@/services/classes.service"
import { exercisePreviewPublicUrl } from "@/utils/exercise-preview-url"

export function buildClassSessionData(
    trainingClass: TrainingClassWithItems & {
        sport?: { name: string; slug?: string } | null
    },
): ClassSessionData {
    const exercises = trainingClass.items.map((item) => ({
        key: item.id,
        exerciseId: item.exerciseId,
        title: item.exercise.title,
        previewUrl: exercisePreviewPublicUrl(item.exerciseId),
        durationSeconds: item.isOptional
            ? null
            : Math.max(60, (item.durationMinutes ?? 5) * 60),
        isOptional: item.isOptional,
    }))

    return {
        classId: trainingClass.id,
        title: trainingClass.title,
        sportName: trainingClass.sport?.name ?? null,
        difficulty: trainingClass.difficulty,
        description: trainingClass.description ?? null,
        estimatedTotalSeconds: computeEstimatedTotalSeconds(exercises),
        exercises,
    }
}
