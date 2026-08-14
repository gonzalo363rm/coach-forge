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
import type {
    CanvasElementsSnapshot,
    SelectionItem,
} from "@/components/exercise-canvas/canvas-selection"
import {
    clampPointToBounds,
    getOrderBadgeMoveBounds,
    type OrderBadgeElementType,
} from "@/utils/order-overlay-badges"

export type LabelOverlayItem = {
    key: string
    text: string
    x: number
    y: number
    width: number
    height: number
    elementType: OrderBadgeElementType
    index: number
    anchorX: number
    anchorY: number
}

export const LABEL_FONT_SIZE = 14
/** Ancho aproximado por carácter para hit-test (CanvasKit drawText sin measure fiable). */
const LABEL_CHAR_WIDTH = 8
const LABEL_HIT_PADDING = 4

type BuildParams = Pick<
    ExerciseCanvas,
    "images" | "arrows" | "circles" | "rects" | "lines"
> & {
    canvasWidth: number
    canvasHeight: number
}

export function getDefaultLabelAnchor(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
): Point {
    if (elementType === "image") {
        const el = element as ImageElementInstance
        return [el.x, el.y - 8]
    }
    if (elementType === "circle") {
        const el = element as CircleElementInstance
        return [el.x - el.data.radius, el.y - el.data.radius - 8]
    }
    if (elementType === "rect") {
        const el = element as RectElementInstance
        return [el.x, el.y - 8]
    }
    if (elementType === "line") {
        const el = element as LineElementInstance
        return [
            (el.data.start[0] + el.data.end[0]) / 2,
            (el.data.start[1] + el.data.end[1]) / 2 - 8,
        ]
    }
    const el = element as ArrowElementInstance
    const center = getArrowCenter(el.data.points)
    return [center[0], center[1] - 8]
}

export function estimateLabelSize(text: string): { width: number; height: number } {
    const width = Math.max(LABEL_FONT_SIZE, text.length * LABEL_CHAR_WIDTH)
    return { width, height: LABEL_FONT_SIZE }
}

export function resolveLabelPosition(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
    canvasWidth: number,
    canvasHeight: number,
): { x: number; y: number; anchorX: number; anchorY: number } {
    const [anchorX, anchorY] = getDefaultLabelAnchor(elementType, element)
    const offset = element.labelOffset
    const rawX = anchorX + (offset?.[0] ?? 0)
    const rawY = anchorY + (offset?.[1] ?? 0)
    const x = Math.max(0, Math.min(canvasWidth, rawX))
    const y = Math.max(0, Math.min(canvasHeight, rawY))
    return { x, y, anchorX, anchorY }
}

function buildItem(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
    index: number,
    canvasWidth: number,
    canvasHeight: number,
): LabelOverlayItem | null {
    const text = element.label?.trim()
    if (!text) return null
    const pos = resolveLabelPosition(elementType, element, canvasWidth, canvasHeight)
    const size = estimateLabelSize(text)
    return {
        key: `${elementType}-label-${element.id ?? index}`,
        text,
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
        elementType,
        index,
        anchorX: pos.anchorX,
        anchorY: pos.anchorY,
    }
}

export function buildLabelOverlayItems({
    images,
    arrows,
    circles,
    rects,
    lines,
    canvasWidth,
    canvasHeight,
}: BuildParams): LabelOverlayItem[] {
    const items: LabelOverlayItem[] = []

    images.forEach((element, index) => {
        const item = buildItem("image", element, index, canvasWidth, canvasHeight)
        if (item) items.push(item)
    })
    arrows.forEach((element, index) => {
        const item = buildItem("arrow", element, index, canvasWidth, canvasHeight)
        if (item) items.push(item)
    })
    circles.forEach((element, index) => {
        const item = buildItem("circle", element, index, canvasWidth, canvasHeight)
        if (item) items.push(item)
    })
    rects.forEach((element, index) => {
        const item = buildItem("rect", element, index, canvasWidth, canvasHeight)
        if (item) items.push(item)
    })
    lines.forEach((element, index) => {
        const item = buildItem("line", element, index, canvasWidth, canvasHeight)
        if (item) items.push(item)
    })

    return items
}

export function findLabelAt(
    x: number,
    y: number,
    labels: LabelOverlayItem[],
): LabelOverlayItem | null {
    for (let i = labels.length - 1; i >= 0; i--) {
        const label = labels[i]
        // drawText usa baseline aproximada; la caja cubre un poco por encima y debajo.
        const left = label.x - LABEL_HIT_PADDING
        const right = label.x + label.width + LABEL_HIT_PADDING
        const top = label.y - label.height - LABEL_HIT_PADDING
        const bottom = label.y + LABEL_HIT_PADDING
        if (x >= left && x <= right && y >= top && y <= bottom) return label
    }
    return null
}

export function clampLabelPosition(
    x: number,
    y: number,
    elementType: OrderBadgeElementType,
    element: ElementInstance,
    selection: SelectionItem[],
    canvas: CanvasElementsSnapshot,
): Point {
    const bounds = getOrderBadgeMoveBounds(elementType, element, selection, canvas)
    return clampPointToBounds(x, y, bounds)
}
