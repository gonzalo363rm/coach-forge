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
    /** Id del deporte; `null` si aplica a cualquier deporte o calentamiento genérico. */
    sportId: string | null
    title: string
    minPlayers: number | null
    maxPlayers: number | null
    difficulty: number
    videoLink: string | null
    canvas: ExerciseCanvas
}
