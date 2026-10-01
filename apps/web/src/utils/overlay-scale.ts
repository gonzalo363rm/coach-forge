import type {
    ArrowElementInstance,
    CircleElementInstance,
    ElementInstance,
    ExerciseCanvas,
    ImageElementInstance,
    LineElementInstance,
    RectElementInstance,
} from "@/interfaces"
import {
    getArrowBounds,
    getCircleBounds,
    getImageBounds,
    getLineBounds,
    getRectBounds,
    type SelectionItemType,
} from "@/components/exercise-canvas/canvas-selection"

export const BASE_ORDER_BADGE_RADIUS = 12
export const BASE_ORDER_BADGE_FONT_SIZE = 11
export const BASE_LABEL_FONT_SIZE = 14
export const BASE_LABEL_CHAR_WIDTH = 8

/** Tamaño deseado en pantalla (px), independiente del zoom al alejar. */
const MIN_SCREEN_LABEL_PX = 10
const MAX_SCREEN_LABEL_PX = 20

type CanvasElements = Pick<
    ExerciseCanvas,
    "images" | "arrows" | "circles" | "rects" | "lines"
>

function getElementBounds(elementType: SelectionItemType, element: ElementInstance) {
    if (elementType === "image") return getImageBounds(element as ImageElementInstance)
    if (elementType === "circle") return getCircleBounds(element as CircleElementInstance)
    if (elementType === "rect") return getRectBounds(element as RectElementInstance)
    if (elementType === "line") return getLineBounds(element as LineElementInstance)
    return getArrowBounds(element as ArrowElementInstance)
}

function getElementEffectiveSize(
    elementType: SelectionItemType,
    element: ElementInstance,
): number {
    const bounds = getElementBounds(elementType, element)
    const width = Math.max(0, bounds.right - bounds.left)
    const height = Math.max(0, bounds.bottom - bounds.top)
    const minSide = Math.min(width, height)
    const maxSide = Math.max(width, height)

    if (elementType === "line" || elementType === "arrow") {
        return Math.max(minSide, Math.min(maxSide * 0.2, 160), 40)
    }
    return Math.max(minSide, 24)
}

/** Escala de contenido → tamaño deseado en pantalla (sin compensar zoom). */
function screenScaleFromEffectiveSize(effectiveSize: number): number {
    // Mesa ping-pong (~280px mundo) → ~11px; cancha grande → tope al alejar.
    const screenPx = Math.min(
        MAX_SCREEN_LABEL_PX,
        Math.max(MIN_SCREEN_LABEL_PX, 9 + Math.sqrt(effectiveSize) * 0.12),
    )
    return screenPx / BASE_LABEL_FONT_SIZE
}

function maxElementEffectiveSize(canvas: CanvasElements): number {
    let maxSize = 0

    for (const el of canvas.images) {
        maxSize = Math.max(maxSize, getElementEffectiveSize("image", el))
    }
    for (const el of canvas.circles) {
        maxSize = Math.max(maxSize, getElementEffectiveSize("circle", el))
    }
    for (const el of canvas.rects) {
        maxSize = Math.max(maxSize, getElementEffectiveSize("rect", el))
    }
    for (const el of canvas.lines) {
        maxSize = Math.max(maxSize, getElementEffectiveSize("line", el))
    }
    for (const el of canvas.arrows) {
        maxSize = Math.max(maxSize, getElementEffectiveSize("arrow", el))
    }

    return maxSize
}

/**
 * Escala única para order/labels del ejercicio (coords mundo).
 * - Mismo tamaño para todos los elementos del ejercicio.
 * - Crece un poco con el elemento más grande.
 * - Si la vista está alejada (zoom < 1), agranda en mundo para mantener
 *   legibilidad en pantalla (evita el texto diminuto con canchas grandes).
 *
 * @param viewScale zoom del canvas o contentScale del preview (1 = sin alejamiento)
 */
export function getExerciseOverlayScale(
    canvas: CanvasElements,
    viewScale = 1,
): number {
    const maxSize = maxElementEffectiveSize(canvas)
    if (maxSize <= 0) return 1

    const screenScale = screenScaleFromEffectiveSize(maxSize)
    // Solo compensar al alejar; al acercar los overlays escalan con el contenido.
    const zoomOut = Math.min(Math.max(viewScale, 0.05), 1)
    return screenScale / zoomOut
}

/**
 * Multiplicador de stroke en coords mundo (el canvas luego aplica scale(zoom)).
 * En pantalla: zoom 1 → grosor base; al alejar, apenas un poco más grueso.
 * En cancha típica (zoom ~0.15–0.25) queda ~1.25–1.4× el grosor en pantalla.
 */
export function getStrokeZoomBoost(viewScale: number): number {
    const z = Math.min(Math.max(viewScale, 0.05), 1)
    if (z >= 0.99) return 1
    // Énfasis suave en pantalla (tope 1.45×).
    const screenMul = Math.min(1.45, 1 + 0.08 * (1 / z - 1))
    // Convertir a mundo: screen = world * z  ⇒  world = screen / z
    return Math.min(12, screenMul / z)
}

export function getOrderBadgeRadius(scale: number): number {
    return BASE_ORDER_BADGE_RADIUS * scale
}

export function getOrderBadgeFontSize(scale: number): number {
    return BASE_ORDER_BADGE_FONT_SIZE * scale
}

export function getLabelFontSize(scale: number): number {
    return BASE_LABEL_FONT_SIZE * scale
}

export function getLabelCharWidth(scale: number): number {
    return BASE_LABEL_CHAR_WIDTH * scale
}
