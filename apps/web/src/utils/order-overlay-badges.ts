import type {
    ArrowElementInstance,
    CircleElementInstance,
    ExerciseCanvas,
    ImageElementInstance,
    LineElementInstance,
    RectElementInstance,
} from "@/interfaces"
import { getArrowCenter } from "@/components/exercise-canvas/canvas-helpers"

export type OrderOverlayBadge = {
    key: string
    order: number
    x: number
    y: number
    bgColor: string
}

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

export function buildOrderOverlayBadges({
    images,
    arrows,
    circles,
    rects,
    lines,
    canvasWidth,
    canvasHeight,
}: BuildParams): OrderOverlayBadge[] {
    const clampX = (x: number) => Math.max(12, Math.min(canvasWidth - 12, x))
    const clampY = (y: number) => Math.max(12, Math.min(canvasHeight - 12, y))

    const imageBadges = images
        .filter((element) => typeof element.order === "number")
        .map((element: ImageElementInstance, index) => ({
            key: `image-badge-${element.id ?? index}`,
            order: element.order as number,
            x: clampX(element.x - 14),
            y: clampY(element.y - 12),
            bgColor: element.style?.strokeColor ?? DEFAULT_ELEMENT_COLOR,
        }))

    const arrowBadges = arrows
        .filter((element) => typeof element.order === "number")
        .map((element: ArrowElementInstance, index) => {
            const center = getArrowCenter(element.data.points)
            return {
                key: `arrow-badge-${element.id ?? index}`,
                order: element.order as number,
                x: clampX(center[0] - 14),
                y: clampY(center[1] - 12),
                bgColor: element.style?.strokeColor ?? DEFAULT_ARROW_COLOR,
            }
        })

    const circleBadges = circles
        .filter((element) => typeof element.order === "number")
        .map((element: CircleElementInstance, index) => ({
            key: `circle-badge-${element.id ?? index}`,
            order: element.order as number,
            x: clampX(element.x - 14),
            y: clampY(element.y - 12),
            bgColor: element.style?.strokeColor ?? DEFAULT_CIRCLE_COLOR,
        }))

    const rectBadges = rects
        .filter((element) => typeof element.order === "number")
        .map((element: RectElementInstance, index) => ({
            key: `rect-badge-${element.id ?? index}`,
            order: element.order as number,
            x: clampX(element.x - 14),
            y: clampY(element.y - 12),
            bgColor: element.style?.strokeColor ?? DEFAULT_RECT_COLOR,
        }))

    const lineBadges = lines
        .filter((element) => typeof element.order === "number")
        .map((element: LineElementInstance, index) => ({
            key: `line-badge-${element.id ?? index}`,
            order: element.order as number,
            x: clampX((element.data.start[0] + element.data.end[0]) / 2 - 14),
            y: clampY((element.data.start[1] + element.data.end[1]) / 2 - 12),
            bgColor: element.style?.strokeColor ?? DEFAULT_LINE_COLOR,
        }))

    return [...imageBadges, ...arrowBadges, ...circleBadges, ...rectBadges, ...lineBadges]
}
