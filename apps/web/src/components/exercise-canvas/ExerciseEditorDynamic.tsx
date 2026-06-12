"use client"

import dynamic from "next/dynamic"

export const ExerciseEditorDynamic = dynamic(
    () =>
        import("./ExerciseEditor").then((mod) => ({
            default: mod.ExerciseEditor,
        })),
    {
        ssr: false,
        loading: () => (
            <div className="flex min-h-[480px] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-100 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                Cargando editor…
            </div>
        ),
    },
)
