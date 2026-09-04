"use client"

import Image from "next/image"
import Link from "next/link"
import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    useTransition,
    type MouseEvent,
} from "react"
import {
    IoCheckmark,
    IoEyeOutline,
    IoPause,
    IoPlay,
    IoRefresh,
} from "react-icons/io5"
import type { Sport } from "@prisma/client"

import { updateTrainingClassAction } from "@/app/actions/classes"
import { Button, ButtonLink } from "@/components/ui/button"
import { FormActions } from "@/components/ui/FormActions"
import { useToast } from "@/hooks/use-toast"
import type { ExerciseListItem } from "@/services/exercises.service"
import {
    buildClassSessionSnapshot,
    hydrateTimerFromSnapshot,
    useClassSessionStore,
} from "@/stores/class-session.store"

import { AddExerciseModal } from "./AddExerciseModal"
import { ClassExercisePreviewModal } from "./ClassExercisePreviewModal"
import {
    DEFAULT_REST_SECONDS,
    REST_INCREMENT_SECONDS,
    computeEstimatedTotalSeconds,
    type ClassSessionData,
    type ClassSessionExercise,
} from "./class-session"
import {
    CircularCountdownTimer,
    type TimerVisualVariant,
} from "@/components/ui/CircularCountdownTimer"
import { useClassSessionTimer } from "@/hooks/useClassSessionTimer"
import { useScreenWakeLock } from "@/hooks/use-screen-wake-lock"
import {
    formatClock,
    formatEstimatedMinutes,
    formatMmSs,
} from "@/utils/format-duration"

type Props = {
    session: ClassSessionData
    canManage: boolean
    sports: Sport[]
    userId: string | null
}

const iconBtn =
    "inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-800 transition-colors hover:bg-zinc-50 disabled:cursor-default disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"

const PREVIEW_PLACEHOLDER = "/exercises/placeholder-preview.svg"

function exerciseTimerVariant(
    isRunning: boolean,
    isResting: boolean,
    isCompleted: boolean,
    isPaused: boolean,
): TimerVisualVariant {
    if (isResting) return "rest"
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

export function ClassSessionRunner(props: Props) {
    const [persistReady, setPersistReady] = useState(
        () => !props.userId || useClassSessionStore.persist.hasHydrated(),
    )

    useEffect(() => {
        if (!props.userId) {
            setPersistReady(true)
            return
        }
        if (useClassSessionStore.persist.hasHydrated()) {
            setPersistReady(true)
            return
        }
        return useClassSessionStore.persist.onFinishHydration(() => {
            setPersistReady(true)
        })
    }, [props.userId])

    if (!persistReady) {
        return (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Restaurando sesión…
            </p>
        )
    }

    return <ClassSessionRunnerInner {...props} />
}

function ClassSessionRunnerInner({ session, canManage, sports, userId }: Props) {
    const { toast } = useToast()
    const templateWarnTitleId = useId()
    const saveSnapshot = useClassSessionStore((s) => s.saveSnapshot)
    const [exercises, setExercises] = useState(session.exercises)
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [templateWarnOpen, setTemplateWarnOpen] = useState(false)
    const [addError, setAddError] = useState<string | null>(null)
    const [pendingAdd, startAddTransition] = useTransition()
    const persistLatestRef = useRef<() => void>(() => {})

    const {
        title,
        sportName,
        difficulty,
        description,
        classId,
        sportId,
        visibility,
    } = session

    const [timerInitial] = useState(() => {
        if (!userId) return null
        const snapshot = useClassSessionStore.getState().getSnapshot(userId, classId)
        return hydrateTimerFromSnapshot(
            snapshot,
            session.exercises.map((ex) => ex.exerciseId),
            DEFAULT_REST_SECONDS,
        )
    })

    const estimatedTotalSeconds = useMemo(
        () => computeEstimatedTotalSeconds(exercises),
        [exercises],
    )

    const timer = useClassSessionTimer({
        exerciseCount: exercises.length,
        exerciseDurations: exercises.map((ex) => ex.durationSeconds),
        initialState: timerInitial,
    })

    const isRestMode = timer.focusedResting
    const keepScreenAwake = timer.runningCount > 0 || timer.restingCount > 0
    useScreenWakeLock(keepScreenAwake)

    const [previewExercise, setPreviewExercise] = useState<ClassSessionExercise | null>(
        null,
    )

    const templateHref = `/classes/new?from=${encodeURIComponent(classId)}&returnTo=${encodeURIComponent(`/classes/${classId}/start`)}`

    const subtitle = [sportName, `Dificultad ${difficulty}`].filter(Boolean).join(" · ")
    const focusedExercise = exercises[timer.focusedIndex]

    const focusedElapsed = timer.exerciseElapsed[timer.focusedIndex] ?? 0
    const focusedRunning = timer.exerciseRunning[timer.focusedIndex] ?? false
    const focusedResting = timer.resting[timer.focusedIndex] ?? false
    const focusedRestElapsed = timer.restElapsed[timer.focusedIndex] ?? 0
    const focusedRestTarget =
        timer.restTargetSeconds[timer.focusedIndex] ?? DEFAULT_REST_SECONDS
    const focusedCompleted = timer.completed[timer.focusedIndex] ?? false
    const focusedPaused =
        !focusedCompleted &&
        !focusedRunning &&
        !focusedResting &&
        focusedElapsed > 0
    const focusedVariant = exerciseTimerVariant(
        focusedRunning,
        focusedResting,
        focusedCompleted,
        focusedPaused,
    )

    useEffect(() => {
        if (!userId) return

        const persistNow = () => {
            saveSnapshot(
                buildClassSessionSnapshot({
                    userId,
                    classId,
                    exerciseIds: exercises.map((ex) => ex.exerciseId),
                    focusedIndex: timer.focusedIndex,
                    sessionSeconds: timer.sessionSeconds,
                    exerciseElapsed: timer.exerciseElapsed,
                    exerciseRunning: timer.exerciseRunning,
                    resting: timer.resting,
                    restElapsed: timer.restElapsed,
                    restTargetSeconds: timer.restTargetSeconds,
                    completed: timer.completed,
                    exerciseAlarmFired: timer.exerciseAlarmFired,
                }),
            )
        }

        persistLatestRef.current = persistNow
        const handle = window.setTimeout(persistNow, 400)
        return () => window.clearTimeout(handle)
    }, [
        userId,
        classId,
        exercises,
        saveSnapshot,
        timer.focusedIndex,
        timer.sessionSeconds,
        timer.exerciseElapsed,
        timer.exerciseRunning,
        timer.resting,
        timer.restElapsed,
        timer.restTargetSeconds,
        timer.completed,
        timer.exerciseAlarmFired,
    ])

    useEffect(() => {
        return () => {
            persistLatestRef.current()
        }
    }, [])

    const timerRing = useMemo(() => {
        if (focusedResting) {
            return {
                kind: "countdown" as const,
                durationSeconds: focusedRestTarget,
                elapsedSeconds: focusedRestElapsed,
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
        focusedResting,
        focusedRestTarget,
        focusedRestElapsed,
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
            parts.push(`${timer.runningCount} en curso`)
        }
        if (timer.restingCount > 0) {
            parts.push(`${timer.restingCount} en descanso`)
        }
        parts.push(`${timer.completedCount} / ${exercises.length} completados`)
        return parts.join(" · ")
    }, [
        timer.allCompleted,
        timer.runningCount,
        timer.restingCount,
        timer.completedCount,
        exercises.length,
    ])

    useEffect(() => {
        if (!templateWarnOpen) return
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setTemplateWarnOpen(false)
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [templateWarnOpen])

    function handleAddClick() {
        setAddError(null)
        if (canManage) {
            setAddModalOpen(true)
            return
        }
        setTemplateWarnOpen(true)
    }

    function handleAddExercise(
        exercise: ExerciseListItem,
        config: { durationMinutes: number | null; isOptional: boolean },
    ) {
        if (exercises.some((item) => item.exerciseId === exercise.id)) {
            toast({
                type: "error",
                title: "Ejercicio ya incluido",
                message: "Ese ejercicio ya está en esta clase.",
            })
            return
        }

        const newExercise: ClassSessionExercise = {
            key: `local-${exercise.id}-${Date.now()}`,
            exerciseId: exercise.id,
            title: exercise.title,
            previewUrl: exercise.previewUrl,
            durationSeconds: config.isOptional
                ? null
                : Math.max(60, (config.durationMinutes ?? 5) * 60),
            isOptional: config.isOptional,
        }

        const previous = exercises
        const nextExercises = [...exercises, newExercise]
        setExercises(nextExercises)
        setAddModalOpen(false)
        setAddError(null)

        startAddTransition(async () => {
            const result = await updateTrainingClassAction({
                id: classId,
                title,
                description,
                sportId,
                difficulty,
                visibility,
                items: nextExercises.map((item, idx) => ({
                    exerciseId: item.exerciseId,
                    sortOrder: idx,
                    durationMinutes: item.isOptional
                        ? null
                        : Math.max(1, Math.round((item.durationSeconds ?? 300) / 60)),
                    isOptional: item.isOptional,
                })),
            })

            if (!result.ok) {
                setExercises(previous)
                setAddError(result.error)
                toast({
                    type: "error",
                    title: "No se pudo añadir el ejercicio",
                    message: result.error,
                })
                return
            }

            toast({
                type: "success",
                title: "Ejercicio añadido",
                message: `«${exercise.title}» se agregó a la clase.`,
            })
        })
    }

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
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={focusedCompleted}
                                onClick={() => timer.startRest(DEFAULT_REST_SECONDS)}
                            >
                                Descanso (1 min)
                            </Button>
                            {isRestMode ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                            timer.addRestTime(REST_INCREMENT_SECONDS)
                                        }
                                    >
                                        +1 min
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={() => timer.skipRest(timer.focusedIndex)}
                                    >
                                        Saltar descanso
                                    </Button>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            </header>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    Ejercicios
                </h2>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={pendingAdd}
                    onClick={handleAddClick}
                >
                    Añadir ejercicio
                </Button>
            </div>

            {addError ? (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                    {addError}
                </p>
            ) : null}

            <ul className="flex flex-col gap-6">
                {exercises.map((exercise, index) => (
                    <ExerciseSessionCard
                        key={exercise.key}
                        index={index}
                        exercise={exercise}
                        isFocused={timer.focusedIndex === index}
                        isRunning={timer.exerciseRunning[index] ?? false}
                        isResting={timer.resting[index] ?? false}
                        isCompleted={timer.completed[index] ?? false}
                        elapsedSeconds={timer.exerciseElapsed[index] ?? 0}
                        restElapsedSeconds={timer.restElapsed[index] ?? 0}
                        restTargetSeconds={
                            timer.restTargetSeconds[index] ?? DEFAULT_REST_SECONDS
                        }
                        onTogglePlay={() => timer.toggleExercise(index)}
                        onFocus={() => timer.focusExercise(index)}
                        onOpenPreview={() => {
                            timer.focusExercise(index)
                            setPreviewExercise(exercise)
                        }}
                        onReset={() => timer.resetExerciseTimer(index)}
                        onComplete={() => timer.completeExercise(index)}
                        onRepeat={() => timer.repeatExercise(index)}
                        onSkipRest={() => timer.skipRest(index)}
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

            <AddExerciseModal
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                sports={sports}
                excludeExerciseIds={exercises.map((item) => item.exerciseId)}
                onAdd={handleAddExercise}
            />

            {templateWarnOpen ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-black/70"
                    role="presentation"
                    onPointerDown={(e) => {
                        if (e.target === e.currentTarget) setTemplateWarnOpen(false)
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={templateWarnTitleId}
                        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <h2
                            id={templateWarnTitleId}
                            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                        >
                            No podés editar esta clase
                        </h2>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Esta clase no es tuya, así que no se pueden agregar ejercicios
                            acá. Creá una clase nueva usando esta como plantilla y ahí sí
                            vas a poder modificarla.
                        </p>
                        <FormActions
                            className="mt-6"
                            onCancel={() => setTemplateWarnOpen(false)}
                            cancelLabel="Cerrar"
                            submit={
                                <ButtonLink href={templateHref} variant="primary">
                                    Usar como plantilla
                                </ButtonLink>
                            }
                        />
                    </div>
                </div>
            ) : null}
        </div>
    )
}

function ExerciseControls({
    isCompleted,
    isRunning,
    isResting,
    onTogglePlay,
    onReset,
    onComplete,
    onRepeat,
    onSkipRest,
}: {
    isCompleted: boolean
    isRunning: boolean
    isResting: boolean
    onTogglePlay: () => void
    onReset: () => void
    onComplete: () => void
    onRepeat: () => void
    onSkipRest: () => void
}) {
    if (isCompleted) {
        return (
            <button
                type="button"
                onClick={onRepeat}
                className="cursor-pointer rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
                Repetir
            </button>
        )
    }
    if (isResting) {
        return (
            <button
                type="button"
                onClick={onSkipRest}
                className="cursor-pointer rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-950/70"
            >
                Saltar descanso
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
                aria-label="Terminar y descansar"
            >
                <IoCheckmark size={20} />
            </button>
        </div>
    )
}

function exerciseCardStyles(
    isRunning: boolean,
    isResting: boolean,
    isPaused: boolean,
    isCompleted: boolean,
): string {
    if (isResting) {
        return "border-sky-300 bg-sky-50/60 dark:border-sky-800 dark:bg-sky-950/25"
    }
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
    isResting,
    isCompleted,
    elapsedSeconds,
    restElapsedSeconds,
    restTargetSeconds,
    onTogglePlay,
    onFocus,
    onReset,
    onComplete,
    onRepeat,
    onSkipRest,
    onOpenPreview,
}: {
    index: number
    exercise: ClassSessionExercise
    isFocused: boolean
    isRunning: boolean
    isResting: boolean
    isCompleted: boolean
    elapsedSeconds: number
    restElapsedSeconds: number
    restTargetSeconds: number
    onTogglePlay: () => void
    onFocus: () => void
    onReset: () => void
    onComplete: () => void
    onRepeat: () => void
    onSkipRest: () => void
    onOpenPreview: () => void
}) {
    const hasTimer = exercise.durationSeconds != null
    const target = exercise.durationSeconds ?? 0
    const isPaused =
        !isCompleted && !isRunning && !isResting && elapsedSeconds > 0
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
            className={`cursor-pointer rounded-xl border px-4 py-4 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-emerald-500/60 ${exerciseCardStyles(isRunning, isResting, isPaused, isCompleted)} ${
                isFocused ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 " : ""
            }${
                isFocused
                    ? isResting
                        ? "ring-sky-400"
                        : isRunning
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
                            {isResting ? (
                                <span className="ml-2 inline-flex items-center rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    Descanso
                                </span>
                            ) : isRunning ? (
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
                        <div onClick={stopCard}>
                            <ExerciseControls
                                isCompleted={isCompleted}
                                isRunning={isRunning}
                                isResting={isResting}
                                onTogglePlay={onTogglePlay}
                                onReset={onReset}
                                onComplete={onComplete}
                                onRepeat={onRepeat}
                                onSkipRest={onSkipRest}
                            />
                        </div>
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

                    {isResting ? (
                        <p className="mt-2 font-mono text-xs tabular-nums text-sky-700 sm:text-sm dark:text-sky-300">
                            Descanso {formatMmSs(restElapsedSeconds)} /{" "}
                            {formatMmSs(restTargetSeconds)}
                        </p>
                    ) : isCompleted ? (
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
