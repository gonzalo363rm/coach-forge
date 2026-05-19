"use client"

import { RangeSlider } from "@/components/ui/slider/RangeSlider"

const MIN = 1
const MAX = 5

type Props = {
    min: number
    max: number
    onChange: (min: number, max: number) => void
    className?: string
}

export function DifficultyRangeFilter({ min, max, onChange, className = "" }: Props) {
    return (
        <div className={`flex min-w-40 flex-col gap-1.5 ${className}`}>
            <DifficultyHeader min={min} max={max} />
            <RangeSlider
                min={MIN}
                max={MAX}
                step={1}
                value={[min, max]}
                onValueChange={([nextMin, nextMax]) => onChange(nextMin, nextMax)}
                aria-label="Rango de dificultad"
            />
        </div>
    )
}

function DifficultyHeader({ min, max }: { min: number; max: number }) {
    return (
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <span>Dificultad</span>
            <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                {min === max ? `${min}` : `${min} – ${max}`}
            </span>
        </div>
    )
}
