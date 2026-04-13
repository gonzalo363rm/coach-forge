"use client"

import { useCallback, useState } from "react"

import { createExerciseAction } from "@/app/actions/exercises"
import type { ElementDefinition, Exercise, ToolType } from "@/interfaces"
import { ToolsPanel } from "./ToolsPanel"
import { ExerciseCanvas } from "./ExerciseCanvas"

export const ExerciseEditor = () => {
    const [currentTool, setCurrentTool] = useState<ToolType>("select")
    const [selectedPaletteElement, setSelectedPaletteElement] = useState<ElementDefinition | null>(null)

    const handleExerciseSave = useCallback(async (exercise: Exercise) => {
        const result = await createExerciseAction(exercise)
        if (!result.ok) {
            throw new Error(result.error)
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