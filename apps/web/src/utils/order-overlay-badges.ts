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

export type OrderBadgeElementType = SelectionItemType

export type OrderOverlayBadge = {
    key: string
    order: number
    x: number
    y: number
    bgColor: string
    elementType: OrderBadgeElementType
    index: number
    anchorX: number
    anchorY: number
}

export const ORDER_BADGE_RADIUS = 12
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
}

export function getDefaultOrderBadgeAnchor(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
): Point {
    if (elementType === "image") {
        const el = element as ImageElementInstance
        return [el.x - 14, el.y - 12]
    }
    if (elementType === "circle") {
        const el = element as CircleElementInstance
        return [el.x - 14, el.y - 12]
    }
    if (elementType === "rect") {
        const el = element as RectElementInstance
        return [el.x - 14, el.y - 12]
    }
    if (elementType === "line") {
        const el = element as LineElementInstance
        return [
            (el.data.start[0] + el.data.end[0]) / 2 - 14,
            (el.data.start[1] + el.data.end[1]) / 2 - 12,
        ]
    }
    const el = element as ArrowElementInstance
    const center = getArrowCenter(el.data.points)
    return [center[0] - 14, center[1] - 12]
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

export function clampPointToBounds(x: number, y: number, bounds: Bounds): Point {
    const minX = bounds.left + ORDER_BADGE_RADIUS
    const maxX = Math.max(minX, bounds.right - ORDER_BADGE_RADIUS)
    const minY = bounds.top + ORDER_BADGE_RADIUS
    const maxY = Math.max(minY, bounds.bottom - ORDER_BADGE_RADIUS)
    return [
        Math.min(maxX, Math.max(minX, x)),
        Math.min(maxY, Math.max(minY, y)),
    ]
}

function resolveBadgePosition(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
    canvasWidth: number,
    canvasHeight: number,
): { x: number; y: number; anchorX: number; anchorY: number } {
    const [anchorX, anchorY] = getDefaultOrderBadgeAnchor(elementType, element)
    const offset = element.orderOffset
    const rawX = anchorX + (offset?.[0] ?? 0)
    const rawY = anchorY + (offset?.[1] ?? 0)
    const x = Math.max(ORDER_BADGE_RADIUS, Math.min(canvasWidth - ORDER_BADGE_RADIUS, rawX))
    const y = Math.max(ORDER_BADGE_RADIUS, Math.min(canvasHeight - ORDER_BADGE_RADIUS, rawY))
    return { x, y, anchorX, anchorY }
}

export function buildOrderOverlayBadges({
    images,
    arrows,
    circles,
    rects,
    lines,
    canvasWidth,
    canvasHeight,
}: BuildParams): OrderOverlayBadge[] {
    const imageBadges = images
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => typeof element.order === "number")
        .map(({ element, index }) => {
            const pos = resolveBadgePosition("image", element, canvasWidth, canvasHeight)
            return {
                key: `image-badge-${element.id ?? index}`,
                order: element.order as number,
                x: pos.x,
                y: pos.y,
                anchorX: pos.anchorX,
                anchorY: pos.anchorY,
                bgColor: element.style?.strokeColor ?? DEFAULT_ELEMENT_COLOR,
                elementType: "image" as const,
                index,
            }
        })

    const arrowBadges = arrows
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => typeof element.order === "number")
        .map(({ element, index }) => {
            const pos = resolveBadgePosition("arrow", element, canvasWidth, canvasHeight)
            return {
                key: `arrow-badge-${element.id ?? index}`,
                order: element.order as number,
                x: pos.x,
                y: pos.y,
                anchorX: pos.anchorX,
                anchorY: pos.anchorY,
                bgColor: element.style?.strokeColor ?? DEFAULT_ARROW_COLOR,
                elementType: "arrow" as const,
                index,
            }
        })

    const circleBadges = circles
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => typeof element.order === "number")
        .map(({ element, index }) => {
            const pos = resolveBadgePosition("circle", element, canvasWidth, canvasHeight)
            return {
                key: `circle-badge-${element.id ?? index}`,
                order: element.order as number,
                x: pos.x,
                y: pos.y,
                anchorX: pos.anchorX,
                anchorY: pos.anchorY,
                bgColor: element.style?.strokeColor ?? DEFAULT_CIRCLE_COLOR,
                elementType: "circle" as const,
                index,
            }
        })

    const rectBadges = rects
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => typeof element.order === "number")
        .map(({ element, index }) => {
            const pos = resolveBadgePosition("rect", element, canvasWidth, canvasHeight)
            return {
                key: `rect-badge-${element.id ?? index}`,
                order: element.order as number,
                x: pos.x,
                y: pos.y,
                anchorX: pos.anchorX,
                anchorY: pos.anchorY,
                bgColor: element.style?.strokeColor ?? DEFAULT_RECT_COLOR,
                elementType: "rect" as const,
                index,
            }
        })

    const lineBadges = lines
        .map((element, index) => ({ element, index }))
        .filter(({ element }) => typeof element.order === "number")
        .map(({ element, index }) => {
            const pos = resolveBadgePosition("line", element, canvasWidth, canvasHeight)
            return {
                key: `line-badge-${element.id ?? index}`,
                order: element.order as number,
                x: pos.x,
                y: pos.y,
                anchorX: pos.anchorX,
                anchorY: pos.anchorY,
                bgColor: element.style?.strokeColor ?? DEFAULT_LINE_COLOR,
                elementType: "line" as const,
                index,
            }
        })

    return [...imageBadges, ...arrowBadges, ...circleBadges, ...rectBadges, ...lineBadges]
}

export function findOrderBadgeAt(
    x: number,
    y: number,
    badges: OrderOverlayBadge[],
): OrderOverlayBadge | null {
    const hitR2 = ORDER_BADGE_RADIUS * ORDER_BADGE_RADIUS
    // Recorrer al revés: el último dibujado queda encima.
    for (let i = badges.length - 1; i >= 0; i--) {
        const badge = badges[i]
        const dx = x - badge.x
        const dy = y - badge.y
        if (dx * dx + dy * dy <= hitR2) return badge
    }
    return null
}
