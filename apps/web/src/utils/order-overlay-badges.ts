import type {
    ArrowElementInstance,
    CircleElementInstance,
    ElementInstance,
    ExerciseCanvas,
    ImageElementInstance,
    LineElementInstance,
    Point,
    RectElementInstance,
} from "@/interfaces"
import { getArrowCenter } from "@/components/exercise-canvas/canvas-helpers"
import {
    getArrowBounds,
    getCircleBounds,
    getImageBounds,
    getLineBounds,
    getRectBounds,
    getSelectionUnionBounds,
    isSelected,
    type Bounds,
    type CanvasElementsSnapshot,
    type SelectionItem,
    type SelectionItemType,
} from "@/components/exercise-canvas/canvas-selection"
import {
    BASE_ORDER_BADGE_RADIUS,
    getExerciseOverlayScale,
    getOrderBadgeFontSize,
    getOrderBadgeRadius,
} from "@/utils/overlay-scale"

export type OrderBadgeElementType = SelectionItemType

export type OrderOverlayBadge = {
    key: string
    order: number
    x: number
    y: number
    radius: number
    fontSize: number
    bgColor: string
    elementType: OrderBadgeElementType
    index: number
    anchorX: number
    anchorY: number
}

/** @deprecated Prefer badge.radius; kept for callers that need a fallback. */
export const ORDER_BADGE_RADIUS = BASE_ORDER_BADGE_RADIUS
/** Margen alrededor del elemento cuando no hay selección (o para ensanchar recuadros finos). */
export const ORDER_BADGE_DRAG_PADDING = 48
const ORDER_BADGE_MIN_DRAG_SIZE = 72

const DEFAULT_ELEMENT_COLOR = "#22c55e"
const DEFAULT_ARROW_COLOR = DEFAULT_ELEMENT_COLOR
const DEFAULT_CIRCLE_COLOR = DEFAULT_ELEMENT_COLOR
const DEFAULT_RECT_COLOR = DEFAULT_ELEMENT_COLOR
const DEFAULT_LINE_COLOR = DEFAULT_ELEMENT_COLOR

type BuildParams = Pick<
    ExerciseCanvas,
    "images" | "arrows" | "circles" | "rects" | "lines"
> & {
    canvasWidth: number
    canvasHeight: number
    /** Zoom del canvas o contentScale del preview. */
    viewScale?: number
}

export function getDefaultOrderBadgeAnchor(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
    overlayScale = 1,
): Point {
    const radius = getOrderBadgeRadius(overlayScale)
    const offsetX = radius + 2
    const offsetY = radius

    if (elementType === "image") {
        const el = element as ImageElementInstance
        return [el.x - offsetX, el.y - offsetY]
    }
    if (elementType === "circle") {
        const el = element as CircleElementInstance
        return [el.x - offsetX, el.y - offsetY]
    }
    if (elementType === "rect") {
        const el = element as RectElementInstance
        return [el.x - offsetX, el.y - offsetY]
    }
    if (elementType === "line") {
        const el = element as LineElementInstance
        return [
            (el.data.start[0] + el.data.end[0]) / 2 - offsetX,
            (el.data.start[1] + el.data.end[1]) / 2 - offsetY,
        ]
    }
    const el = element as ArrowElementInstance
    const center = getArrowCenter(el.data.points)
    return [center[0] - offsetX, center[1] - offsetY]
}

export function getElementBoundsForOrderBadge(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
): Bounds {
    if (elementType === "image") return getImageBounds(element as ImageElementInstance)
    if (elementType === "circle") return getCircleBounds(element as CircleElementInstance)
    if (elementType === "rect") return getRectBounds(element as RectElementInstance)
    if (elementType === "line") return getLineBounds(element as LineElementInstance)
    return getArrowBounds(element as ArrowElementInstance)
}

export function expandBoundsForOrderBadgeDrag(bounds: Bounds): Bounds {
    const width = bounds.right - bounds.left
    const height = bounds.bottom - bounds.top
    const padX = Math.max(ORDER_BADGE_DRAG_PADDING, (ORDER_BADGE_MIN_DRAG_SIZE - width) / 2)
    const padY = Math.max(ORDER_BADGE_DRAG_PADDING, (ORDER_BADGE_MIN_DRAG_SIZE - height) / 2)
    return {
        left: bounds.left - padX,
        top: bounds.top - padY,
        right: bounds.right + padX,
        bottom: bounds.bottom + padY,
    }
}

export function getOrderBadgeMoveBounds(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
    selection: SelectionItem[],
    canvas: CanvasElementsSnapshot,
): Bounds {
    const elementRange = expandBoundsForOrderBadgeDrag(
        getElementBoundsForOrderBadge(elementType, element),
    )

    if (element.id && isSelected(selection, elementType, element.id)) {
        const union = getSelectionUnionBounds(selection, canvas)
        if (union) {
            // Recuadro de selección; se ensancha un poco si es muy fino (líneas/flechas).
            return expandBoundsForOrderBadgeDrag(union)
        }
    }

    return elementRange
}

export function clampPointToBounds(
    x: number,
    y: number,
    bounds: Bounds,
    radius = ORDER_BADGE_RADIUS,
): Point {
    const minX = bounds.left + radius
    const maxX = Math.max(minX, bounds.right - radius)
    const minY = bounds.top + radius
    const maxY = Math.max(minY, bounds.bottom - radius)
    return [
        Math.min(maxX, Math.max(minX, x)),
        Math.min(maxY, Math.max(minY, y)),
    ]
}

function resolveBadgePosition(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
    overlayScale: number,
): { x: number; y: number; anchorX: number; anchorY: number } {
    const [anchorX, anchorY] = getDefaultOrderBadgeAnchor(elementType, element, overlayScale)
    const offset = element.orderOffset
    const x = anchorX + (offset?.[0] ?? 0)
    const y = anchorY + (offset?.[1] ?? 0)
    return { x, y, anchorX, anchorY }
}

function buildBadge(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
    index: number,
    bgColor: string,
    overlayScale: number,
): OrderOverlayBadge {
    const radius = getOrderBadgeRadius(overlayScale)
    const fontSize = getOrderBadgeFontSize(overlayScale)
    const pos = resolveBadgePosition(elementType, element, overlayScale)
    return {
        key: `${elementType}-badge-${element.id ?? index}`,
        order: element.order as number,
        x: pos.x,
        y: pos.y,
        radius,
        fontSize,
        anchorX: pos.anchorX,
        anchorY: pos.anchorY,
        bgColor,
        elementType,
        index,
    }
}

export function buildOrderOverlayBadges({
    images,
    arrows,
    circles,
    rects,
    lines,
    viewScale = 1,
}: BuildParams): OrderOverlayBadge[] {
    const overlayScale = getExerciseOverlayScale(
        { images, arrows, circles, rects, lines },
        viewScale,
    )

    const imageBadges = images
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => typeof element.order === "number")
        .map(({ element, index }) =>
            buildBadge(
                "image",
                element,
                index,
                element.style?.strokeColor ?? DEFAULT_ELEMENT_COLOR,
                overlayScale,
            ),
        )

    const arrowBadges = arrows
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => typeof element.order === "number")
        .map(({ element, index }) =>
            buildBadge(
                "arrow",
                element,
                index,
                element.style?.strokeColor ?? DEFAULT_ARROW_COLOR,
                overlayScale,
            ),
        )

    const circleBadges = circles
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => typeof element.order === "number")
        .map(({ element, index }) =>
            buildBadge(
                "circle",
                element,
                index,
                element.style?.strokeColor ?? DEFAULT_CIRCLE_COLOR,
                overlayScale,
            ),
        )

    const rectBadges = rects
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => typeof element.order === "number")
        .map(({ element, index }) =>
            buildBadge(
                "rect",
                element,
                index,
                element.style?.strokeColor ?? DEFAULT_RECT_COLOR,
                overlayScale,
            ),
        )

    const lineBadges = lines
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => typeof element.order === "number")
        .map(({ element, index }) =>
            buildBadge(
                "line",
                element,
                index,
                element.style?.strokeColor ?? DEFAULT_LINE_COLOR,
                overlayScale,
            ),
        )

    return [...imageBadges, ...arrowBadges, ...circleBadges, ...rectBadges, ...lineBadges]
}

export function findOrderBadgeAt(
    x: number,
    y: number,
    badges: OrderOverlayBadge[],
): OrderOverlayBadge | null {
    // Recorrer al revés: el último dibujado queda encima.
    for (let i = badges.length - 1; i >= 0; i--) {
        const badge = badges[i]
        const hitR2 = badge.radius * badge.radius
        const dx = x - badge.x
        const dy = y - badge.y
        if (dx * dx + dy * dy <= hitR2) return badge
    }
    return null
}
