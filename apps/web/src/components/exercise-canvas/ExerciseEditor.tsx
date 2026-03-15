'use client'

import { useState } from "react"

import type { ElementDefinition, ToolType } from "@/interfaces"
import { ToolsPanel } from "./ToolsPanel"
import { ExerciseCanvas } from "./ExerciseCanvas"

export const ExerciseEditor = () => {
    const [currentTool, setCurrentTool] = useState<ToolType>('select');
    const [selectedPaletteElement, setSelectedPaletteElement] = useState<ElementDefinition | null>(null)

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
                />
            </div>
        </div>
    )
}