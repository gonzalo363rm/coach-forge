import type { ClassDraft } from "@/components/classes/class-draft-storage"
import { exercisePreviewPublicUrl } from "@/utils/exercise-preview-url"
import type { TrainingClassWithItems } from "@/services/classes.service"

export function trainingClassToDraft(trainingClass: TrainingClassWithItems): ClassDraft {
    return {
        title: trainingClass.title,
        description: trainingClass.description ?? "",
        sportId: trainingClass.sportId,
        difficulty: trainingClass.difficulty,
        isPublic: trainingClass.isPublic,
        items: trainingClass.items.map((item) => ({
            exerciseId: item.exerciseId,
            title: item.exercise.title,
            difficulty: item.exercise.difficulty,
            previewUrl: exercisePreviewPublicUrl(item.exerciseId),
            sortOrder: item.sortOrder,
            durationMinutes: item.durationMinutes,
            isOptional: item.isOptional,
        })),
    }
}
