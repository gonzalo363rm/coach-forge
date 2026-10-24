"use client"

import Link from "next/link"

type Props = {
    title: string
    backHref: string
    backLabel?: string
    onSave: () => void
    saveDisabled?: boolean
    saveDisabledReason?: string
    onClear: () => void
    clearLabel?: string
}

export function MobileEditorHeader({
    title,
    backHref,
    backLabel = "Volver",
    onSave,
    saveDisabled = false,
    saveDisabledReason,
    onClear,
    clearLabel = "Clear",
}: Props) {
    return (
        <header
            className="flex shrink-0 items-center gap-2 border-b border-zinc-300 bg-zinc-100 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
            style={{
                paddingTop: "max(0.375rem, env(safe-area-inset-top))",
                paddingLeft: "max(0.5rem, env(safe-area-inset-left))",
                paddingRight: "max(0.5rem, env(safe-area-inset-right))",
            }}
        >
            <Link
                href={backHref}
                className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            >
                ← {backLabel}
            </Link>
            <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {title}
            </h1>
            <button type="button" onClick={onClear} className="cf-btn-danger shrink-0">
                {clearLabel}
            </button>
            <button
                type="button"
                disabled={saveDisabled}
                title={saveDisabled ? saveDisabledReason : undefined}
                onClick={onSave}
                className="cf-btn-success shrink-0 disabled:pointer-events-none disabled:opacity-40"
            >
                Save
            </button>
        </header>
    )
}
