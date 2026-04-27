"use client"

import { useCallback, useState } from "react"

import {
    createExerciseAction,
    saveExercisePreviewAction,
    updateExerciseAction,
} from "@/app/actions/exercises"
import type {
    ElementDefinition,
    Exercise,
    ExerciseEditorInitialData,
    SportListOption,
    ToolType,
} from "@/interfaces"
import { uint8ArrayToBase64 } from "@/utils/base64"
import { ToolsPanel } from "./ToolsPanel"
import { ExerciseCanvas } from "./ExerciseCanvas"

async function saveExercisePreviewIfPresent(
    exerciseId: string,
    previewPng: Uint8Array | null,
): Promise<void> {
    if (!previewPng || previewPng.byteLength === 0) return

    const previewResult = await saveExercisePreviewAction({
        exerciseId,
        pngBase64: uint8ArrayToBase64(previewPng),
    })
    if (!previewResult.ok) {
        console.error("[handleExerciseSave] Vista previa:", previewResult.error)
    }
}

type EditorProps = {
    initialExercise?: ExerciseEditorInitialData | null
    sports?: SportListOption[]
}

export const ExerciseEditor = ({ initialExercise = null, sports = [] }: EditorProps) => {
    const [currentTool, setCurrentTool] = useState<ToolType>("select")
    const [selectedPaletteElement, setSelectedPaletteElement] = useState<ElementDefinition | null>(null)

    const handleExerciseSave = useCallback(
        async (exercise: Exercise, previewPng: Uint8Array | null) => {
            if (initialExercise?.id) {
                const result = await updateExerciseAction({
                    id: initialExercise.id,
                    ...exercise,
                })
                if (!result.ok) {
                    throw new Error(result.error)
                }
                await saveExercisePreviewIfPresent(initialExercise.id, previewPng)
                return
            }

            const result = await createExerciseAction(exercise)
            if (!result.ok) {
                throw new Error(result.error)
            }

            if (result.data?.id) {
                await saveExercisePreviewIfPresent(result.data.id, previewPng)
            }
        },
        [initialExercise?.id],
    )

    return (
        <div className="flex w-full gap-6">
            <div className="w-[20%]">
                <ToolsPanel
                    currentTool={currentTool}
                    setCurrentTool={setCurrentTool}
                    selectedPaletteElement={selectedPaletteElement}
                    setSelectedPaletteElement={setSelectedPaletteElement}
                />
            </div>
            <div className="w-[80%]">
                <ExerciseCanvas
                    currentTool={currentTool}
                    setCurrentTool={setCurrentTool}
                    selectedPaletteElement={selectedPaletteElement}
                    onExerciseSave={handleExerciseSave}
                    initialData={initialExercise ?? undefined}
                    sports={sports}
                />
            </div>
        </div>
    )
}