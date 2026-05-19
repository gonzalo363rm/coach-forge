"use client"

import * as Slider from "@radix-ui/react-slider"
import clsx from "clsx"

type Props = {
    min: number
    max: number
    value: [number, number]
    onValueChange: (value: [number, number]) => void
    step?: number
    className?: string
    "aria-label"?: string
}

export function RangeSlider({
    min,
    max,
    value,
    onValueChange,
    step = 1,
    className,
    "aria-label": ariaLabel,
}: Props) {
    return (
        <Slider.Root
            className={clsx(
                "relative flex h-5 w-full min-w-32 max-w-44 touch-none select-none items-center",
                className,
            )}
            min={min}
            max={max}
            step={step}
            minStepsBetweenThumbs={0}
            value={value}
            onValueChange={(v) => onValueChange([v[0]!, v[1]!])}
            aria-label={ariaLabel}
        >
            <Slider.Track className="relative h-1.5 grow rounded-full bg-zinc-200 dark:bg-zinc-600">
                <Slider.Range className="absolute h-full rounded-full bg-emerald-500 dark:bg-emerald-600" />
            </Slider.Track>
            <Slider.Thumb
                className="block h-4 w-4 cursor-grab rounded-full border-2 border-emerald-500 bg-white shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:cursor-grabbing dark:bg-zinc-100 dark:hover:bg-white"
                aria-label="Valor mínimo"
            />
            <Slider.Thumb
                className="block h-4 w-4 cursor-grab rounded-full border-2 border-emerald-500 bg-white shadow-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 active:cursor-grabbing dark:bg-zinc-100 dark:hover:bg-white"
                aria-label="Valor máximo"
            />
        </Slider.Root>
    )
}
