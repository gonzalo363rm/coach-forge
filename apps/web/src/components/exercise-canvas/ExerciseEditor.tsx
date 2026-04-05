"use client"

import { useCallback, useState } from "react"

import type { ElementDefinition, Exercise, ToolType } from "@/interfaces"
import { ToolsPanel } from "./ToolsPanel"
import { ExerciseCanvas } from "./ExerciseCanvas"

export const ExerciseEditor = () => {
    const [currentTool, setCurrentTool] = useState<ToolType>("select")
    const [selectedPaletteElement, setSelectedPaletteElement] = useState<ElementDefinition | null>(null)

    const handleExerciseSave = useCallback(async (exercise: Exercise) => {
        const res = await fetch("/api/exercises", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(exercise),
        })
        const payload = (await res.json().catch(() => ({}))) as { error?: string }
        if (!res.ok) {
            throw new Error(payload.error ?? `Error al guardar (${res.status})`)
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