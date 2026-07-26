"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { DEFAULT_REST_SECONDS } from "@/components/classes/class-session"
import { playTimerAlarm } from "@/utils/play-timer-alarm"

export type SessionPhase = "exercise" | "rest"

type Options = {
    exerciseCount: number
    exerciseDurations: (number | null)[]
    defaultRestSeconds?: number
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

/** Ancla: `Date.now() - elapsedSec * 1000` para leer segundos con reloj de pared. */
function wallAnchorFromElapsed(elapsedSec: number, now = Date.now()): number {
    return now - elapsedSec * 1000
}

function elapsedFromWallAnchor(anchorMs: number, now = Date.now()): number {
    return Math.max(0, Math.floor((now - anchorMs) / 1000))
}

export function useClassSessionTimer({
    exerciseCount,
    exerciseDurations,
    defaultRestSeconds = DEFAULT_REST_SECONDS,
}: Options) {
    const [focusedIndex, setFocusedIndex] = useState(0)
    const [phase, setPhase] = useState<SessionPhase>("exercise")
    const [sessionSeconds, setSessionSeconds] = useState(0)
    const [exerciseElapsed, setExerciseElapsed] = useState<number[]>(() =>
        emptyNumArray(exerciseCount),
    )
    const [exerciseRunning, setExerciseRunning] = useState<boolean[]>(() =>
        emptyBoolArray(exerciseCount),
    )
    const [restSeconds, setRestSeconds] = useState(0)
    const [restTargetSeconds, setRestTargetSeconds] = useState(defaultRestSeconds)
    const [restRunning, setRestRunning] = useState(false)
    const [completed, setCompleted] = useState<boolean[]>(() =>
        emptyBoolArray(exerciseCount),
    )

    const phaseRef = useRef(phase)
    const exerciseRunningRef = useRef(exerciseRunning)
    const restRunningRef = useRef(restRunning)
    const sessionSecondsRef = useRef(sessionSeconds)
    const restEndHandledRef = useRef(false)
    const exerciseAlarmFiredRef = useRef(emptyBoolArray(exerciseCount))

    /** Anclas de pared: null = pausado / no activo. */
    const sessionAnchorRef = useRef<number | null>(null)
    const restAnchorRef = useRef<number | null>(null)
    const exerciseAnchorsRef = useRef<(number | null)[]>(
        emptyNullableNumArray(exerciseCount),
    )

    phaseRef.current = phase
    exerciseRunningRef.current = exerciseRunning
    restRunningRef.current = restRunning
    sessionSecondsRef.current = sessionSeconds

    /** Extiende arrays/refs cuando se añaden ejercicios en vivo. */
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
        setCompleted((prev) => pad(prev, false))

        if (exerciseAnchorsRef.current.length < exerciseCount) {
            exerciseAnchorsRef.current = [
                ...exerciseAnchorsRef.current,
                ...emptyNullableNumArray(exerciseCount - exerciseAnchorsRef.current.length),
            ]
        }
        if (exerciseAlarmFiredRef.current.length < exerciseCount) {
            exerciseAlarmFiredRef.current = [
                ...exerciseAlarmFiredRef.current,
                ...emptyBoolArray(exerciseCount - exerciseAlarmFiredRef.current.length),
            ]
        }
    }, [exerciseCount])

    const anyExerciseRunning = exerciseRunning.some(Boolean)
    const clockActive = restRunning || anyExerciseRunning

    const syncFromWallClock = useCallback(() => {
        const now = Date.now()

        if (sessionAnchorRef.current != null) {
            const next = elapsedFromWallAnchor(sessionAnchorRef.current, now)
            sessionSecondsRef.current = next
            setSessionSeconds(next)
        }

        if (restRunningRef.current && restAnchorRef.current != null) {
            setRestSeconds(elapsedFromWallAnchor(restAnchorRef.current, now))
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

    const pauseAllExercises = useCallback(() => {
        const now = Date.now()
        setExerciseElapsed((prev) =>
            prev.map((sec, i) => {
                const anchor = exerciseAnchorsRef.current[i]
                if (!exerciseRunningRef.current[i] || anchor == null) return sec
                return elapsedFromWallAnchor(anchor, now)
            }),
        )
        exerciseAnchorsRef.current = emptyNullableNumArray(exerciseCount)
        setExerciseRunning(emptyBoolArray(exerciseCount))
    }, [exerciseCount])

    const playExercise = useCallback(
        (index: number) => {
            if (completed[index]) return
            setPhase("exercise")
            if (restRunningRef.current && restAnchorRef.current != null) {
                setRestSeconds(elapsedFromWallAnchor(restAnchorRef.current))
            }
            restAnchorRef.current = null
            setRestRunning(false)
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
        [completed],
    )

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
        setFocusedIndex(index)
    }, [])

    const focusExercise = useCallback((index: number) => {
        setFocusedIndex(index)
        setPhase("exercise")
        if (restRunningRef.current && restAnchorRef.current != null) {
            setRestSeconds(elapsedFromWallAnchor(restAnchorRef.current))
        }
        restAnchorRef.current = null
        setRestRunning(false)
    }, [])

    const toggleExercise = useCallback(
        (index: number) => {
            if (completed[index]) return
            if (exerciseRunning[index]) {
                pauseExercise(index)
            } else {
                playExercise(index)
            }
        },
        [completed, exerciseRunning, pauseExercise, playExercise],
    )

    const resetExerciseTimer = useCallback((index: number) => {
        exerciseAlarmFiredRef.current[index] = false
        exerciseAnchorsRef.current[index] = exerciseRunningRef.current[index]
            ? wallAnchorFromElapsed(0)
            : null
        setExerciseElapsed((prev) => {
            const next = [...prev]
            next[index] = 0
            return next
        })
    }, [])

    const findNextIncomplete = useCallback(
        (fromIndex: number, done: boolean[]) => {
            for (let i = fromIndex; i < exerciseCount; i++) {
                if (!done[i]) return i
            }
            for (let i = 0; i < fromIndex; i++) {
                if (!done[i]) return i
            }
            return null
        },
        [exerciseCount],
    )

    const startRest = useCallback(
        (seconds: number = defaultRestSeconds) => {
            pauseAllExercises()
            restEndHandledRef.current = false
            setPhase("rest")
            setRestSeconds(0)
            setRestTargetSeconds(seconds)
            restAnchorRef.current = wallAnchorFromElapsed(0)
            setRestRunning(true)
        },
        [defaultRestSeconds, pauseAllExercises],
    )

    const completeExercise = useCallback(
        (index: number) => {
            pauseExercise(index)
            setCompleted((prev) => {
                const nextDone = [...prev]
                nextDone[index] = true
                const hasRemaining = nextDone.some((d) => !d)
                if (hasRemaining && index < exerciseCount - 1) {
                    window.setTimeout(() => startRest(defaultRestSeconds), 0)
                }
                return nextDone
            })
        },
        [exerciseCount, defaultRestSeconds, pauseExercise, startRest],
    )

    const repeatExercise = useCallback(
        (index: number) => {
            exerciseAlarmFiredRef.current[index] = false
            setCompleted((prev) => {
                const next = [...prev]
                next[index] = false
                return next
            })
            resetExerciseTimer(index)
            setFocusedIndex(index)
            setPhase("exercise")
            restAnchorRef.current = null
            setRestRunning(false)
        },
        [resetExerciseTimer],
    )

    const addRestTime = useCallback(
        (seconds: number) => {
            pauseAllExercises()
            restEndHandledRef.current = false
            setPhase("rest")
            const currentRest =
                restRunningRef.current && restAnchorRef.current != null
                    ? elapsedFromWallAnchor(restAnchorRef.current)
                    : restSeconds
            setRestSeconds(currentRest)
            setRestTargetSeconds((t) => Math.max(currentRest, t) + seconds)
            restAnchorRef.current = wallAnchorFromElapsed(currentRest)
            setRestRunning(true)
        },
        [pauseAllExercises, restSeconds],
    )

    const completedCount = completed.filter(Boolean).length
    const runningCount = exerciseRunning.filter(Boolean).length
    const allCompleted = exerciseCount > 0 && completedCount === exerciseCount

    const skipRest = useCallback(() => {
        if (restAnchorRef.current != null) {
            setRestSeconds(elapsedFromWallAnchor(restAnchorRef.current))
        }
        restAnchorRef.current = null
        setRestRunning(false)
        setRestSeconds(0)
        setPhase("exercise")
        setCompleted((done) => {
            const next = findNextIncomplete(focusedIndex + 1, done)
            if (next != null) setFocusedIndex(next)
            return done
        })
    }, [focusedIndex, findNextIncomplete])

    const pauseRest = useCallback(() => {
        if (restAnchorRef.current != null) {
            setRestSeconds(elapsedFromWallAnchor(restAnchorRef.current))
            restAnchorRef.current = null
        }
        setRestRunning(false)
    }, [])

    const resumeRest = useCallback(() => {
        pauseAllExercises()
        setPhase("rest")
        setRestSeconds((prev) => {
            restAnchorRef.current = wallAnchorFromElapsed(prev)
            return prev
        })
        setRestRunning(true)
    }, [pauseAllExercises])

    useEffect(() => {
        if (phase !== "rest" || !restRunning) {
            restEndHandledRef.current = false
            return
        }
        if (restSeconds >= restTargetSeconds && !restEndHandledRef.current) {
            restEndHandledRef.current = true
            playTimerAlarm()
            skipRest()
        }
    }, [phase, restRunning, restSeconds, restTargetSeconds, skipRest])

    useEffect(() => {
        exerciseDurations.forEach((duration, index) => {
            if (duration == null) return
            if (!exerciseRunning[index]) return
            if (exerciseElapsed[index] < duration) return
            if (exerciseAlarmFiredRef.current[index]) return

            exerciseAlarmFiredRef.current[index] = true
            pauseExercise(index)
            playTimerAlarm()
        })
    }, [exerciseDurations, exerciseElapsed, exerciseRunning, pauseExercise])

    return {
        focusedIndex,
        focusExercise,
        phase,
        sessionSeconds,
        exerciseElapsed,
        exerciseRunning,
        restSeconds,
        restTargetSeconds,
        restRunning,
        completed,
        completedCount,
        runningCount,
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
