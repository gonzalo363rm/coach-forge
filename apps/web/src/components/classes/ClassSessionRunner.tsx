"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState, type MouseEvent } from "react"
import {
    IoCheckmark,
    IoEyeOutline,
    IoPause,
    IoPlay,
    IoRefresh,
} from "react-icons/io5"

import { ClassExercisePreviewModal } from "./ClassExercisePreviewModal"
import {
    DEFAULT_REST_SECONDS,
    REST_INCREMENT_SECONDS,
    type ClassSessionData,
    type ClassSessionExercise,
} from "./class-session"
import {
    CircularCountdownTimer,
    type TimerVisualVariant,
} from "@/components/ui/CircularCountdownTimer"
import { useClassSessionTimer } from "@/hooks/useClassSessionTimer"
import {
    formatClock,
    formatEstimatedMinutes,
    formatMmSs,
} from "@/utils/format-duration"

type Props = {
    session: ClassSessionData
}

const iconBtn =
    "inline-flex size-9 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"

const PREVIEW_PLACEHOLDER = "/exercises/placeholder-preview.svg"

function exerciseTimerVariant(
    isRunning: boolean,
    isCompleted: boolean,
    isPaused: boolean,
): TimerVisualVariant {
    if (isRunning) return "running"
    if (isCompleted) return "completed"
    if (isPaused) return "paused"
    return "idle"
}

const elapsedTimerText: Record<TimerVisualVariant, string> = {
    running: "text-emerald-400",
    paused: "text-amber-400",
    completed: "text-emerald-500",
    idle: "text-zinc-400",
    rest: "text-sky-400",
}

export function ClassSessionRunner({ session }: Props) {
    const { exercises, title, sportName, difficulty, estimatedTotalSeconds, description } = session
    console.log(session)
    const timer = useClassSessionTimer({
        exerciseCount: exercises.length,
        exerciseDurations: exercises.map((ex) => ex.durationSeconds),
    })

    const isRestMode = timer.phase === "rest"

    const [previewExercise, setPreviewExercise] = useState<ClassSessionExercise | null>(
        null,
    )

    const subtitle = [sportName, `Dificultad ${difficulty}`].filter(Boolean).join(" · ")
    const focusedExercise = exercises[timer.focusedIndex]

    const focusedElapsed = timer.exerciseElapsed[timer.focusedIndex] ?? 0
    const focusedRunning = timer.exerciseRunning[timer.focusedIndex] ?? false
    const focusedCompleted = timer.completed[timer.focusedIndex] ?? false
    const focusedPaused =
        !focusedCompleted && !focusedRunning && focusedElapsed > 0
    const focusedVariant = exerciseTimerVariant(
        focusedRunning,
        focusedCompleted,
        focusedPaused,
    )

    const timerRing = useMemo(() => {
        if (timer.phase === "rest" && timer.restRunning) {
            return {
                kind: "countdown" as const,
                durationSeconds: timer.restTargetSeconds,
                elapsedSeconds: timer.restSeconds,
                label: "descanso",
                variant: "rest" as const,
            }
        }
        const duration = focusedExercise?.durationSeconds
        if (duration != null) {
            return {
                kind: "countdown" as const,
                durationSeconds: duration,
                elapsedSeconds: focusedElapsed,
                label: focusedCompleted
                    ? "completado"
                    : "tiempo restante",
                variant: focusedVariant,
            }
        }
        return {
            kind: "elapsed" as const,
            elapsedSeconds: focusedElapsed,
            label: focusedCompleted ? "completado" : "transcurrido",
            variant: focusedVariant,
        }
    }, [
        timer.phase,
        timer.restRunning,
        timer.restTargetSeconds,
        timer.restSeconds,
        focusedElapsed,
        focusedCompleted,
        focusedVariant,
        focusedExercise?.durationSeconds,
    ])

    const progressLabel = useMemo(() => {
        if (timer.allCompleted) {
            return `${exercises.length} / ${exercises.length} ejercicios`
        }
        const parts: string[] = []
        if (timer.runningCount > 0) {
            parts.push(
                `${timer.runningCount} en curso`,
            )
        }
        parts.push(`${timer.completedCount} / ${exercises.length} completados`)
        return parts.join(" · ")
    }, [
        timer.allCompleted,
        timer.runningCount,
        timer.completedCount,
        exercises.length,
    ])

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4">
                <Link
                    href="/classes/mine"
                    className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
                >
                    ← Clases
                </Link>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                            Clase en curso
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                            {title}
                        </h1>
                        {subtitle ? (
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                {subtitle}
                            </p>
                        ) : null}
                        {description ? (
                            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                {description}
                            </p>
                        ) : null}
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Duración total de los ejercicios:{" "}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {formatEstimatedMinutes(estimatedTotalSeconds)}
                            </span>
                            <span className="mx-2 text-zinc-400">·</span>
                            <span className="font-mono tabular-nums">
                                ⏱ {formatClock(timer.sessionSeconds)}
                            </span>
                        </p>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <span className="tabular-nums">{progressLabel}</span>
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-center gap-3 sm:items-end lg:items-end">
                        {timerRing.kind === "countdown" ? (
                            <CircularCountdownTimer
                                durationSeconds={timerRing.durationSeconds}
                                elapsedSeconds={timerRing.elapsedSeconds}
                                label={timerRing.label}
                                variant={timerRing.variant}
                            />
                        ) : (
                            <div className="flex size-[168px] flex-col items-center justify-center rounded-full bg-zinc-800 text-center dark:bg-zinc-900">
                                <span className="text-[10px] lowercase text-zinc-400">
                                    {timerRing.label}
                                </span>
                                <span
                                    className={`mt-1 font-mono text-3xl font-extralight tabular-nums ${elapsedTimerText[timerRing.variant]}`}
                                >
                                    {formatMmSs(timerRing.elapsedSeconds)}
                                </span>
                                {focusedExercise ? (
                                    <span className="mt-1 max-w-[140px] truncate px-2 text-[10px] text-zinc-500">
                                        {focusedExercise.title}
                                    </span>
                                ) : null}
                            </div>
                        )}

                        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
                            <button
                                type="button"
                                onClick={() => timer.startRest(DEFAULT_REST_SECONDS)}
                                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            >
                                Descanso (1 min)
                            </button>
                            {timer.phase === "rest" ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            timer.addRestTime(REST_INCREMENT_SECONDS)
                                        }
                                        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                                    >
                                        +1 min
                                    </button>
                                    <button
                                        type="button"
                                        onClick={timer.skipRest}
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                                    >
                                        Saltar descanso
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            </header>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            <ul className="flex flex-col gap-6">
                {exercises.map((exercise, index) => (
                    <ExerciseSessionCard
                        key={exercise.key}
                        index={index}
                        exercise={exercise}
                        isFocused={!isRestMode && timer.focusedIndex === index}
                        isRunning={timer.exerciseRunning[index] ?? false}
                        isCompleted={timer.completed[index] ?? false}
                        elapsedSeconds={timer.exerciseElapsed[index] ?? 0}
                        onTogglePlay={() => timer.toggleExercise(index)}
                        onFocus={() => timer.focusExercise(index)}
                        onOpenPreview={() => {
                            timer.focusExercise(index)
                            setPreviewExercise(exercise)
                        }}
                        onReset={() => timer.resetExerciseTimer(index)}
                        onComplete={() => timer.completeExercise(index)}
                        onRepeat={() => timer.repeatExercise(index)}
                    />
                ))}
            </ul>

            {timer.allCompleted ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                    ¡Clase completada!
                </p>
            ) : null}

            <ClassExercisePreviewModal
                open={previewExercise != null}
                onClose={() => setPreviewExercise(null)}
                exercise={
                    previewExercise
                        ? {
                              id: previewExercise.exerciseId,
                              title: previewExercise.title,
                              previewUrl: previewExercise.previewUrl,
                          }
                        : null
                }
            />
        </div>
    )
}

function ExerciseControls({
    isCompleted,
    isRunning,
    onTogglePlay,
    onReset,
    onComplete,
    onRepeat,
}: {
    isCompleted: boolean
    isRunning: boolean
    onTogglePlay: () => void
    onReset: () => void
    onComplete: () => void
    onRepeat: () => void
}) {
    if (isCompleted) {
        return (
            <button
                type="button"
                onClick={onRepeat}
                className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
                Repetir
            </button>
        )
    }
    return (
        <div className="flex shrink-0 items-center gap-1">
            <button
                type="button"
                onClick={onTogglePlay}
                className={iconBtn}
                aria-label={isRunning ? "Pausar" : "Iniciar"}
            >
                {isRunning ? <IoPause size={18} /> : <IoPlay size={18} />}
            </button>
            <button
                type="button"
                onClick={onReset}
                className={iconBtn}
                aria-label="Reiniciar cronómetro"
            >
                <IoRefresh size={18} />
            </button>
            <button
                type="button"
                onClick={onComplete}
                className={`${iconBtn} border-emerald-500 text-emerald-700 dark:border-emerald-600 dark:text-emerald-400`}
                aria-label="Marcar completado"
            >
                <IoCheckmark size={20} />
            </button>
        </div>
    )
}

function exerciseCardStyles(
    isRunning: boolean,
    isPaused: boolean,
    isCompleted: boolean,
): string {
    if (isRunning) {
        return "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
    }
    if (isPaused) {
        return "border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/25"
    }
    if (isCompleted) {
        return "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/15"
    }
    return "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
}

function ExerciseSessionCard({
    index,
    exercise,
    isFocused,
    isRunning,
    isCompleted,
    elapsedSeconds,
    onTogglePlay,
    onFocus,
    onReset,
    onComplete,
    onRepeat,
    onOpenPreview,
}: {
    index: number
    exercise: ClassSessionExercise
    isFocused: boolean
    isRunning: boolean
    isCompleted: boolean
    elapsedSeconds: number
    onTogglePlay: () => void
    onFocus: () => void
    onReset: () => void
    onComplete: () => void
    onRepeat: () => void
    onOpenPreview: () => void
}) {
    const hasTimer = exercise.durationSeconds != null
    const target = exercise.durationSeconds ?? 0
    const isPaused = !isCompleted && !isRunning && elapsedSeconds > 0
    const [previewSrc, setPreviewSrc] = useState(exercise.previewUrl)

    useEffect(() => {
        setPreviewSrc(exercise.previewUrl)
    }, [exercise.previewUrl])

    const handleCardClick = () => onFocus()
    const stopCard = (e: MouseEvent) => e.stopPropagation()

    return (
        <li
            role="button"
            tabIndex={0}
            onClick={handleCardClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onFocus()
                }
            }}
            className={`cursor-pointer rounded-xl border px-4 py-4 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${exerciseCardStyles(isRunning, isPaused, isCompleted)} ${
                isFocused ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 " : ""
            }${
                isFocused
                    ? isRunning
                        ? "ring-emerald-400"
                        : isPaused
                          ? "ring-amber-400"
                          : isCompleted
                            ? "ring-emerald-500/70"
                            : "ring-zinc-300 dark:ring-zinc-600"
                    : ""
            }`}
        >
            <div className="flex gap-3 sm:gap-4">
                <button
                    type="button"
                    onClick={(e) => {
                        stopCard(e)
                        onOpenPreview()
                    }}
                    className="group shrink-0 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    aria-label={`Ver ejercicio ${exercise.title}`}
                >
                    <span className="relative block h-16 w-24 overflow-hidden rounded-lg border border-zinc-200 transition-opacity group-hover:opacity-90 dark:border-zinc-700 sm:h-20 sm:w-28">
                        <Image
                            src={previewSrc}
                            alt={`Vista previa de ${exercise.title}`}
                            fill
                            sizes="(max-width: 640px) 96px, 112px"
                            quality={90}
                            unoptimized={previewSrc.endsWith(".svg")}
                            className="object-cover"
                            onError={() => setPreviewSrc(PREVIEW_PLACEHOLDER)}
                        />
                    </span>
                </button>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h2 className="min-w-0 text-base font-semibold leading-snug text-zinc-900 sm:text-lg dark:text-white">
                            <span className="text-zinc-500 dark:text-zinc-400">
                                #{index + 1}{" "}
                            </span>
                            {exercise.title}
                            {isRunning ? (
                                <span className="ml-2 inline-flex items-center rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    En curso
                                </span>
                            ) : isPaused ? (
                                <span className="ml-2 inline-flex items-center rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    Pausado
                                </span>
                            ) : isCompleted ? (
                                <span className="ml-2 inline-flex items-center rounded bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    Completado
                                </span>
                            ) : null}
                        </h2>
                        {!isCompleted ? (
                            <div onClick={stopCard}>
                                <ExerciseControls
                                    isCompleted={isCompleted}
                                    isRunning={isRunning}
                                    onTogglePlay={onTogglePlay}
                                    onReset={onReset}
                                    onComplete={onComplete}
                                    onRepeat={onRepeat}
                                />
                            </div>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            stopCard(e)
                            onOpenPreview()
                        }}
                        className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                        <IoEyeOutline size={14} />
                        Ver orden del ejercicio
                    </button>

                    {isCompleted ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                ✔ Completado
                            </p>
                            <button
                                type="button"
                                onClick={(e) => {
                                    stopCard(e)
                                    onRepeat()
                                }}
                                className="cursor-pointer text-xs font-medium text-zinc-600 underline hover:text-white dark:text-zinc-400"
                            >
                                Repetir ejercicio
                            </button>
                        </div>
                    ) : hasTimer ? (
                        <p className="mt-2 font-mono text-xs tabular-nums text-zinc-600 sm:text-sm dark:text-zinc-400">
                            {elapsedSeconds > 0 || isRunning
                                ? `${formatMmSs(elapsedSeconds)} transcurrido · ${formatMmSs(target)} total`
                                : formatMmSs(target)}
                        </p>
                    ) : (
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Opcional — sin tiempo límite
                        </p>
                    )}
                </div>
            </div>
        </li>
    )
}
