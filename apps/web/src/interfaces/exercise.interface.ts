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

/** Tras guardar en BD, el cliente puede enviar un PNG del canvas (solo si hay elementos dibujados). */
export type ExerciseSaveHandler = (
    exercise: Exercise,
    previewPng: Uint8Array | null,
) => void | Promise<void>

/** Opción mínima para selects de deporte (serializable desde RSC). */
export type SportListOption = {
    id: string
    name: string
}

/** Hidrata el editor al editar un ejercicio ya persistido. */
export type ExerciseEditorInitialData = {
    id?: string
    title: string
    sportId: string | null
    minPlayers: number | null
    maxPlayers: number | null
    difficulty: number
    videoLink: string | null
    canvas: ExerciseCanvas
}

/**
 * Ejercicio listo para persistir: metadatos + snapshot del canvas.
 */
export interface Exercise {
    /** Id del deporte; `null` si aplica a cualquier deporte o calentamiento genérico. */
    title: string
    sportId: string | null
    minPlayers: number | null
    maxPlayers: number | null
    difficulty: number
    videoLink: string | null
    canvas: ExerciseCanvas
}
