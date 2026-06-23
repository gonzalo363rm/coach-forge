"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

import type { ExerciseEditorInitialData, SportListOption } from "@/interfaces"
import { useIsMobileLayout } from "@/hooks/use-mobile-layout"
import { ExerciseEditorMobileUnavailable } from "./ExerciseEditorMobileUnavailable"

type Props = {
    initialExercise?: ExerciseEditorInitialData | null
    sports?: SportListOption[]
    returnTo?: string | null
}

const ExerciseEditor = dynamic(
    () =>
        import("./ExerciseEditor").then((mod) => ({
            default: mod.ExerciseEditor,
        })),
    {
        ssr: false,
        loading: () => <EditorLoading />,
    },
)

function EditorLoading() {
    return (
        <div className="flex min-h-[480px] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            Cargando editor…
        </div>
    )
}

export function ExerciseEditorDynamic({
    initialExercise = null,
    sports = [],
    returnTo = null,
}: Props) {
    const isMobile = useIsMobileLayout()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <EditorLoading />
    }

    if (isMobile) {
        return <ExerciseEditorMobileUnavailable returnTo={returnTo} />
    }

    return (
        <ExerciseEditor
            initialExercise={initialExercise}
            sports={sports}
            returnTo={returnTo}
        />
    )
}
