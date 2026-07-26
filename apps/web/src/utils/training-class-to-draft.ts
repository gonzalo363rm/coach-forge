import type { ClassDraft } from "@/components/classes/class-draft-storage"
import { resolveExercisePreviewUrl } from "@/lib/exercise-preview-resolve"
import type { TrainingClassWithItems } from "@/services/classes.service"

export async function trainingClassToDraft(
    trainingClass: TrainingClassWithItems,
): Promise<ClassDraft> {
    const items = await Promise.all(
        trainingClass.items.map(async (item) => ({
            exerciseId: item.exerciseId,
            title: item.exercise.title,
            difficulty: item.exercise.difficulty,
            previewUrl: await resolveExercisePreviewUrl(item.exerciseId),
            sortOrder: item.sortOrder,
            durationMinutes: item.durationMinutes,
            isOptional: item.isOptional,
            creatorId: item.exercise.creatorId,
        })),
    )

    return {
        title: trainingClass.title,
        description: trainingClass.description ?? "",
        sportId: trainingClass.sportId,
        difficulty: trainingClass.difficulty,
        isPublic: trainingClass.isPublic,
        items,
    }
}
