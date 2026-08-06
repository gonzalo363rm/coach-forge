import type {
    ArrowElementInstance,
    CircleElementInstance,
    ImageElementInstance,
    LineElementInstance,
    Point,
    RectElementInstance,
} from "@/interfaces"

export type SelectionItemType = "image" | "circle" | "rect" | "line" | "arrow"

export type SelectionItem = {
    type: SelectionItemType
    id: string
}

export type CanvasElementsSnapshot = {
    images: ImageElementInstance[]
    circles: CircleElementInstance[]
    rects: RectElementInstance[]
    lines: LineElementInstance[]
    arrows: ArrowElementInstance[]
}

export type MarqueeRect = {
    x0: number
    y0: number
    x1: number
    y1: number
}

export type Bounds = {
    left: number
    top: number
    right: number
    bottom: number
}

export const PASTE_OFFSET = 20
export const MARQUEE_MIN_SIZE = 4

export function selectionKey(item: SelectionItem): string {
    return `${item.type}:${item.id}`
}

export function isSelected(
    selection: SelectionItem[],
    type: SelectionItemType,
    id: string | null | undefined,
): boolean {
    if (!id) return false
    return selection.some((item) => item.type === type && item.id === id)
}

export function normalizeMarquee(marquee: MarqueeRect): Bounds {
    return {
        left: Math.min(marquee.x0, marquee.x1),
        top: Math.min(marquee.y0, marquee.y1),
        right: Math.max(marquee.x0, marquee.x1),
        bottom: Math.max(marquee.y0, marquee.y1),
    }
}

export function marqueeSize(marquee: MarqueeRect): { width: number; height: number } {
    const bounds = normalizeMarquee(marquee)
    return {
        width: bounds.right - bounds.left,
        height: bounds.bottom - bounds.top,
    }
}

export function boundsIntersect(a: Bounds, b: Bounds): boolean {
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
}

export function getImageBounds(el: ImageElementInstance): Bounds {
    return {
        left: el.x,
        top: el.y,
        right: el.x + el.data.width,
        bottom: el.y + el.data.height,
    }
}

export function getCircleBounds(el: CircleElementInstance): Bounds {
    const r = el.data.radius
    return {
        left: el.x - r,
        top: el.y - r,
        right: el.x + r,
        bottom: el.y + r,
    }
}

export function getRectBounds(el: RectElementInstance): Bounds {
    return {
        left: el.x,
        top: el.y,
        right: el.x + el.data.width,
        bottom: el.y + el.data.height,
    }
}

export function getLineBounds(el: LineElementInstance): Bounds {
    return {
        left: Math.min(el.data.start[0], el.data.end[0]),
        top: Math.min(el.data.start[1], el.data.end[1]),
        right: Math.max(el.data.start[0], el.data.end[0]),
        bottom: Math.max(el.data.start[1], el.data.end[1]),
    }
}

export function getArrowBounds(el: ArrowElementInstance): Bounds {
    const xs = el.data.points.map((p) => p[0])
    const ys = el.data.points.map((p) => p[1])
    return {
        left: Math.min(...xs),
        top: Math.min(...ys),
        right: Math.max(...xs),
        bottom: Math.max(...ys),
    }
}

/** Unión de todos los elementos del canvas (el más lejano en cada dirección). */
export function getCanvasContentBounds(canvas: CanvasElementsSnapshot): Bounds | null {
    const boundsList: Bounds[] = [
        ...canvas.images.map(getImageBounds),
        ...canvas.circles.map(getCircleBounds),
        ...canvas.rects.map(getRectBounds),
        ...canvas.lines.map(getLineBounds),
        ...canvas.arrows.map(getArrowBounds),
    ]

    if (boundsList.length === 0) return null

    return {
        left: Math.min(...boundsList.map((b) => b.left)),
        top: Math.min(...boundsList.map((b) => b.top)),
        right: Math.max(...boundsList.map((b) => b.right)),
        bottom: Math.max(...boundsList.map((b) => b.bottom)),
    }
}

/** Expande un bounds con un % de margen en cada lado (respecto al ancho/alto del contenido). */
export function expandBoundsWithMargin(bounds: Bounds, marginRatio: number): Bounds {
    const width = Math.max(1, bounds.right - bounds.left)
    const height = Math.max(1, bounds.bottom - bounds.top)
    const padX = width * marginRatio
    const padY = height * marginRatio
    return {
        left: bounds.left - padX,
        top: bounds.top - padY,
        right: bounds.right + padX,
        bottom: bounds.bottom + padY,
    }
}

export function getSelectionUnionBounds(
    selection: SelectionItem[],
    canvas: CanvasElementsSnapshot,
): Bounds | null {
    const boundsList: Bounds[] = []

    for (const item of selection) {
        if (item.type === "image") {
            const el = canvas.images.find((e) => e.id === item.id)
            if (el) boundsList.push(getImageBounds(el))
        } else if (item.type === "circle") {
            const el = canvas.circles.find((e) => e.id === item.id)
            if (el) boundsList.push(getCircleBounds(el))
        } else if (item.type === "rect") {
            const el = canvas.rects.find((e) => e.id === item.id)
            if (el) boundsList.push(getRectBounds(el))
        } else if (item.type === "line") {
            const el = canvas.lines.find((e) => e.id === item.id)
            if (el) boundsList.push(getLineBounds(el))
        } else {
            const el = canvas.arrows.find((e) => e.id === item.id)
            if (el) boundsList.push(getArrowBounds(el))
        }
    }

    if (boundsList.length === 0) return null

    return {
        left: Math.min(...boundsList.map((b) => b.left)),
        top: Math.min(...boundsList.map((b) => b.top)),
        right: Math.max(...boundsList.map((b) => b.right)),
        bottom: Math.max(...boundsList.map((b) => b.bottom)),
    }
}

export function collectSelectionInMarquee(
    marquee: MarqueeRect,
    canvas: CanvasElementsSnapshot,
): SelectionItem[] {
    const box = normalizeMarquee(marquee)
    const items: SelectionItem[] = []

    for (const el of canvas.images) {
        if (el.id && boundsIntersect(box, getImageBounds(el))) {
            items.push({ type: "image", id: el.id })
        }
    }
    for (const el of canvas.circles) {
        if (el.id && boundsIntersect(box, getCircleBounds(el))) {
            items.push({ type: "circle", id: el.id })
        }
    }
    for (const el of canvas.rects) {
        if (el.id && boundsIntersect(box, getRectBounds(el))) {
            items.push({ type: "rect", id: el.id })
        }
    }
    for (const el of canvas.lines) {
        if (el.id && boundsIntersect(box, getLineBounds(el))) {
            items.push({ type: "line", id: el.id })
        }
    }
    for (const el of canvas.arrows) {
        if (el.id && boundsIntersect(box, getArrowBounds(el))) {
            items.push({ type: "arrow", id: el.id })
        }
    }

    return items
}

function translatePoints(points: Point[], dx: number, dy: number): Point[] {
    return points.map(([x, y]) => [x + dx, y + dy])
}

export function translateImage(el: ImageElementInstance, dx: number, dy: number): ImageElementInstance {
    return { ...el, x: el.x + dx, y: el.y + dy }
}

export function translateCircle(el: CircleElementInstance, dx: number, dy: number): CircleElementInstance {
    return { ...el, x: el.x + dx, y: el.y + dy }
}

export function translateRect(el: RectElementInstance, dx: number, dy: number): RectElementInstance {
    return { ...el, x: el.x + dx, y: el.y + dy }
}

export function translateLine(el: LineElementInstance, dx: number, dy: number): LineElementInstance {
    return {
        ...el,
        x: el.x + dx,
        y: el.y + dy,
        data: {
            start: [el.data.start[0] + dx, el.data.start[1] + dy],
            end: [el.data.end[0] + dx, el.data.end[1] + dy],
        },
    }
}

export function translateArrow(el: ArrowElementInstance, dx: number, dy: number): ArrowElementInstance {
    const points = translatePoints(el.data.points, dx, dy)
    return {
        ...el,
        x: points[0]?.[0] ?? el.x + dx,
        y: points[0]?.[1] ?? el.y + dy,
        data: { points },
    }
}

export function applyDeltaToSelection(
    selection: SelectionItem[],
    canvas: CanvasElementsSnapshot,
    dx: number,
    dy: number,
): CanvasElementsSnapshot {
    const selected = new Set(selection.map(selectionKey))

    return {
        images: canvas.images.map((el) =>
            el.id && selected.has(selectionKey({ type: "image", id: el.id }))
                ? translateImage(el, dx, dy)
                : el,
        ),
        circles: canvas.circles.map((el) =>
            el.id && selected.has(selectionKey({ type: "circle", id: el.id }))
                ? translateCircle(el, dx, dy)
                : el,
        ),
        rects: canvas.rects.map((el) =>
            el.id && selected.has(selectionKey({ type: "rect", id: el.id }))
                ? translateRect(el, dx, dy)
                : el,
        ),
        lines: canvas.lines.map((el) =>
            el.id && selected.has(selectionKey({ type: "line", id: el.id }))
                ? translateLine(el, dx, dy)
                : el,
        ),
        arrows: canvas.arrows.map((el) =>
            el.id && selected.has(selectionKey({ type: "arrow", id: el.id }))
                ? translateArrow(el, dx, dy)
                : el,
        ),
    }
}

export function removeSelectionFromCanvas(
    selection: SelectionItem[],
    canvas: CanvasElementsSnapshot,
): CanvasElementsSnapshot {
    const selected = new Set(selection.map(selectionKey))

    return {
        images: canvas.images.filter(
            (el) => !(el.id && selected.has(selectionKey({ type: "image", id: el.id }))),
        ),
        circles: canvas.circles.filter(
            (el) => !(el.id && selected.has(selectionKey({ type: "circle", id: el.id }))),
        ),
        rects: canvas.rects.filter(
            (el) => !(el.id && selected.has(selectionKey({ type: "rect", id: el.id }))),
        ),
        lines: canvas.lines.filter(
            (el) => !(el.id && selected.has(selectionKey({ type: "line", id: el.id }))),
        ),
        arrows: canvas.arrows.filter(
            (el) => !(el.id && selected.has(selectionKey({ type: "arrow", id: el.id }))),
        ),
    }
}

function deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T
}

export function copySelectionToClipboard(
    selection: SelectionItem[],
    canvas: CanvasElementsSnapshot,
): CanvasElementsSnapshot {
    const selected = new Set(selection.map(selectionKey))

    return {
        images: canvas.images
            .filter((el) => el.id && selected.has(selectionKey({ type: "image", id: el.id })))
            .map((el) => deepClone(el)),
        circles: canvas.circles
            .filter((el) => el.id && selected.has(selectionKey({ type: "circle", id: el.id })))
            .map((el) => deepClone(el)),
        rects: canvas.rects
            .filter((el) => el.id && selected.has(selectionKey({ type: "rect", id: el.id })))
            .map((el) => deepClone(el)),
        lines: canvas.lines
            .filter((el) => el.id && selected.has(selectionKey({ type: "line", id: el.id })))
            .map((el) => deepClone(el)),
        arrows: canvas.arrows
            .filter((el) => el.id && selected.has(selectionKey({ type: "arrow", id: el.id })))
            .map((el) => deepClone(el)),
    }
}

export function clipboardHasContent(clipboard: CanvasElementsSnapshot | null): boolean {
    if (!clipboard) return false
    return (
        clipboard.images.length +
            clipboard.circles.length +
            clipboard.rects.length +
            clipboard.lines.length +
            clipboard.arrows.length >
        0
    )
}

export function pasteClipboard(
    clipboard: CanvasElementsSnapshot,
    generateId: () => string,
    offset = PASTE_OFFSET,
): { canvas: CanvasElementsSnapshot; selection: SelectionItem[] } {
    const selection: SelectionItem[] = []

    const images = clipboard.images.map((el) => {
        const id = generateId()
        selection.push({ type: "image", id })
        return { ...translateImage(deepClone(el), offset, offset), id }
    })
    const circles = clipboard.circles.map((el) => {
        const id = generateId()
        selection.push({ type: "circle", id })
        return { ...translateCircle(deepClone(el), offset, offset), id }
    })
    const rects = clipboard.rects.map((el) => {
        const id = generateId()
        selection.push({ type: "rect", id })
        return { ...translateRect(deepClone(el), offset, offset), id }
    })
    const lines = clipboard.lines.map((el) => {
        const id = generateId()
        selection.push({ type: "line", id })
        return { ...translateLine(deepClone(el), offset, offset), id }
    })
    const arrows = clipboard.arrows.map((el) => {
        const id = generateId()
        selection.push({ type: "arrow", id })
        return { ...translateArrow(deepClone(el), offset, offset), id }
    })

    return {
        canvas: { images, circles, rects, lines, arrows },
        selection,
    }
}

/** Clona el snapshot pegado para que el próximo paste desplace desde la última copia. */
export function clipboardFromPasted(pasted: CanvasElementsSnapshot): CanvasElementsSnapshot {
    return {
        images: pasted.images.map((el) => deepClone(el)),
        circles: pasted.circles.map((el) => deepClone(el)),
        rects: pasted.rects.map((el) => deepClone(el)),
        lines: pasted.lines.map((el) => deepClone(el)),
        arrows: pasted.arrows.map((el) => deepClone(el)),
    }
}

export function contextTargetToSelectionItem(
    target: { type: SelectionItemType; index: number },
    canvas: CanvasElementsSnapshot,
): SelectionItem | null {
    if (target.type === "image") {
        const id = canvas.images[target.index]?.id
        return id ? { type: "image", id } : null
    }
    if (target.type === "circle") {
        const id = canvas.circles[target.index]?.id
        return id ? { type: "circle", id } : null
    }
    if (target.type === "rect") {
        const id = canvas.rects[target.index]?.id
        return id ? { type: "rect", id } : null
    }
    if (target.type === "line") {
        const id = canvas.lines[target.index]?.id
        return id ? { type: "line", id } : null
    }
    const id = canvas.arrows[target.index]?.id
    return id ? { type: "arrow", id } : null
}
