"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { DEFAULT_REST_SECONDS } from "@/components/classes/class-session"
import type { ClassSessionTimerHydration } from "@/stores/class-session.store"
import { playTimerAlarm } from "@/utils/play-timer-alarm"

type Options = {
    exerciseCount: number
    exerciseDurations: (number | null)[]
    defaultRestSeconds?: number
    /** Estado restaurado desde localStorage (una sola vez al montar). */
    initialState?: ClassSessionTimerHydration | null
}

function emptyBoolArray(n: number): boolean[] {
    return Array.from({ length: n }, () => false)
}

function emptyNumArray(n: number): number[] {
    return Array.from({ length: n }, () => 0)
}

function emptyNullableNumArray(n: number): (number | null)[] {
    return Array.from({ length: n }, () => null)
}

function fillNumArray(n: number, value: number): number[] {
    return Array.from({ length: n }, () => value)
}

/** Ancla: `Date.now() - elapsedSec * 1000` para leer segundos con reloj de pared. */
function wallAnchorFromElapsed(elapsedSec: number, now = Date.now()): number {
    return now - elapsedSec * 1000
}

function elapsedFromWallAnchor(anchorMs: number, now = Date.now()): number {
    return Math.max(0, Math.floor((now - anchorMs) / 1000))
}

function resolveInitial(
    exerciseCount: number,
    defaultRestSeconds: number,
    initialState?: ClassSessionTimerHydration | null,
): ClassSessionTimerHydration {
    if (!initialState || initialState.exerciseElapsed.length === 0) {
        return {
            focusedIndex: 0,
            sessionSeconds: 0,
            exerciseElapsed: emptyNumArray(exerciseCount),
            exerciseRunning: emptyBoolArray(exerciseCount),
            resting: emptyBoolArray(exerciseCount),
            restElapsed: emptyNumArray(exerciseCount),
            restTargetSeconds: fillNumArray(exerciseCount, defaultRestSeconds),
            completed: emptyBoolArray(exerciseCount),
            exerciseAlarmFired: emptyBoolArray(exerciseCount),
        }
    }

    const padNum = (arr: number[], fill = 0) => {
        if (arr.length >= exerciseCount) return arr.slice(0, exerciseCount)
        return [...arr, ...Array.from({ length: exerciseCount - arr.length }, () => fill)]
    }
    const padBool = (arr: boolean[]) => {
        if (arr.length >= exerciseCount) return arr.slice(0, exerciseCount)
        return [...arr, ...emptyBoolArray(exerciseCount - arr.length)]
    }

    return {
        focusedIndex: Math.min(
            Math.max(0, initialState.focusedIndex),
            Math.max(0, exerciseCount - 1),
        ),
        sessionSeconds: initialState.sessionSeconds,
        exerciseElapsed: padNum(initialState.exerciseElapsed),
        exerciseRunning: padBool(initialState.exerciseRunning),
        resting: padBool(initialState.resting),
        restElapsed: padNum(initialState.restElapsed),
        restTargetSeconds: padNum(initialState.restTargetSeconds, defaultRestSeconds),
        completed: padBool(initialState.completed),
        exerciseAlarmFired: padBool(initialState.exerciseAlarmFired),
    }
}

export function useClassSessionTimer({
    exerciseCount,
    exerciseDurations,
    defaultRestSeconds = DEFAULT_REST_SECONDS,
    initialState = null,
}: Options) {
    const resolvedInitial = resolveInitial(exerciseCount, defaultRestSeconds, initialState)

    const [focusedIndex, setFocusedIndex] = useState(resolvedInitial.focusedIndex)
    const [sessionSeconds, setSessionSeconds] = useState(resolvedInitial.sessionSeconds)
    const [exerciseElapsed, setExerciseElapsed] = useState<number[]>(
        () => resolvedInitial.exerciseElapsed,
    )
    const [exerciseRunning, setExerciseRunning] = useState<boolean[]>(
        () => resolvedInitial.exerciseRunning,
    )
    const [resting, setResting] = useState<boolean[]>(() => resolvedInitial.resting)
    const [restElapsed, setRestElapsed] = useState<number[]>(
        () => resolvedInitial.restElapsed,
    )
    const [restTargetSeconds, setRestTargetSeconds] = useState<number[]>(
        () => resolvedInitial.restTargetSeconds,
    )
    const [completed, setCompleted] = useState<boolean[]>(() => resolvedInitial.completed)
    const [exerciseAlarmFired, setExerciseAlarmFired] = useState<boolean[]>(
        () => resolvedInitial.exerciseAlarmFired,
    )

    const exerciseRunningRef = useRef(exerciseRunning)
    const restingRef = useRef(resting)
    const sessionSecondsRef = useRef(sessionSeconds)
    const restEndHandledRef = useRef(emptyBoolArray(exerciseCount))

    const sessionAnchorRef = useRef<number | null>(null)
    const exerciseAnchorsRef = useRef<(number | null)[]>(
        emptyNullableNumArray(exerciseCount),
    )
    const restAnchorsRef = useRef<(number | null)[]>(emptyNullableNumArray(exerciseCount))
    const anchorsRestoredRef = useRef(false)

    exerciseRunningRef.current = exerciseRunning
    restingRef.current = resting
    sessionSecondsRef.current = sessionSeconds

    /** Restaura anclas de pared tras hidratar. */
    useEffect(() => {
        if (anchorsRestoredRef.current) return
        anchorsRestoredRef.current = true

        const now = Date.now()
        const running = resolvedInitial.exerciseRunning
        const elapsed = resolvedInitial.exerciseElapsed
        const wasResting = resolvedInitial.resting
        const restEl = resolvedInitial.restElapsed

        exerciseAnchorsRef.current = emptyNullableNumArray(exerciseCount)
        restAnchorsRef.current = emptyNullableNumArray(exerciseCount)

        for (let i = 0; i < exerciseCount; i++) {
            if (running[i]) {
                exerciseAnchorsRef.current[i] = wallAnchorFromElapsed(elapsed[i] ?? 0, now)
            }
            if (wasResting[i]) {
                restAnchorsRef.current[i] = wallAnchorFromElapsed(restEl[i] ?? 0, now)
            }
        }

        if (running.some(Boolean) || wasResting.some(Boolean)) {
            sessionAnchorRef.current = wallAnchorFromElapsed(
                resolvedInitial.sessionSeconds,
                now,
            )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const pad = <T,>(prev: T[], fill: T): T[] => {
            if (prev.length >= exerciseCount) return prev
            return [
                ...prev,
                ...Array.from({ length: exerciseCount - prev.length }, () => fill),
            ]
        }

        setExerciseElapsed((prev) => pad(prev, 0))
        setExerciseRunning((prev) => pad(prev, false))
        setResting((prev) => pad(prev, false))
        setRestElapsed((prev) => pad(prev, 0))
        setRestTargetSeconds((prev) => pad(prev, defaultRestSeconds))
        setCompleted((prev) => pad(prev, false))
        setExerciseAlarmFired((prev) => pad(prev, false))

        if (exerciseAnchorsRef.current.length < exerciseCount) {
            exerciseAnchorsRef.current = [
                ...exerciseAnchorsRef.current,
                ...emptyNullableNumArray(exerciseCount - exerciseAnchorsRef.current.length),
            ]
        }
        if (restAnchorsRef.current.length < exerciseCount) {
            restAnchorsRef.current = [
                ...restAnchorsRef.current,
                ...emptyNullableNumArray(exerciseCount - restAnchorsRef.current.length),
            ]
        }
        if (restEndHandledRef.current.length < exerciseCount) {
            restEndHandledRef.current = [
                ...restEndHandledRef.current,
                ...emptyBoolArray(exerciseCount - restEndHandledRef.current.length),
            ]
        }
    }, [exerciseCount, defaultRestSeconds])

    const anyExerciseRunning = exerciseRunning.some(Boolean)
    const anyResting = resting.some(Boolean)
    const clockActive = anyExerciseRunning || anyResting

    const syncFromWallClock = useCallback(() => {
        const now = Date.now()

        if (sessionAnchorRef.current != null) {
            const next = elapsedFromWallAnchor(sessionAnchorRef.current, now)
            sessionSecondsRef.current = next
            setSessionSeconds(next)
        }

        if (exerciseRunningRef.current.some(Boolean)) {
            setExerciseElapsed((prev) =>
                prev.map((sec, i) => {
                    const anchor = exerciseAnchorsRef.current[i]
                    if (!exerciseRunningRef.current[i] || anchor == null) return sec
                    return elapsedFromWallAnchor(anchor, now)
                }),
            )
        }

        if (restingRef.current.some(Boolean)) {
            setRestElapsed((prev) =>
                prev.map((sec, i) => {
                    const anchor = restAnchorsRef.current[i]
                    if (!restingRef.current[i] || anchor == null) return sec
                    return elapsedFromWallAnchor(anchor, now)
                }),
            )
        }
    }, [])

    useEffect(() => {
        if (!clockActive) {
            if (sessionAnchorRef.current != null) {
                syncFromWallClock()
                sessionAnchorRef.current = null
            }
            return
        }

        if (sessionAnchorRef.current == null) {
            sessionAnchorRef.current = wallAnchorFromElapsed(sessionSecondsRef.current)
        }

        syncFromWallClock()
        const id = window.setInterval(syncFromWallClock, 250)

        const onVisibility = () => {
            if (document.visibilityState === "visible") syncFromWallClock()
        }
        document.addEventListener("visibilitychange", onVisibility)
        window.addEventListener("focus", syncFromWallClock)

        return () => {
            window.clearInterval(id)
            document.removeEventListener("visibilitychange", onVisibility)
            window.removeEventListener("focus", syncFromWallClock)
        }
    }, [clockActive, syncFromWallClock])

    const pauseExercise = useCallback((index: number) => {
        const anchor = exerciseAnchorsRef.current[index]
        if (anchor != null) {
            const elapsed = elapsedFromWallAnchor(anchor)
            setExerciseElapsed((prev) => {
                const next = [...prev]
                next[index] = elapsed
                return next
            })
            exerciseAnchorsRef.current[index] = null
        }
        setExerciseRunning((prev) => {
            const next = [...prev]
            next[index] = false
            return next
        })
    }, [])

    const startRestForExercise = useCallback(
        (index: number, seconds: number = defaultRestSeconds) => {
            pauseExercise(index)
            restEndHandledRef.current[index] = false
            setFocusedIndex(index)
            setResting((prev) => {
                const next = [...prev]
                next[index] = true
                return next
            })
            setRestElapsed((prev) => {
                const next = [...prev]
                next[index] = 0
                return next
            })
            setRestTargetSeconds((prev) => {
                const next = [...prev]
                next[index] = seconds
                return next
            })
            restAnchorsRef.current[index] = wallAnchorFromElapsed(0)
        },
        [defaultRestSeconds, pauseExercise],
    )

    const finishRestAsCompleted = useCallback(
        (index: number) => {
            restAnchorsRef.current[index] = null
            setResting((prev) => {
                const next = [...prev]
                next[index] = false
                return next
            })
            setRestElapsed((prev) => {
                const next = [...prev]
                next[index] = 0
                return next
            })
            setCompleted((prev) => {
                const next = [...prev]
                next[index] = true
                return next
            })
            setFocusedIndex(index)
        },
        [],
    )

    const playExercise = useCallback(
        (index: number) => {
            if (completed[index] || resting[index]) return
            setFocusedIndex(index)
            setExerciseRunning((prev) => {
                const next = [...prev]
                next[index] = true
                return next
            })
            setExerciseElapsed((prev) => {
                exerciseAnchorsRef.current[index] = wallAnchorFromElapsed(prev[index] ?? 0)
                return prev
            })
        },
        [completed, resting],
    )

    const focusExercise = useCallback((index: number) => {
        setFocusedIndex(index)
    }, [])

    const toggleExercise = useCallback(
        (index: number) => {
            if (completed[index] || resting[index]) return
            if (exerciseRunning[index]) {
                pauseExercise(index)
                setFocusedIndex(index)
            } else {
                playExercise(index)
            }
        },
        [completed, resting, exerciseRunning, pauseExercise, playExercise],
    )

    const resetExerciseTimer = useCallback((index: number) => {
        setExerciseAlarmFired((prev) => {
            const next = [...prev]
            next[index] = false
            return next
        })
        exerciseAnchorsRef.current[index] = exerciseRunningRef.current[index]
            ? wallAnchorFromElapsed(0)
            : null
        setExerciseElapsed((prev) => {
            const next = [...prev]
            next[index] = 0
            return next
        })
    }, [])

    /** Terminar ejercicio → entra en descanso (otros cronómetros siguen). */
    const completeExercise = useCallback(
        (index: number) => {
            if (completed[index] || resting[index]) return
            startRestForExercise(index, defaultRestSeconds)
        },
        [completed, resting, defaultRestSeconds, startRestForExercise],
    )

    const repeatExercise = useCallback(
        (index: number) => {
            restAnchorsRef.current[index] = null
            restEndHandledRef.current[index] = false
            setResting((prev) => {
                const next = [...prev]
                next[index] = false
                return next
            })
            setRestElapsed((prev) => {
                const next = [...prev]
                next[index] = 0
                return next
            })
            setExerciseAlarmFired((prev) => {
                const next = [...prev]
                next[index] = false
                return next
            })
            setCompleted((prev) => {
                const next = [...prev]
                next[index] = false
                return next
            })
            resetExerciseTimer(index)
            setFocusedIndex(index)
        },
        [resetExerciseTimer],
    )

    /** Inicia descanso en el ejercicio enfocado (sin pausar los demás). */
    const startRest = useCallback(
        (seconds: number = defaultRestSeconds) => {
            const index = focusedIndex
            if (completed[index]) return
            startRestForExercise(index, seconds)
        },
        [focusedIndex, completed, defaultRestSeconds, startRestForExercise],
    )

    const addRestTime = useCallback(
        (seconds: number) => {
            const index = focusedIndex
            if (!resting[index]) {
                startRestForExercise(index, defaultRestSeconds + seconds)
                return
            }
            restEndHandledRef.current[index] = false
            const currentRest =
                restAnchorsRef.current[index] != null
                    ? elapsedFromWallAnchor(restAnchorsRef.current[index]!)
                    : (restElapsed[index] ?? 0)
            setRestElapsed((prev) => {
                const next = [...prev]
                next[index] = currentRest
                return next
            })
            setRestTargetSeconds((prev) => {
                const next = [...prev]
                next[index] = Math.max(currentRest, prev[index] ?? 0) + seconds
                return next
            })
            restAnchorsRef.current[index] = wallAnchorFromElapsed(currentRest)
        },
        [
            focusedIndex,
            resting,
            restElapsed,
            defaultRestSeconds,
            startRestForExercise,
        ],
    )

    const skipRest = useCallback(
        (index: number = focusedIndex) => {
            if (!resting[index] && !restingRef.current[index]) return
            playTimerAlarm()
            finishRestAsCompleted(index)
        },
        [focusedIndex, resting, finishRestAsCompleted],
    )

    const pauseRest = useCallback((index: number = focusedIndex) => {
        const anchor = restAnchorsRef.current[index]
        if (anchor != null) {
            const elapsed = elapsedFromWallAnchor(anchor)
            setRestElapsed((prev) => {
                const next = [...prev]
                next[index] = elapsed
                return next
            })
            restAnchorsRef.current[index] = null
        }
    }, [focusedIndex])

    const resumeRest = useCallback((index: number = focusedIndex) => {
        if (!restingRef.current[index]) return
        setRestElapsed((prev) => {
            restAnchorsRef.current[index] = wallAnchorFromElapsed(prev[index] ?? 0)
            return prev
        })
    }, [focusedIndex])

    const completedCount = completed.filter(Boolean).length
    const runningCount = exerciseRunning.filter(Boolean).length
    const restingCount = resting.filter(Boolean).length
    const allCompleted = exerciseCount > 0 && completedCount === exerciseCount
    const focusedResting = resting[focusedIndex] ?? false

    /** Fin de descanso por ejercicio → aviso + completado. */
    useEffect(() => {
        resting.forEach((isRest, index) => {
            if (!isRest) {
                restEndHandledRef.current[index] = false
                return
            }
            const target = restTargetSeconds[index] ?? defaultRestSeconds
            const elapsed = restElapsed[index] ?? 0
            if (elapsed < target) return
            if (restEndHandledRef.current[index]) return

            restEndHandledRef.current[index] = true
            playTimerAlarm()
            finishRestAsCompleted(index)
        })
    }, [
        resting,
        restElapsed,
        restTargetSeconds,
        defaultRestSeconds,
        finishRestAsCompleted,
    ])

    /** Tiempo de ejercicio agotado → entra en descanso (sin marcar completado aún). */
    useEffect(() => {
        exerciseDurations.forEach((duration, index) => {
            if (duration == null) return
            if (!exerciseRunning[index]) return
            if (resting[index] || completed[index]) return
            if (exerciseElapsed[index]! < duration) return
            if (exerciseAlarmFired[index]) return

            setExerciseAlarmFired((prev) => {
                if (prev[index]) return prev
                const next = [...prev]
                next[index] = true
                return next
            })
            playTimerAlarm()
            startRestForExercise(index, defaultRestSeconds)
        })
    }, [
        exerciseDurations,
        exerciseElapsed,
        exerciseRunning,
        resting,
        completed,
        exerciseAlarmFired,
        defaultRestSeconds,
        startRestForExercise,
    ])

    return {
        focusedIndex,
        focusExercise,
        sessionSeconds,
        exerciseElapsed,
        exerciseRunning,
        resting,
        restElapsed,
        restTargetSeconds,
        focusedResting,
        completed,
        exerciseAlarmFired,
        completedCount,
        runningCount,
        restingCount,
        allCompleted,
        playExercise,
        pauseExercise,
        toggleExercise,
        resetExerciseTimer,
        completeExercise,
        repeatExercise,
        startRest,
        skipRest,
        addRestTime,
        pauseRest,
        resumeRest,
    }
}
