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
import type { OrderBadgeElementType } from "@/utils/order-overlay-badges"
import {
    BASE_LABEL_FONT_SIZE,
    getExerciseOverlayScale,
    getLabelCharWidth,
    getLabelFontSize,
} from "@/utils/overlay-scale"

export type LabelOverlayItem = {
    key: string
    text: string
    x: number
    y: number
    width: number
    height: number
    fontSize: number
    elementType: OrderBadgeElementType
    index: number
    anchorX: number
    anchorY: number
}

/** @deprecated Prefer getLabelFontSize(scale); kept as base reference. */
export const LABEL_FONT_SIZE = BASE_LABEL_FONT_SIZE

type BuildParams = Pick<
    ExerciseCanvas,
    "images" | "arrows" | "circles" | "rects" | "lines"
> & {
    canvasWidth: number
    canvasHeight: number
    /** Zoom del canvas o contentScale del preview. */
    viewScale?: number
}

export function getDefaultLabelAnchor(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
    overlayScale = 1,
): Point {
    const gap = Math.max(6, 8 * overlayScale)

    if (elementType === "image") {
        const el = element as ImageElementInstance
        return [el.x, el.y - gap]
    }
    if (elementType === "circle") {
        const el = element as CircleElementInstance
        return [el.x - el.data.radius, el.y - el.data.radius - gap]
    }
    if (elementType === "rect") {
        const el = element as RectElementInstance
        return [el.x, el.y - gap]
    }
    if (elementType === "line") {
        const el = element as LineElementInstance
        return [
            (el.data.start[0] + el.data.end[0]) / 2,
            (el.data.start[1] + el.data.end[1]) / 2 - gap,
        ]
    }
    const el = element as ArrowElementInstance
    const center = getArrowCenter(el.data.points)
    return [center[0], center[1] - gap]
}

export function estimateLabelSize(
    text: string,
    scale = 1,
): { width: number; height: number; fontSize: number } {
    const fontSize = getLabelFontSize(scale)
    // Más ancho que el promedio real para que el hit-test cubra el glifo dibujado.
    const charWidth = Math.max(getLabelCharWidth(scale), fontSize * 0.7)
    const width = Math.max(fontSize * 1.25, text.length * charWidth + fontSize * 0.35)
    // Altura generosa: ascent + un poco bajo la baseline.
    const height = fontSize * 1.15
    return { width, height, fontSize }
}

export function resolveLabelPosition(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
    _canvasWidth: number,
    _canvasHeight: number,
    overlayScale = 1,
): { x: number; y: number; anchorX: number; anchorY: number } {
    const [anchorX, anchorY] = getDefaultLabelAnchor(elementType, element, overlayScale)
    const offset = element.labelOffset
    const x = anchorX + (offset?.[0] ?? 0)
    const y = anchorY + (offset?.[1] ?? 0)
    return { x, y, anchorX, anchorY }
}

function buildItem(
    elementType: OrderBadgeElementType,
    element: ElementInstance,
    index: number,
    canvasWidth: number,
    canvasHeight: number,
    overlayScale: number,
): LabelOverlayItem | null {
    const text = element.label?.trim()
    if (!text) return null
    const pos = resolveLabelPosition(
        elementType,
        element,
        canvasWidth,
        canvasHeight,
        overlayScale,
    )
    const size = estimateLabelSize(text, overlayScale)
    return {
        key: `${elementType}-label-${element.id ?? index}`,
        text,
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
        fontSize: size.fontSize,
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
    viewScale = 1,
}: BuildParams): LabelOverlayItem[] {
    const overlayScale = getExerciseOverlayScale(
        { images, arrows, circles, rects, lines },
        viewScale,
    )
    const items: LabelOverlayItem[] = []

    images.forEach((element, index) => {
        const item = buildItem("image", element, index, canvasWidth, canvasHeight, overlayScale)
        if (item) items.push(item)
    })
    arrows.forEach((element, index) => {
        const item = buildItem("arrow", element, index, canvasWidth, canvasHeight, overlayScale)
        if (item) items.push(item)
    })
    circles.forEach((element, index) => {
        const item = buildItem("circle", element, index, canvasWidth, canvasHeight, overlayScale)
        if (item) items.push(item)
    })
    rects.forEach((element, index) => {
        const item = buildItem("rect", element, index, canvasWidth, canvasHeight, overlayScale)
        if (item) items.push(item)
    })
    lines.forEach((element, index) => {
        const item = buildItem("line", element, index, canvasWidth, canvasHeight, overlayScale)
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
        // Caja amplia: evita que el clic “se cuele” al elemento debajo del título.
        const padX = Math.max(12, label.fontSize * 0.45)
        const padY = Math.max(10, label.fontSize * 0.55)
        const left = label.x - padX
        const right = label.x + label.width + padX
        const top = label.y - label.height - padY
        const bottom = label.y + padY
        if (x >= left && x <= right && y >= top && y <= bottom) return label
    }
    return null
}

