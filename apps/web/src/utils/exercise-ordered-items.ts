import type {
    ArrowElementInstance,
    ExerciseCanvas,
    ImageElementInstance,
} from "@/interfaces"
import type { OrderedItemSummary } from "@/components/exercise-canvas/ExerciseOrderPanel"
import { getReadableTextColor } from "@/components/exercise-canvas/canvas-helpers"

const DEFAULT_ELEMENT_COLOR = "#22c55e"
const DEFAULT_ARROW_COLOR = DEFAULT_ELEMENT_COLOR

export function buildOrderedItemsFromCanvas(
    canvas: Pick<ExerciseCanvas, "images" | "arrows">,
    playerFilter: string = "all",
): OrderedItemSummary[] {
    const { images, arrows } = canvas

    const toSummary = (
        element: ImageElementInstance | ArrowElementInstance,
        index: number,
        type: "image" | "arrow",
    ): OrderedItemSummary | null => {
        if (typeof element.order !== "number") return null
        if (playerFilter !== "all" && !(element.assignedPlayers ?? []).includes(playerFilter)) {
            return null
        }

        const stroke =
            element.style?.strokeColor ??
            (type === "arrow" ? DEFAULT_ARROW_COLOR : DEFAULT_ELEMENT_COLOR)

        return {
            key: `${type}-${element.id ?? index}`,
            order: element.order,
            label: element.label?.trim() || "Sin titulo",
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

    return [...images.map((el, i) => toSummary(el, i, "image")), ...arrows.map((el, i) => toSummary(el, i, "arrow"))]
        .filter((item): item is OrderedItemSummary => item !== null)
        .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
}

export function playerOptionsFromCanvas(
    canvas: Pick<ExerciseCanvas, "images" | "arrows">,
): string[] {
    const players = [...canvas.images, ...canvas.arrows]
        .flatMap((element) => element.assignedPlayers ?? [])
        .map((player) => player.trim())
        .filter((player): player is string => Boolean(player))
    return Array.from(new Set(players)).sort((a, b) => a.localeCompare(b))
}
