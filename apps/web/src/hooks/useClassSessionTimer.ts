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
    const restEndHandledRef = useRef(false)
    const exerciseAlarmFiredRef = useRef(emptyBoolArray(exerciseCount))
    phaseRef.current = phase
    exerciseRunningRef.current = exerciseRunning
    restRunningRef.current = restRunning

    const anyExerciseRunning = exerciseRunning.some(Boolean)
    const clockActive = restRunning || anyExerciseRunning

    useEffect(() => {
        if (!clockActive) return
        const id = window.setInterval(() => {
            setSessionSeconds((s) => s + 1)
            if (phaseRef.current === "rest" && restRunningRef.current) {
                setRestSeconds((r) => r + 1)
            }
            if (exerciseRunningRef.current.some(Boolean)) {
                setExerciseElapsed((prev) =>
                    prev.map((sec, i) =>
                        exerciseRunningRef.current[i] ? sec + 1 : sec,
                    ),
                )
            }
        }, 1000)
        return () => window.clearInterval(id)
    }, [clockActive])

    const pauseAllExercises = useCallback(() => {
        setExerciseRunning(emptyBoolArray(exerciseCount))
    }, [exerciseCount])

    const playExercise = useCallback(
        (index: number) => {
            if (completed[index]) return
            setPhase("exercise")
            setRestRunning(false)
            setFocusedIndex(index)
            setExerciseRunning((prev) => {
                const next = [...prev]
                next[index] = true
                return next
            })
        },
        [completed],
    )

    const pauseExercise = useCallback((index: number) => {
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
            setRestRunning(false)
        },
        [resetExerciseTimer],
    )

    const addRestTime = useCallback((seconds: number) => {
        pauseAllExercises()
        restEndHandledRef.current = false
        setPhase("rest")
        setRestTargetSeconds((t) => Math.max(restSeconds, t) + seconds)
        setRestRunning(true)
    }, [pauseAllExercises, restSeconds])

    const completedCount = completed.filter(Boolean).length
    const runningCount = exerciseRunning.filter(Boolean).length
    const allCompleted = exerciseCount > 0 && completedCount === exerciseCount

    const skipRest = useCallback(() => {
        setRestRunning(false)
        setRestSeconds(0)
        setPhase("exercise")
        setCompleted((done) => {
            const next = findNextIncomplete(focusedIndex + 1, done)
            if (next != null) setFocusedIndex(next)
            return done
        })
    }, [focusedIndex, findNextIncomplete])

    const pauseRest = useCallback(() => setRestRunning(false), [])
    const resumeRest = useCallback(() => {
        pauseAllExercises()
        setPhase("rest")
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
