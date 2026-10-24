"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

import type { ExerciseEditorInitialData, SportListOption } from "@/interfaces"
import { useIsMobileEditor } from "@/hooks/use-mobile-layout"

type Props = {
    initialExercise?: ExerciseEditorInitialData | null
    sports?: SportListOption[]
    returnTo?: string | null
    visibilityUser?: { role: string; clubId?: string | null }
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
    visibilityUser,
}: Props) {
    const isMobile = useIsMobileEditor()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <EditorLoading />
    }

    return (
        <ExerciseEditor
            initialExercise={initialExercise}
            sports={sports}
            returnTo={returnTo}
            visibilityUser={visibilityUser}
            layout={isMobile ? "mobile" : "desktop"}
        />
    )
}
