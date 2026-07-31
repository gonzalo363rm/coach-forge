"use client"

import type { ContentVisibility } from "@prisma/client"

import {
    availableVisibilitiesForUser,
    formatContentVisibility,
} from "@/lib/content-visibility"

const selectClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"

type Props = {
    id?: string
    value: ContentVisibility
    onChange: (value: ContentVisibility) => void
    user: { role: string; clubId?: string | null }
    className?: string
}

export function VisibilitySelect({ id, value, onChange, user, className }: Props) {
    const options = availableVisibilitiesForUser(user)

    return (
        <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value as ContentVisibility)}
            className={className ?? selectClass}
        >
            {options.map((option) => (
                <option key={option} value={option}>
                    {formatContentVisibility(option)}
                </option>
            ))}
        </select>
    )
}
