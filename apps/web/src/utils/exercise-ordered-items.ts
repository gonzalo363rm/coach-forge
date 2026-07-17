import type {
    ArrowElementInstance,
    CircleElementInstance,
    ExerciseCanvas,
    ImageElementInstance,
    LineElementInstance,
    RectElementInstance,
} from "@/interfaces"
import type { OrderedItemSummary } from "@/components/exercise-canvas/ExerciseOrderPanel"
import { getReadableTextColor } from "@/components/exercise-canvas/canvas-helpers"

export type OrderedTargetType = OrderedItemSummary["targetType"]

const DEFAULT_ELEMENT_COLOR = "#22c55e"
const DEFAULT_ARROW_COLOR = DEFAULT_ELEMENT_COLOR
const DEFAULT_CIRCLE_COLOR = DEFAULT_ELEMENT_COLOR
const DEFAULT_RECT_COLOR = DEFAULT_ELEMENT_COLOR
const DEFAULT_LINE_COLOR = DEFAULT_ELEMENT_COLOR

const DEFAULT_LABELS: Record<OrderedTargetType, string> = {
    image: "Sin titulo",
    arrow: "Flecha",
    circle: "Circulo",
    rect: "Rectangulo",
    line: "Linea",
}

type OrderedCanvasElement =
    | ImageElementInstance
    | ArrowElementInstance
    | CircleElementInstance
    | RectElementInstance
    | LineElementInstance

function defaultColorForType(type: OrderedTargetType): string {
    if (type === "arrow") return DEFAULT_ARROW_COLOR
    if (type === "circle") return DEFAULT_CIRCLE_COLOR
    if (type === "rect") return DEFAULT_RECT_COLOR
    if (type === "line") return DEFAULT_LINE_COLOR
    return DEFAULT_ELEMENT_COLOR
}

function toOrderedSummary(
    element: OrderedCanvasElement,
    index: number,
    type: OrderedTargetType,
    playerFilter: string,
): OrderedItemSummary | null {
    if (typeof element.order !== "number" || !Number.isFinite(element.order)) return null
    if (playerFilter !== "all" && !(element.assignedPlayers ?? []).includes(playerFilter)) {
        return null
    }

    const stroke = element.style?.strokeColor ?? defaultColorForType(type)

    return {
        key: `${type}-${element.id ?? index}`,
        order: element.order,
        label: element.label?.trim() || DEFAULT_LABELS[type],
        description: element.description?.trim(),
        assignedPlayers: element.assignedPlayers
            ?.map((player) => player.trim())
            .filter(Boolean),
        badgeColor: stroke,
        badgeTextColor: getReadableTextColor(stroke),
        targetType: type,
        targetIndex: index,
    }
}

export function buildOrderedItemsFromCanvas(
    canvas: Pick<ExerciseCanvas, "images" | "arrows" | "circles" | "rects" | "lines">,
    playerFilter: string = "all",
): OrderedItemSummary[] {
    const { images, arrows, circles, rects, lines } = canvas

    return [
        ...images.map((el, i) => toOrderedSummary(el, i, "image", playerFilter)),
        ...arrows.map((el, i) => toOrderedSummary(el, i, "arrow", playerFilter)),
        ...circles.map((el, i) => toOrderedSummary(el, i, "circle", playerFilter)),
        ...rects.map((el, i) => toOrderedSummary(el, i, "rect", playerFilter)),
        ...lines.map((el, i) => toOrderedSummary(el, i, "line", playerFilter)),
    ]
        .filter((item): item is OrderedItemSummary => item !== null)
        .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
}

export function playerOptionsFromCanvas(
    canvas: Pick<ExerciseCanvas, "images" | "arrows" | "circles" | "rects" | "lines">,
): string[] {
    const players = [
        ...canvas.images,
        ...canvas.arrows,
        ...canvas.circles,
        ...canvas.rects,
        ...canvas.lines,
    ]
        .flatMap((element) => element.assignedPlayers ?? [])
        .map((player) => player.trim())
        .filter((player): player is string => Boolean(player))
    return Array.from(new Set(players)).sort((a, b) => a.localeCompare(b))
}
