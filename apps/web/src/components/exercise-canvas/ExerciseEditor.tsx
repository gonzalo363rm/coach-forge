"use client"

import { useCallback, useState } from "react"

import { createExerciseAction, saveExercisePreviewAction } from "@/app/actions/exercises"
import type { ElementDefinition, Exercise, ToolType } from "@/interfaces"
import { uint8ArrayToBase64 } from "@/utils/base64"
import { ToolsPanel } from "./ToolsPanel"
import { ExerciseCanvas } from "./ExerciseCanvas"

export const ExerciseEditor = () => {
    const [currentTool, setCurrentTool] = useState<ToolType>("select")
    const [selectedPaletteElement, setSelectedPaletteElement] = useState<ElementDefinition | null>(null)

    const handleExerciseSave = useCallback(async (exercise: Exercise, previewPng: Uint8Array | null) => {
        const result = await createExerciseAction(exercise)
        if (!result.ok) {
            throw new Error(result.error)
        }

        if (previewPng && previewPng.byteLength > 0 && result.data?.id) {
            const previewResult = await saveExercisePreviewAction({
                exerciseId: result.data.id,
                pngBase64: uint8ArrayToBase64(previewPng),
            })
            if (!previewResult.ok) {
                console.error("[handleExerciseSave] Vista previa:", previewResult.error)
            }
        }
    }, [])

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
                />
            </div>
        </div>
    )
}