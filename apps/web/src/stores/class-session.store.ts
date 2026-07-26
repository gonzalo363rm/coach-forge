import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

/** TTL de snapshots de sesión en curso (48 h). */
export const CLASS_SESSION_SNAPSHOT_TTL_MS = 48 * 60 * 60 * 1000

export type ClassSessionExerciseProgress = {
    elapsed: number
    running: boolean
    completed: boolean
    alarmFired: boolean
    resting: boolean
    restElapsed: number
    restTargetSeconds: number
}

export type ClassSessionSnapshot = {
    userId: string
    classId: string
    focusedExerciseId: string | null
    sessionSeconds: number
    exercises: Record<string, ClassSessionExerciseProgress>
    updatedAt: number
}

type ClassSessionPersistState = {
    snapshots: Record<string, ClassSessionSnapshot>
    saveSnapshot: (snapshot: ClassSessionSnapshot) => void
    clearSnapshot: (userId: string, classId: string) => void
    getSnapshot: (userId: string, classId: string) => ClassSessionSnapshot | null
}

export function classSessionSnapshotKey(userId: string, classId: string): string {
    return `${userId}:${classId}`
}

function isSnapshotFresh(snapshot: ClassSessionSnapshot, now = Date.now()): boolean {
    return now - snapshot.updatedAt <= CLASS_SESSION_SNAPSHOT_TTL_MS
}

/** Normaliza snapshots viejos (descanso global) al formato por ejercicio. */
function normalizeSnapshot(raw: ClassSessionSnapshot): ClassSessionSnapshot {
    const exercises: Record<string, ClassSessionExerciseProgress> = {}
    for (const [id, progress] of Object.entries(raw.exercises ?? {})) {
        const p = progress as ClassSessionExerciseProgress & {
            resting?: boolean
            restElapsed?: number
            restTargetSeconds?: number
        }
        exercises[id] = {
            elapsed: p.elapsed ?? 0,
            running: Boolean(p.running) && !Boolean(p.resting),
            completed: Boolean(p.completed),
            alarmFired: Boolean(p.alarmFired),
            resting: Boolean(p.resting),
            restElapsed: p.restElapsed ?? 0,
            restTargetSeconds: p.restTargetSeconds ?? 60,
        }
    }
    return {
        userId: raw.userId,
        classId: raw.classId,
        focusedExerciseId: raw.focusedExerciseId ?? null,
        sessionSeconds: raw.sessionSeconds ?? 0,
        exercises,
        updatedAt: raw.updatedAt,
    }
}

export const useClassSessionStore = create<ClassSessionPersistState>()(
    persist(
        (set, get) => ({
            snapshots: {},

            saveSnapshot: (snapshot) => {
                const key = classSessionSnapshotKey(snapshot.userId, snapshot.classId)
                set((state) => ({
                    snapshots: {
                        ...state.snapshots,
                        [key]: { ...snapshot, updatedAt: Date.now() },
                    },
                }))
            },

            clearSnapshot: (userId, classId) => {
                const key = classSessionSnapshotKey(userId, classId)
                set((state) => {
                    if (!(key in state.snapshots)) return state
                    const { [key]: _removed, ...rest } = state.snapshots
                    return { snapshots: rest }
                })
            },

            getSnapshot: (userId, classId) => {
                const key = classSessionSnapshotKey(userId, classId)
                const snapshot = get().snapshots[key]
                if (!snapshot) return null
                if (!isSnapshotFresh(snapshot)) {
                    get().clearSnapshot(userId, classId)
                    return null
                }
                return normalizeSnapshot(snapshot)
            },
        }),
        {
            name: "coach-forge:class-session",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ snapshots: state.snapshots }),
        },
    ),
)

export type ClassSessionTimerHydration = {
    focusedIndex: number
    sessionSeconds: number
    exerciseElapsed: number[]
    exerciseRunning: boolean[]
    resting: boolean[]
    restElapsed: number[]
    restTargetSeconds: number[]
    completed: boolean[]
    exerciseAlarmFired: boolean[]
}

/** Mapea un snapshot a arrays alineados al orden actual de ejercicios. */
export function hydrateTimerFromSnapshot(
    snapshot: ClassSessionSnapshot | null | undefined,
    exerciseIds: string[],
    defaultRestSeconds: number,
): ClassSessionTimerHydration | null {
    if (!snapshot || exerciseIds.length === 0) return null

    const normalized = normalizeSnapshot(snapshot)
    const exerciseElapsed: number[] = []
    const exerciseRunning: boolean[] = []
    const resting: boolean[] = []
    const restElapsed: number[] = []
    const restTargetSeconds: number[] = []
    const completed: boolean[] = []
    const exerciseAlarmFired: boolean[] = []

    for (const id of exerciseIds) {
        const progress = normalized.exercises[id]
        exerciseElapsed.push(progress?.elapsed ?? 0)
        exerciseRunning.push(progress?.running ?? false)
        resting.push(progress?.resting ?? false)
        restElapsed.push(progress?.restElapsed ?? 0)
        restTargetSeconds.push(progress?.restTargetSeconds ?? defaultRestSeconds)
        completed.push(progress?.completed ?? false)
        exerciseAlarmFired.push(progress?.alarmFired ?? false)
    }

    let focusedIndex = 0
    if (normalized.focusedExerciseId) {
        const idx = exerciseIds.indexOf(normalized.focusedExerciseId)
        if (idx >= 0) focusedIndex = idx
    }

    return {
        focusedIndex,
        sessionSeconds: Math.max(0, normalized.sessionSeconds),
        exerciseElapsed,
        exerciseRunning,
        resting,
        restElapsed,
        restTargetSeconds,
        completed,
        exerciseAlarmFired,
    }
}

export function buildClassSessionSnapshot(input: {
    userId: string
    classId: string
    exerciseIds: string[]
    focusedIndex: number
    sessionSeconds: number
    exerciseElapsed: number[]
    exerciseRunning: boolean[]
    resting: boolean[]
    restElapsed: number[]
    restTargetSeconds: number[]
    completed: boolean[]
    exerciseAlarmFired: boolean[]
}): ClassSessionSnapshot {
    const exercises: Record<string, ClassSessionExerciseProgress> = {}
    for (let i = 0; i < input.exerciseIds.length; i++) {
        const id = input.exerciseIds[i]!
        exercises[id] = {
            elapsed: input.exerciseElapsed[i] ?? 0,
            running: input.exerciseRunning[i] ?? false,
            completed: input.completed[i] ?? false,
            alarmFired: input.exerciseAlarmFired[i] ?? false,
            resting: input.resting[i] ?? false,
            restElapsed: input.restElapsed[i] ?? 0,
            restTargetSeconds: input.restTargetSeconds[i] ?? 60,
        }
    }

    return {
        userId: input.userId,
        classId: input.classId,
        focusedExerciseId: input.exerciseIds[input.focusedIndex] ?? null,
        sessionSeconds: input.sessionSeconds,
        exercises,
        updatedAt: Date.now(),
    }
}
