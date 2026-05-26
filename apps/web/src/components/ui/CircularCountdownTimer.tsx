"use client"

import { formatMmSs } from "@/utils/format-duration"

export type TimerVisualVariant = "running" | "paused" | "completed" | "idle" | "rest"

const variantStyles: Record<
    TimerVisualVariant,
    { progress: string; time: string }
> = {
    running: {
        progress: "stroke-emerald-500 dark:stroke-emerald-400",
        time: "text-emerald-500 dark:text-emerald-400",
    },
    paused: {
        progress: "stroke-amber-500 dark:stroke-amber-400",
        time: "text-amber-500 dark:text-amber-400",
    },
    completed: {
        progress: "stroke-emerald-600 dark:stroke-emerald-500",
        time: "text-emerald-600 dark:text-emerald-500",
    },
    idle: {
        progress: "stroke-zinc-500 dark:stroke-zinc-400",
        time: "text-zinc-400 dark:text-zinc-300",
    },
    rest: {
        progress: "stroke-sky-500 dark:stroke-sky-400",
        time: "text-sky-400 dark:text-sky-300",
    },
}

type Props = {
    durationSeconds: number
    elapsedSeconds: number
    label?: string
    size?: number
    className?: string
    variant?: TimerVisualVariant
}

export function CircularCountdownTimer({
    durationSeconds,
    elapsedSeconds,
    label = "tiempo restante",
    size = 168,
    className = "",
    variant = "running",
}: Props) {
    const safeDuration = Math.max(1, durationSeconds)
    const remaining = Math.max(0, safeDuration - elapsedSeconds)
    const progress = Math.min(1, Math.max(0, elapsedSeconds / safeDuration))
    const styles = variantStyles[variant]

    const stroke = 10
    const radius = (size - stroke) / 2
    const circumference = 2 * Math.PI * radius
    const dashOffset = circumference * (1 - progress)

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            style={{ width: size, height: size }}
            role="timer"
            aria-label={`${label}: ${formatMmSs(remaining)}`}
        >
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="#27272a"
                    className="dark:fill-zinc-900"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#3f3f46"
                    strokeWidth={stroke}
                    className="dark:stroke-zinc-700"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className={`transition-[stroke-dashoffset] duration-300 ease-linear ${styles.progress}`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
                <span className="text-[10px] font-medium lowercase tracking-wide text-zinc-400">
                    {label}
                </span>
                <span
                    className={`mt-0.5 font-mono text-3xl font-extralight tabular-nums tracking-tight ${styles.time}`}
                >
                    {formatMmSs(remaining)}
                </span>
            </div>
        </div>
    )
}
