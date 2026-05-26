import type { ExerciseListItem } from "@/services/exercises.service"

export type ClassDraftExerciseItem = {
    exerciseId: string
    title: string
    difficulty: number
    previewUrl: string
    sortOrder: number
    durationMinutes: number | null
    isOptional: boolean
}

export type ClassDraft = {
    title: string
    description: string
    sportId: string | null
    difficulty: number
    isPublic: boolean
    items: ClassDraftExerciseItem[]
}

const STORAGE_KEY = "coach-forge:class-draft"

export function loadClassDraft(): ClassDraft | null {
    if (typeof window === "undefined") return null
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as Partial<ClassDraft>
        return {
            ...defaultClassDraft(),
            ...parsed,
            items: parsed.items ?? [],
        }
    } catch {
        return null
    }
}

export function saveClassDraft(draft: ClassDraft): void {
    if (typeof window === "undefined") return
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export function clearClassDraft(): void {
    if (typeof window === "undefined") return
    sessionStorage.removeItem(STORAGE_KEY)
}

export function defaultClassDraft(): ClassDraft {
    return {
        title: "",
        description: "",
        sportId: null,
        difficulty: 3,
        isPublic: false,
        items: [],
    }
}

export function exerciseToDraftItem(
    exercise: ExerciseListItem,
    sortOrder: number,
    overrides?: Partial<Pick<ClassDraftExerciseItem, "durationMinutes" | "isOptional">>,
): ClassDraftExerciseItem {
    return {
        exerciseId: exercise.id,
        title: exercise.title,
        difficulty: exercise.difficulty,
        previewUrl: exercise.previewUrl,
        sortOrder,
        durationMinutes: overrides?.durationMinutes ?? 5,
        isOptional: overrides?.isOptional ?? false,
    }
}
