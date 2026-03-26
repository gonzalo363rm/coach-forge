import type {
    ArrowElementInstance,
    CircleElementInstance,
    ImageElementInstance,
    LineElementInstance,
    RectElementInstance,
} from "./element.interface"

/** Estado serializable del editor de canvas (elementos + vista). */
export interface ExerciseCanvas {
    width: number
    height: number
    backgroundColor: string
    zoom: number
    showTitleOverlay: boolean
    showOrderOverlay: boolean
    images: ImageElementInstance[]
    circles: CircleElementInstance[]
    rects: RectElementInstance[]
    lines: LineElementInstance[]
    arrows: ArrowElementInstance[]
}

/**
 * Ejercicio listo para persistir: metadatos + snapshot del canvas.
 */
export interface Exercise {
    title: string
    categories: string[]
    minPlayers: number | null
    maxPlayers: number | null
    difficulty: number
    videoLink: string
    canvas: ExerciseCanvas
}
