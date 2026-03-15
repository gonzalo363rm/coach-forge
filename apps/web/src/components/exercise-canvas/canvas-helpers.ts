import type { Point } from "@/interfaces"

export type ShapeTool = "circle" | "rect" | "square" | "line"

export interface TempShape {
    tool: ShapeTool
    startX: number
    startY: number
    endX: number
    endY: number
}

export const getArrowLengthFromPoints = (start: Point, end: Point): number => {
    const dx = end[0] - start[0]
    const dy = end[1] - start[1]
    return Math.sqrt(dx * dx + dy * dy)
}

export const getControlPointCount = (length: number): number => {
    if (length < 100) return 1
    if (length < 200) return 2
    if (length < 350) return 3
    return Math.min(5, Math.floor(length / 100))
}

export const initControlPoints = (start: Point, end: Point, count: number): Point[] => {
    const points: Point[] = []
    for (let i = 1; i <= count; i++) {
        const t = i / (count + 1)
        points.push([
            start[0] + (end[0] - start[0]) * t,
            start[1] + (end[1] - start[1]) * t,
        ])
    }
    return points
}

export const hexToColor = (hex: string, alpha = 255): [number, number, number, number] => {
    const normalized = hex.replace("#", "")
    const expanded = normalized.length === 3
        ? normalized.split("").map((char) => `${char}${char}`).join("")
        : normalized

    if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
        return [34, 197, 94, alpha]
    }

    return [
        Number.parseInt(expanded.slice(0, 2), 16),
        Number.parseInt(expanded.slice(2, 4), 16),
        Number.parseInt(expanded.slice(4, 6), 16),
        alpha,
    ]
}

export const rotatePoint = (point: Point, center: Point, degrees: number): Point => {
    const radians = (degrees * Math.PI) / 180
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)
    const dx = point[0] - center[0]
    const dy = point[1] - center[1]

    return [
        center[0] + dx * cos - dy * sin,
        center[1] + dx * sin + dy * cos,
    ]
}

export const getArrowCenter = (points: Point[]): Point => {
    const total = points.reduce<[number, number]>((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0])
    return [total[0] / points.length, total[1] / points.length]
}

export const clampRotation = (value: number, maxRotation: number): number => {
    if (Number.isNaN(value)) return 0
    return Math.max(0, Math.min(maxRotation, value))
}

export const getShapeBounds = (shape: TempShape) => {
    let x1 = shape.startX
    let y1 = shape.startY
    let x2 = shape.endX
    let y2 = shape.endY

    if (shape.tool === "square") {
        const dx = x2 - x1
        const dy = y2 - y1
        const side = Math.min(Math.abs(dx), Math.abs(dy))
        x2 = x1 + Math.sign(dx || 1) * side
        y2 = y1 + Math.sign(dy || 1) * side
    }

    const left = Math.min(x1, x2)
    const top = Math.min(y1, y2)
    const width = Math.abs(x2 - x1)
    const height = Math.abs(y2 - y1)

    return { left, top, width, height }
}

export const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) {
        param = dot / lenSq
    }

    let xx: number
    let yy: number

    if (param < 0) {
        xx = x1
        yy = y1
    } else if (param > 1) {
        xx = x2
        yy = y2
    } else {
        xx = x1 + param * C
        yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy
    return Math.sqrt(dx * dx + dy * dy)
}

export const catmullRomPoint = (t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point => {
    const t2 = t * t
    const t3 = t2 * t
    return [
        0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
    ]
}

export const isPointNearArrow = (x: number, y: number, points: Point[], threshold: number): boolean => {
    if (points.length < 2) return false

    if (points.length <= 2) {
        return distanceToLine(x, y, points[0][0], points[0][1], points[1][0], points[1][1]) <= threshold
    }

    const samples = 20
    let prevPoint = points[0]

    for (let seg = 0; seg < points.length - 1; seg++) {
        const p0 = points[Math.max(0, seg - 1)]
        const p1 = points[seg]
        const p2 = points[seg + 1]
        const p3 = points[Math.min(points.length - 1, seg + 2)]

        for (let i = 1; i <= samples; i++) {
            const t = i / samples
            const point = catmullRomPoint(t, p0, p1, p2, p3)
            const d = distanceToLine(x, y, prevPoint[0], prevPoint[1], point[0], point[1])
            if (d <= threshold) return true
            prevPoint = point
        }
    }

    return false
}

export const parsePlayersInput = (value: string): string[] =>
    value
        .split(",")
        .map((item) => item.trim())
        .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index)

export const getReadableTextColor = (hex: string): string => {
    const normalized = hex.replace("#", "")
    const expanded = normalized.length === 3
        ? normalized.split("").map((char) => `${char}${char}`).join("")
        : normalized

    if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
        return "#ffffff"
    }

    const r = Number.parseInt(expanded.slice(0, 2), 16)
    const g = Number.parseInt(expanded.slice(2, 4), 16)
    const b = Number.parseInt(expanded.slice(4, 6), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    return luminance > 0.6 ? "#18181b" : "#ffffff"
}

