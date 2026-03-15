'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ArrowElementInstance, CircleElementInstance, ElementDefinition, ImageElementInstance, LineElementInstance, RectElementInstance, SkiaCanvasHandle, ToolType } from "@/interfaces"
import SkiaCanvas from "@/components/skia/SkiaCanvas"
import { loadImageAsBytes } from "@/utils/image"
import { ExerciseOrderPanel, type OrderedItemSummary } from "./ExerciseOrderPanel"
import { ElementContextMenu } from "./ElementContextMenu"
import {
    clampRotation,
    distanceToLine,
    getArrowCenter,
    getArrowLengthFromPoints,
    getControlPointCount,
    getShapeBounds,
    getReadableTextColor,
    hexToColor,
    initControlPoints,
    isPointNearArrow,
    parsePlayersInput,
    rotatePoint,
    type TempShape,
} from "./canvas-helpers"
import { useCanvasPointerInteractions } from "./hooks/useCanvasPointerInteractions"
import {
    drawArrow as drawArrowHelper,
    drawBackground as drawBackgroundHelper,
    drawCircleElement as drawCircleElementHelper,
    drawImageElement as drawImageElementHelper,
    drawLineElement as drawLineElementHelper,
    drawRectElement as drawRectElementHelper,
    drawTempShape as drawTempShapeHelper,
} from "./canvas-drawers"

interface Props {
    currentTool: ToolType
    setCurrentTool: (tool: ToolType) => void
    selectedPaletteElement: ElementDefinition | null
}

type DragTarget =
    | { type: "image"; index: number }
    | { type: "circle"; index: number }
    | { type: "rect"; index: number }
    | { type: "line"; index: number }
    | { type: "arrow-start"; index: number }
    | { type: "arrow-end"; index: number }
    | { type: "arrow-control"; index: number; controlIndex: number }
    | null

type ContextTarget =
    | { type: "image"; index: number }
    | { type: "circle"; index: number }
    | { type: "rect"; index: number }
    | { type: "line"; index: number }
    | { type: "arrow"; index: number }
    | null

interface ContextMenuState {
    isOpen: boolean
    x: number
    y: number
    target: ContextTarget
}

type ResizeDirection = "width" | "height" | "both"

const DEFAULT_SCALE = 2
const MIN_ARROW_LENGTH = 10
const DEFAULT_ARROW_STROKE = 3
const DEFAULT_ELEMENT_COLOR = "#22c55e"
const DEFAULT_ARROW_COLOR = DEFAULT_ELEMENT_COLOR
const DEFAULT_CIRCLE_COLOR = DEFAULT_ELEMENT_COLOR
const DEFAULT_RECT_COLOR = DEFAULT_ELEMENT_COLOR
const DEFAULT_LINE_COLOR = DEFAULT_ELEMENT_COLOR
const DEFAULT_BACKGROUND_COLOR = "#27272a"
const MAX_ROTATION = 360
const MIN_CANVAS_WIDTH = 600
const MIN_CANVAS_HEIGHT = 400
const MIN_CANVAS_ZOOM = 0.5
const MAX_CANVAS_ZOOM = 2.5

export const ExerciseCanvas = ({ currentTool, setCurrentTool, selectedPaletteElement }: Props) => {
    const canvasRef = useRef<SkiaCanvasHandle>(null)
    const isCanvasHoveredRef = useRef(false)
    const draggingRef = useRef<DragTarget>(null)
    const isDrawingShapeRef = useRef(false)
    const offsetRef = useRef({ x: 0, y: 0 })

    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 600 })
    const [canvasBackgroundColor, setCanvasBackgroundColor] = useState(DEFAULT_BACKGROUND_COLOR)
    const [canvasZoom, setCanvasZoom] = useState(1)
    const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null)
    const [images, setImages] = useState<ImageElementInstance[]>([])
    const [circles, setCircles] = useState<CircleElementInstance[]>([])
    const [rects, setRects] = useState<RectElementInstance[]>([])
    const [lines, setLines] = useState<LineElementInstance[]>([])
    const [arrows, setArrows] = useState<ArrowElementInstance[]>([])
    const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null)
    const [isDrawingArrow, setIsDrawingArrow] = useState(false)
    const [tempArrow, setTempArrow] = useState<ArrowElementInstance | null>(null)
    const [isDrawingShape, setIsDrawingShape] = useState(false)
    const [tempShape, setTempShape] = useState<TempShape | null>(null)
    const [showOrderOverlay, setShowOrderOverlay] = useState(false)
    const [showTitleOverlay, setShowTitleOverlay] = useState(true)
    const [showCanvasOptions, setShowCanvasOptions] = useState(false)
    const [playerFilter, setPlayerFilter] = useState("all")
    const [assignedPlayersDraft, setAssignedPlayersDraft] = useState("")
    const [selectedElement, setSelectedElement] = useState<ContextTarget>(null)
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        isOpen: false,
        x: 0,
        y: 0,
        target: null,
    })

    // Todas las imagenes de los elementos que vamos a trabajar en el canvas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imagesCacheRef = useRef<Map<string, any>>(new Map())
    const resizeStartRef = useRef({ mouseX: 0, mouseY: 0, width: 1200, height: 600 })

    const generateId = () => Math.random().toString(36).slice(2, 9)

    const clampZoom = useCallback((value: number) => {
        return Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, Number(value.toFixed(2))))
    }, [])

    const nudgeZoom = useCallback((delta: number) => {
        setCanvasZoom((prev) => clampZoom(prev + delta))
    }, [clampZoom])

    const withInitializedControls = (arrow: ArrowElementInstance): ArrowElementInstance => {
        const start = arrow.data.points[0]
        const end = arrow.data.points[1]
        const length = getArrowLengthFromPoints(start, end)
        if (length <= MIN_ARROW_LENGTH) {
            return arrow
        }

        const controlCount = getControlPointCount(length)
        const controlPoints = initControlPoints(start, end, controlCount)

        return {
            ...arrow,
            x: start[0],
            y: start[1],
            data: {
                points: [start, ...controlPoints, end],
            },
        }
    }

    const getElementZ = (element: { zIndex?: number }): number => {
        const value = element.zIndex
        return Number.isFinite(value) ? (value as number) : 0
    }

    const loadImages = useCallback(async () => {
        const pending = images
            .filter((img) => img.data.imageRef && !imagesCacheRef.current.has(img.data.imageRef))
            .map(async (img) => {
                const ref = img.data.imageRef!
                const imageBytes = await loadImageAsBytes(ref, {
                    width: img.data.width,
                    height: img.data.height,
                    maintainAspectRatio: img.data.maintainAspectRatio ?? true,
                })
                if (imageBytes) {
                    imagesCacheRef.current.set(ref, imageBytes)
                }
            })

        await Promise.all(pending)
    }, [images])

    useEffect(() => {
        loadImages().then(() => {
            canvasRef.current?.redraw()
        })
    }, [loadImages])

    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            canvasRef.current?.redraw()
        })
        return () => cancelAnimationFrame(raf)
    }, [images, circles, rects, lines, arrows, tempArrow, tempShape, selectedArrowId, canvasSize, canvasBackgroundColor, canvasZoom])

    useEffect(() => {
        if (!contextMenu.isOpen || !contextMenu.target) return

        if (contextMenu.target.type === "image" && !images[contextMenu.target.index]) {
            setContextMenu((prev) => ({ ...prev, isOpen: false, target: null }))
        }

        if (contextMenu.target.type === "circle" && !circles[contextMenu.target.index]) {
            setContextMenu((prev) => ({ ...prev, isOpen: false, target: null }))
        }

        if (contextMenu.target.type === "rect" && !rects[contextMenu.target.index]) {
            setContextMenu((prev) => ({ ...prev, isOpen: false, target: null }))
        }

        if (contextMenu.target.type === "line" && !lines[contextMenu.target.index]) {
            setContextMenu((prev) => ({ ...prev, isOpen: false, target: null }))
        }

        if (contextMenu.target.type === "arrow" && !arrows[contextMenu.target.index]) {
            setContextMenu((prev) => ({ ...prev, isOpen: false, target: null }))
        }
    }, [arrows, circles, contextMenu, images, lines, rects])

    useEffect(() => {
        if (!resizeDirection) return

        const handleMouseMove = (event: MouseEvent) => {
            const dx = event.clientX - resizeStartRef.current.mouseX
            const dy = event.clientY - resizeStartRef.current.mouseY

            setCanvasSize(() => {
                const nextWidth = resizeDirection === "height"
                    ? resizeStartRef.current.width
                    : Math.max(MIN_CANVAS_WIDTH, Math.round(resizeStartRef.current.width + dx))
                const nextHeight = resizeDirection === "width"
                    ? resizeStartRef.current.height
                    : Math.max(MIN_CANVAS_HEIGHT, Math.round(resizeStartRef.current.height + dy))

                return { width: nextWidth, height: nextHeight }
            })
        }

        const handleMouseUp = () => {
            setResizeDirection(null)
        }

        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [resizeDirection])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drawBackground = useCallback((canvas: any, ck: any) => {
        drawBackgroundHelper(canvas, ck, canvasSize.width / canvasZoom, canvasSize.height / canvasZoom, hexToColor(canvasBackgroundColor))
    }, [canvasBackgroundColor, canvasSize, canvasZoom])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drawImageElement = useCallback((canvas: any, ck: any, img: ImageElementInstance) => {
        drawImageElementHelper(canvas, ck, img, imagesCacheRef, showTitleOverlay)
    }, [showTitleOverlay])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drawArrow = useCallback((canvas: any, ck: any, arrow: ArrowElementInstance, isTemp = false) => {
        drawArrowHelper(canvas, ck, arrow, selectedArrowId, DEFAULT_ARROW_STROKE, DEFAULT_ARROW_COLOR, isTemp, showTitleOverlay)
    }, [selectedArrowId, showTitleOverlay])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drawCircleElement = useCallback((canvas: any, ck: any, circle: CircleElementInstance) => {
        drawCircleElementHelper(canvas, ck, circle, showTitleOverlay)
    }, [showTitleOverlay])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drawRectElement = useCallback((canvas: any, ck: any, rect: RectElementInstance) => {
        drawRectElementHelper(canvas, ck, rect, showTitleOverlay)
    }, [showTitleOverlay])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const drawLineElement = useCallback((canvas: any, ck: any, line: LineElementInstance) => {
        drawLineElementHelper(canvas, ck, line, showTitleOverlay)
    }, [showTitleOverlay])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDraw = useCallback((canvas: any, ck: any) => {
        canvas.save()
        canvas.scale(canvasZoom, canvasZoom)
        drawBackground(canvas, ck)
        const renderQueue: Array<{ type: "image" | "arrow" | "circle" | "rect" | "line"; index: number; zIndex: number; sequence: number }> = [
            ...images.map((_, index) => ({ type: "image" as const, index, zIndex: getElementZ(images[index]), sequence: index })),
            ...circles.map((_, index) => ({ type: "circle" as const, index, zIndex: getElementZ(circles[index]), sequence: images.length + index })),
            ...rects.map((_, index) => ({ type: "rect" as const, index, zIndex: getElementZ(rects[index]), sequence: images.length + circles.length + index })),
            ...lines.map((_, index) => ({ type: "line" as const, index, zIndex: getElementZ(lines[index]), sequence: images.length + circles.length + rects.length + index })),
            ...arrows.map((_, index) => ({ type: "arrow" as const, index, zIndex: getElementZ(arrows[index]), sequence: images.length + circles.length + rects.length + lines.length + index })),
        ]

        renderQueue
            .sort((a, b) => a.zIndex - b.zIndex || a.sequence - b.sequence)
            .forEach((item) => {
                if (item.type === "image") {
                    drawImageElement(canvas, ck, images[item.index])
                } else if (item.type === "circle") {
                    drawCircleElement(canvas, ck, circles[item.index])
                } else if (item.type === "rect") {
                    drawRectElement(canvas, ck, rects[item.index])
                } else if (item.type === "line") {
                    drawLineElement(canvas, ck, lines[item.index])
                } else {
                    drawArrow(canvas, ck, arrows[item.index])
                }
            })

        if (tempArrow) {
            drawArrow(canvas, ck, tempArrow, true)
        }

        if (tempShape) {
            drawTempShapeHelper(canvas, ck, tempShape)
        }
        canvas.restore()
    }, [arrows, canvasZoom, circles, drawArrow, drawBackground, drawCircleElement, drawImageElement, drawLineElement, drawRectElement, images, lines, rects, tempArrow, tempShape])

    const findArrowHandleAt = (x: number, y: number): DragTarget => {
        if (!selectedArrowId) return null

        const selectedIndex = arrows.findIndex((arrow) => arrow.id === selectedArrowId)
        if (selectedIndex === -1) return null

        const points = arrows[selectedIndex].data.points
        if (points.length < 2) return null

        const hitRadius = 10
        const hitRadiusSquared = hitRadius * hitRadius

        for (let i = 1; i < points.length - 1; i++) {
            const dx = x - points[i][0]
            const dy = y - points[i][1]
            if (dx * dx + dy * dy <= hitRadiusSquared) {
                return { type: "arrow-control", index: selectedIndex, controlIndex: i }
            }
        }

        const end = points[points.length - 1]
        const dxEnd = x - end[0]
        const dyEnd = y - end[1]
        if (dxEnd * dxEnd + dyEnd * dyEnd <= hitRadiusSquared) {
            return { type: "arrow-end", index: selectedIndex }
        }

        const start = points[0]
        const dxStart = x - start[0]
        const dyStart = y - start[1]
        if (dxStart * dxStart + dyStart * dyStart <= hitRadiusSquared) {
            return { type: "arrow-start", index: selectedIndex }
        }

        return null
    }

    const findTopElementAt = (x: number, y: number): ContextTarget => {
        const queue: Array<{ type: "image" | "circle" | "rect" | "line" | "arrow"; index: number; zIndex: number; sequence: number }> = [
            ...images.map((_, index) => ({ type: "image" as const, index, zIndex: getElementZ(images[index]), sequence: index })),
            ...circles.map((_, index) => ({ type: "circle" as const, index, zIndex: getElementZ(circles[index]), sequence: images.length + index })),
            ...rects.map((_, index) => ({ type: "rect" as const, index, zIndex: getElementZ(rects[index]), sequence: images.length + circles.length + index })),
            ...lines.map((_, index) => ({ type: "line" as const, index, zIndex: getElementZ(lines[index]), sequence: images.length + circles.length + rects.length + index })),
            ...arrows.map((_, index) => ({ type: "arrow" as const, index, zIndex: getElementZ(arrows[index]), sequence: images.length + circles.length + rects.length + lines.length + index })),
        ]

        queue.sort((a, b) => b.zIndex - a.zIndex || b.sequence - a.sequence)

        for (const item of queue) {
            if (item.type === "image") {
                const image = images[item.index]
                if (x >= image.x && x <= image.x + image.data.width && y >= image.y && y <= image.y + image.data.height) {
                    return { type: "image", index: item.index }
                }
            } else if (item.type === "circle") {
                const circle = circles[item.index]
                const dx = x - circle.x
                const dy = y - circle.y
                if (dx * dx + dy * dy <= circle.data.radius * circle.data.radius) {
                    return { type: "circle", index: item.index }
                }
            } else if (item.type === "rect") {
                const rect = rects[item.index]
                if (x >= rect.x && x <= rect.x + rect.data.width && y >= rect.y && y <= rect.y + rect.data.height) {
                    return { type: "rect", index: item.index }
                }
            } else if (item.type === "line") {
                const line = lines[item.index]
                const d = distanceToLine(x, y, line.data.start[0], line.data.start[1], line.data.end[0], line.data.end[1])
                if (d <= Math.max(8, line.style?.strokeWidth ?? 3)) {
                    return { type: "line", index: item.index }
                }
            } else {
                const arrow = arrows[item.index]
                if (isPointNearArrow(x, y, arrow.data.points, 8)) {
                    return { type: "arrow", index: item.index }
                }
            }
        }

        return null
    }

    const updateContextElement = useCallback((
        updater: (
            element: ImageElementInstance | CircleElementInstance | RectElementInstance | LineElementInstance | ArrowElementInstance
        ) => ImageElementInstance | CircleElementInstance | RectElementInstance | LineElementInstance | ArrowElementInstance
    ) => {
        if (!contextMenu.target) return

        if (contextMenu.target.type === "image") {
            setImages((prev) => {
                const updated = [...prev]
                const current = updated[contextMenu.target!.index]
                if (!current) return prev
                updated[contextMenu.target!.index] = updater(current) as ImageElementInstance
                return updated
            })
            return
        }

        if (contextMenu.target.type === "circle") {
            setCircles((prev) => {
                const updated = [...prev]
                const current = updated[contextMenu.target!.index]
                if (!current) return prev
                updated[contextMenu.target!.index] = updater(current) as CircleElementInstance
                return updated
            })
            return
        }

        if (contextMenu.target.type === "rect") {
            setRects((prev) => {
                const updated = [...prev]
                const current = updated[contextMenu.target!.index]
                if (!current) return prev
                updated[contextMenu.target!.index] = updater(current) as RectElementInstance
                return updated
            })
            return
        }

        if (contextMenu.target.type === "line") {
            setLines((prev) => {
                const updated = [...prev]
                const current = updated[contextMenu.target!.index]
                if (!current) return prev
                updated[contextMenu.target!.index] = updater(current) as LineElementInstance
                return updated
            })
            return
        }

        setArrows((prev) => {
            const updated = [...prev]
            const current = updated[contextMenu.target!.index]
            if (!current) return prev
            updated[contextMenu.target!.index] = updater(current) as ArrowElementInstance
            return updated
        })
    }, [contextMenu.target])

    const deleteContextElement = useCallback(() => {
        if (!contextMenu.target) return

        if (contextMenu.target.type === "image") {
            setImages((prev) => prev.filter((_, index) => index !== contextMenu.target!.index))
        } else if (contextMenu.target.type === "circle") {
            setCircles((prev) => prev.filter((_, index) => index !== contextMenu.target!.index))
        } else if (contextMenu.target.type === "rect") {
            setRects((prev) => prev.filter((_, index) => index !== contextMenu.target!.index))
        } else if (contextMenu.target.type === "line") {
            setLines((prev) => prev.filter((_, index) => index !== contextMenu.target!.index))
        } else {
            const arrow = arrows[contextMenu.target.index]
            if (arrow?.id === selectedArrowId) {
                setSelectedArrowId(null)
            }
            setArrows((prev) => prev.filter((_, index) => index !== contextMenu.target!.index))
        }

        setSelectedElement(null)
        setContextMenu((prev) => ({ ...prev, isOpen: false, target: null }))
    }, [arrows, contextMenu.target, selectedArrowId])

    const contextElement = contextMenu.target
        ? contextMenu.target.type === "image"
            ? images[contextMenu.target.index]
            : contextMenu.target.type === "circle"
                ? circles[contextMenu.target.index]
                : contextMenu.target.type === "rect"
                    ? rects[contextMenu.target.index]
                    : contextMenu.target.type === "line"
                        ? lines[contextMenu.target.index]
            : arrows[contextMenu.target.index]
        : null

    useEffect(() => {
        if (!contextMenu.isOpen || !contextElement) {
            setAssignedPlayersDraft("")
            return
        }
        setAssignedPlayersDraft((contextElement.assignedPlayers ?? []).join(", "))
    }, [contextElement, contextMenu.isOpen])

    const playerOptions = useMemo(() => {
        const players = [...images, ...arrows]
            .flatMap((element) => element.assignedPlayers ?? [])
            .map((player) => player.trim())
            .filter((player): player is string => Boolean(player))
        return Array.from(new Set(players)).sort((a, b) => a.localeCompare(b))
    }, [arrows, images])

    const orderedItems = useMemo<OrderedItemSummary[]>(() => {
        const toSummary = (
            element: ImageElementInstance | ArrowElementInstance,
            index: number,
            type: "image" | "arrow"
        ): OrderedItemSummary | null => {
            if (typeof element.order !== "number") return null
            if (playerFilter !== "all" && !(element.assignedPlayers ?? []).includes(playerFilter)) return null

            return {
                key: `${type}-${element.id ?? index}`,
                order: element.order,
                label: element.label?.trim() || "Sin titulo",
                description: element.description?.trim(),
                assignedPlayers: element.assignedPlayers?.map((player) => player.trim()).filter(Boolean),
                badgeColor: element.style?.strokeColor ?? (type === "arrow" ? DEFAULT_ARROW_COLOR : DEFAULT_ELEMENT_COLOR),
                badgeTextColor: getReadableTextColor(
                    element.style?.strokeColor ?? (type === "arrow" ? DEFAULT_ARROW_COLOR : DEFAULT_ELEMENT_COLOR)
                ),
                targetType: type,
                targetIndex: index,
            }
        }

        return [
            ...images.map((element, index) => toSummary(element, index, "image")),
            ...arrows.map((element, index) => toSummary(element, index, "arrow")),
        ]
            .filter((item): item is OrderedItemSummary => item !== null)
            .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    }, [arrows, images, playerFilter])

    const orderOverlayItems = useMemo(() => {
        if (!showOrderOverlay) return []

        const clampX = (x: number) => Math.max(12, Math.min(canvasSize.width - 12, x))
        const clampY = (y: number) => Math.max(12, Math.min(canvasSize.height - 12, y))

        const imageBadges = images
            .filter((element) => typeof element.order === "number")
            .map((element, index) => ({
                key: `image-badge-${element.id ?? index}`,
                order: element.order as number,
                x: clampX(element.x - 14),
                y: clampY(element.y - 12),
                bgColor: element.style?.strokeColor ?? DEFAULT_ELEMENT_COLOR,
            }))

        const arrowBadges = arrows
            .filter((element) => typeof element.order === "number")
            .map((element, index) => {
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
            .map((element, index) => ({
                key: `circle-badge-${element.id ?? index}`,
                order: element.order as number,
                x: clampX(element.x - 14),
                y: clampY(element.y - 12),
                bgColor: element.style?.strokeColor ?? DEFAULT_CIRCLE_COLOR,
            }))

        const rectBadges = rects
            .filter((element) => typeof element.order === "number")
            .map((element, index) => ({
                key: `rect-badge-${element.id ?? index}`,
                order: element.order as number,
                x: clampX(element.x - 14),
                y: clampY(element.y - 12),
                bgColor: element.style?.strokeColor ?? DEFAULT_RECT_COLOR,
            }))

        const lineBadges = lines
            .filter((element) => typeof element.order === "number")
            .map((element, index) => ({
                key: `line-badge-${element.id ?? index}`,
                order: element.order as number,
                x: clampX((element.data.start[0] + element.data.end[0]) / 2 - 14),
                y: clampY((element.data.start[1] + element.data.end[1]) / 2 - 12),
                bgColor: element.style?.strokeColor ?? DEFAULT_LINE_COLOR,
            }))

        return [...imageBadges, ...arrowBadges, ...circleBadges, ...rectBadges, ...lineBadges]
    }, [arrows, canvasSize.height, canvasSize.width, circles, images, lines, rects, showOrderOverlay])

    // Drop de elemento del menú (de momento solo imagenes)
    const createImageInstanceFromDefinition = useCallback((x: number, y: number, elementDefinition: ElementDefinition): ImageElementInstance | null => {
        if (elementDefinition.type !== "image" && elementDefinition.type !== "player") {
            return null
        }

        const { id, type, ...rest } = elementDefinition

        return {
            ...rest,
            id: generateId(),
            definitionId: id,
            type,
            x: x - elementDefinition.width / 2,
            y: y - elementDefinition.height / 2,
            zIndex: 0,
            data: {
                width: elementDefinition.width * DEFAULT_SCALE,
                height: elementDefinition.height * DEFAULT_SCALE,
                imageRef: elementDefinition.image,
                maintainAspectRatio: true,
            },
            style: {
                strokeColor: DEFAULT_ELEMENT_COLOR,
            },
        }
    }, [])

    const handleDrop = useCallback((x: number, y: number, data: string) => {
        const elementDefinition: ElementDefinition = JSON.parse(data)
        const newImageElementInstance = createImageInstanceFromDefinition(x, y, elementDefinition)
        if (!newImageElementInstance) return

        setImages((prev) => [...prev, newImageElementInstance])
    }, [createImageInstanceFromDefinition])

    const handleRotateArrow = useCallback((nextRotation: number) => {
        updateContextElement((element) => {
            const arrow = element as ArrowElementInstance
            const currentRotation = arrow.rotation ?? 0
            const delta = nextRotation - currentRotation
            const center = getArrowCenter(arrow.data.points)
            const rotatedPoints = arrow.data.points.map((point) => rotatePoint(point, center, delta))

            return {
                ...arrow,
                x: rotatedPoints[0][0],
                y: rotatedPoints[0][1],
                rotation: nextRotation,
                data: { points: rotatedPoints },
            }
        })
    }, [updateContextElement])

    const getDefaultColorForTarget = useCallback((targetType: NonNullable<ContextTarget>["type"] | undefined): string => {
        if (targetType === "arrow") return DEFAULT_ARROW_COLOR
        if (targetType === "circle") return DEFAULT_CIRCLE_COLOR
        if (targetType === "rect") return DEFAULT_RECT_COLOR
        if (targetType === "line") return DEFAULT_LINE_COLOR
        return DEFAULT_ELEMENT_COLOR
    }, [])

    const handleDuplicateContextElement = useCallback(() => {
        if (!contextMenu.target) return

        const offset = 24
        if (contextMenu.target.type === "image") {
            const source = images[contextMenu.target.index]
            if (!source) return
            const duplicated: ImageElementInstance = {
                ...source,
                id: generateId(),
                x: source.x + offset,
                y: source.y + offset,
            }
            setImages((prev) => [...prev, duplicated])
            setSelectedElement({ type: "image", index: images.length })
        } else if (contextMenu.target.type === "circle") {
            const source = circles[contextMenu.target.index]
            if (!source) return
            const duplicated: CircleElementInstance = {
                ...source,
                id: generateId(),
                x: source.x + offset,
                y: source.y + offset,
            }
            setCircles((prev) => [...prev, duplicated])
            setSelectedElement({ type: "circle", index: circles.length })
        } else if (contextMenu.target.type === "rect") {
            const source = rects[contextMenu.target.index]
            if (!source) return
            const duplicated: RectElementInstance = {
                ...source,
                id: generateId(),
                x: source.x + offset,
                y: source.y + offset,
            }
            setRects((prev) => [...prev, duplicated])
            setSelectedElement({ type: "rect", index: rects.length })
        } else if (contextMenu.target.type === "line") {
            const source = lines[contextMenu.target.index]
            if (!source) return
            const duplicated: LineElementInstance = {
                ...source,
                id: generateId(),
                x: source.x + offset,
                y: source.y + offset,
                data: {
                    start: [source.data.start[0] + offset, source.data.start[1] + offset],
                    end: [source.data.end[0] + offset, source.data.end[1] + offset],
                },
            }
            setLines((prev) => [...prev, duplicated])
            setSelectedElement({ type: "line", index: lines.length })
        } else {
            const source = arrows[contextMenu.target.index]
            if (!source) return
            const points = source.data.points.map((point) => [point[0] + offset, point[1] + offset] as [number, number])
            const duplicated: ArrowElementInstance = {
                ...source,
                id: generateId(),
                x: source.x + offset,
                y: source.y + offset,
                data: { points },
            }
            setArrows((prev) => [...prev, duplicated])
            setSelectedArrowId(duplicated.id)
            setSelectedElement({ type: "arrow", index: arrows.length })
        }

        setContextMenu((prev) => ({ ...prev, isOpen: false, target: null }))
    }, [arrows, circles, contextMenu.target, images, lines, rects])

    const handleResizeStart = useCallback((event: React.MouseEvent, direction: ResizeDirection) => {
        event.preventDefault()
        event.stopPropagation()
        resizeStartRef.current = {
            mouseX: event.clientX,
            mouseY: event.clientY,
            width: canvasSize.width,
            height: canvasSize.height,
        }
        setResizeDirection(direction)
    }, [canvasSize.height, canvasSize.width])

    const handleEditOrderedItem = useCallback((item: OrderedItemSummary) => {
        const target: ContextTarget =
            item.targetType === "image"
                ? { type: "image", index: item.targetIndex }
                : { type: "arrow", index: item.targetIndex }

        if (target.type === "arrow") {
            const arrow = arrows[target.index]
            if (!arrow) return
            setSelectedArrowId(arrow.id)
        } else {
            if (!images[target.index]) return
            setSelectedArrowId(null)
        }

        setSelectedElement(target)
        setContextMenu({
            isOpen: true,
            x: Math.max(16, canvasSize.width - 300),
            y: 16,
            target,
        })
    }, [arrows, canvasSize.width, images])

    useEffect(() => {
        if (!showCanvasOptions) return
        const closeOptions = () => setShowCanvasOptions(false)
        window.addEventListener("pointerdown", closeOptions)
        return () => window.removeEventListener("pointerdown", closeOptions)
    }, [showCanvasOptions])

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.ctrlKey || event.metaKey || !isCanvasHoveredRef.current) return

            const target = event.target as HTMLElement | null
            if (target) {
                const tagName = target.tagName.toLowerCase()
                const isEditable =
                    target.isContentEditable ||
                    tagName === "input" ||
                    tagName === "textarea" ||
                    tagName === "select"
                if (isEditable) return
            }

            const plusPressed =
                event.code === "NumpadAdd" ||
                event.code === "Equal" ||
                event.key === "+" ||
                event.key === "="
            const minusPressed =
                event.code === "NumpadSubtract" ||
                event.code === "Minus" ||
                event.key === "-" ||
                event.key === "_"

            if (plusPressed) {
                event.preventDefault()
                nudgeZoom(0.1)
                return
            }

            if (minusPressed) {
                event.preventDefault()
                nudgeZoom(-0.1)
                return
            }

            if (event.key === "0") {
                event.preventDefault()
                setCanvasZoom(1)
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [nudgeZoom])

    const pointer = useCanvasPointerInteractions({
        currentTool,
        contextMenuIsOpen: contextMenu.isOpen,
        images,
        arrows,
        circles,
        rects,
        lines,
        isDrawingArrow,
        tempArrow,
        isDrawingShape,
        tempShape,
        setContextMenu,
        setTempArrow,
        setIsDrawingArrow,
        setTempShape,
        setIsDrawingShape,
        setSelectedArrowId,
        setSelectedElement,
        setCurrentTool,
        setCircles,
        setRects,
        setLines,
        setArrows,
        setImages,
        draggingRef,
        isDrawingShapeRef,
        offsetRef,
        generateId,
        defaultArrowColor: DEFAULT_ARROW_COLOR,
        defaultArrowStroke: DEFAULT_ARROW_STROKE,
        defaultCircleColor: DEFAULT_CIRCLE_COLOR,
        defaultRectColor: DEFAULT_RECT_COLOR,
        defaultLineColor: DEFAULT_LINE_COLOR,
        minArrowLength: MIN_ARROW_LENGTH,
        withInitializedControls,
        getArrowLengthFromPoints,
        getShapeBounds,
        findArrowHandleAt,
        findTopElementAt,
    })

    const toWorldCoords = useCallback((x: number, y: number) => ({
        x: x / canvasZoom,
        y: y / canvasZoom,
    }), [canvasZoom])

    const handleCanvasPointerDown = useCallback((x: number, y: number) => {
        const world = toWorldCoords(x, y)
        if (currentTool === "select" && selectedPaletteElement) {
            const newImageElementInstance = createImageInstanceFromDefinition(world.x, world.y, selectedPaletteElement)
            if (newImageElementInstance) {
                setImages((prev) => [...prev, newImageElementInstance])
                return
            }
        }
        pointer.handlePointerDown(world.x, world.y)
    }, [createImageInstanceFromDefinition, currentTool, pointer, selectedPaletteElement, toWorldCoords])

    const handleCanvasPointerMove = useCallback((x: number, y: number) => {
        const world = toWorldCoords(x, y)
        pointer.handlePointerMove(world.x, world.y)
    }, [pointer, toWorldCoords])

    const handleCanvasContextMenu = useCallback((x: number, y: number) => {
        const world = toWorldCoords(x, y)
        const target = findTopElementAt(world.x, world.y)
        if (!target) {
            setContextMenu({ isOpen: false, x: 0, y: 0, target: null })
            return
        }

        if (target.type === "arrow") {
            setSelectedArrowId(arrows[target.index].id)
        } else {
            setSelectedArrowId(null)
        }
        setSelectedElement(target)
        setContextMenu({
            isOpen: true,
            x,
            y,
            target,
        })
    }, [arrows, findTopElementAt, toWorldCoords])

    const handleCanvasDrop = useCallback((x: number, y: number, data: string) => {
        const world = toWorldCoords(x, y)
        handleDrop(world.x, world.y, data)
    }, [handleDrop, toWorldCoords])

    const handleCanvasWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
        if (!event.ctrlKey) return
        event.preventDefault()
        const direction = event.deltaY > 0 ? -0.1 : 0.1
        nudgeZoom(direction)
    }, [nudgeZoom])

    return (
        <div className="flex w-full items-start gap-4">
            <div className="flex flex-col gap-2">
                <div
                    className="relative overflow-visible rounded-xl shadow-2xl"
                    onWheel={handleCanvasWheel}
                    onPointerEnter={() => { isCanvasHoveredRef.current = true }}
                    onPointerLeave={() => { isCanvasHoveredRef.current = false }}
                >
                    <div className="absolute right-2 top-2 z-40">
                        <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                                event.stopPropagation()
                                setShowCanvasOptions((prev) => !prev)
                            }}
                            aria-label="Opciones del canvas"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100/90 text-zinc-700 backdrop-blur hover:bg-zinc-200 dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75A2.25 2.25 0 1 0 12 14.25 2.25 2.25 0 1 0 12 9.75z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12a7.5 7.5 0 0 0-.1-1.22l2-1.56-2-3.46-2.44.74a7.56 7.56 0 0 0-2.12-1.22L14.5 2h-5l-.34 3.28a7.56 7.56 0 0 0-2.12 1.22l-2.44-.74-2 3.46 2 1.56a7.5 7.5 0 0 0 0 2.44l-2 1.56 2 3.46 2.44-.74a7.56 7.56 0 0 0 2.12 1.22L9.5 22h5l.34-3.28a7.56 7.56 0 0 0 2.12-1.22l2.44.74 2-3.46-2-1.56c.07-.4.1-.81.1-1.22z" />
                            </svg>
                        </button>
                        {showCanvasOptions && (
                            <div
                                className="absolute right-0 mt-1 w-56 rounded-lg border border-zinc-300 bg-white p-2 text-xs shadow-lg dark:border-zinc-600 dark:bg-zinc-800"
                                onPointerDown={(event) => event.stopPropagation()}
                            >
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-zinc-600 dark:text-zinc-300">Mostrar orden</span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={showOrderOverlay}
                        onClick={() => setShowOrderOverlay((prev) => !prev)}
                                        className={`relative h-5 w-10 overflow-hidden rounded-full transition-colors ${
                            showOrderOverlay ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
                        }`}
                    >
                        <span
                                            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                                showOrderOverlay ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </button>
                </div>
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-zinc-600 dark:text-zinc-300">Mostrar titulos</span>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={showTitleOverlay}
                                        onClick={() => setShowTitleOverlay((prev) => !prev)}
                                        className={`relative h-5 w-10 overflow-hidden rounded-full transition-colors ${
                                            showTitleOverlay ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600"
                                        }`}
                                    >
                                        <span
                                            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                                                showTitleOverlay ? "translate-x-5" : "translate-x-0"
                                            }`}
                                        />
                                    </button>
                                </div>
                                <label className="mt-1 flex items-center justify-between gap-2 py-1">
                                    <span className="text-zinc-600 dark:text-zinc-300">Fondo</span>
                                    <input
                                        type="color"
                                        value={canvasBackgroundColor}
                                        onChange={(e) => setCanvasBackgroundColor(e.target.value)}
                                        className="h-6 w-8 rounded border border-zinc-300 bg-white p-0.5 dark:border-zinc-600 dark:bg-zinc-700"
                                    />
                                </label>
                                <div className="mt-1 flex items-center justify-between gap-2 py-1">
                                    <span className="text-zinc-600 dark:text-zinc-300">Zoom</span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setCanvasZoom((prev) => Math.max(MIN_CANVAS_ZOOM, Number((prev - 0.1).toFixed(2))))}
                                            className="h-6 w-6 rounded bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                                        >
                                            -
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCanvasZoom(1)}
                                            className="min-w-12 rounded bg-zinc-100 px-1 py-0.5 text-[11px] text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                                        >
                                            {Math.round(canvasZoom * 100)}%
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCanvasZoom((prev) => Math.min(MAX_CANVAS_ZOOM, Number((prev + 0.1).toFixed(2))))}
                                            className="h-6 w-6 rounded bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                <SkiaCanvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    onDraw={handleDraw}
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={pointer.handlePointerUp}
                    onContextMenu={handleCanvasContextMenu}
                    onDrop={handleCanvasDrop}
                />

                    {showOrderOverlay && (
                        <div className="pointer-events-none absolute inset-0 z-30">
                            {orderOverlayItems.map((badge) => (
                                <div
                                    key={badge.key}
                                    className="absolute flex h-6 min-w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full px-1 text-[11px] font-semibold shadow"
                                    style={{
                                        left: badge.x * canvasZoom,
                                        top: badge.y * canvasZoom,
                                        backgroundColor: badge.bgColor,
                                        color: getReadableTextColor(badge.bgColor),
                                    }}
                                >
                                    {badge.order}
                                </div>
                            ))}
                        </div>
                    )}

                    {contextMenu.isOpen && contextElement && contextMenu.target && (
                        <ElementContextMenu
                            isOpen={contextMenu.isOpen}
                            x={contextMenu.x}
                            y={contextMenu.y}
                            targetType={contextMenu.target.type}
                            contextElement={contextElement}
                            assignedPlayersDraft={assignedPlayersDraft}
                            maxRotation={MAX_ROTATION}
                            defaultElementColor={getDefaultColorForTarget(contextMenu.target.type)}
                            onAssignedPlayersDraftChange={setAssignedPlayersDraft}
                            onAssignedPlayersCommit={() => {
                                            const players = parsePlayersInput(assignedPlayersDraft)
                                            updateContextElement((element) => ({
                                                ...element,
                                                assignedPlayers: players.length === 0 ? undefined : players,
                                            }))
                                        }}
                            onUpdate={updateContextElement}
                            onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false, target: null }))}
                            onDelete={deleteContextElement}
                            onDuplicate={handleDuplicateContextElement}
                            onRotateArrow={(value) => handleRotateArrow(clampRotation(value, MAX_ROTATION))}
                        />
                    )}

                                    <button
                                        type="button"
                        aria-label="Redimensionar ancho"
                        onMouseDown={(event) => handleResizeStart(event, "width")}
                        className="absolute -right-2 top-1/2 z-40 h-16 w-3 -translate-y-1/2 cursor-ew-resize rounded-full bg-zinc-300/90 hover:bg-zinc-400 dark:bg-zinc-600/90 dark:hover:bg-zinc-500"
                    />
                                    <button
                                        type="button"
                        aria-label="Redimensionar alto"
                        onMouseDown={(event) => handleResizeStart(event, "height")}
                        className="absolute -bottom-2 left-1/2 z-40 h-3 w-16 -translate-x-1/2 cursor-ns-resize rounded-full bg-zinc-300/90 hover:bg-zinc-400 dark:bg-zinc-600/90 dark:hover:bg-zinc-500"
                    />
                    <button
                        type="button"
                        aria-label="Redimensionar ancho y alto"
                        onMouseDown={(event) => handleResizeStart(event, "both")}
                        className="absolute -bottom-2 -right-2 z-50 h-4 w-4 cursor-nwse-resize rounded-sm bg-zinc-300/90 hover:bg-zinc-400 dark:bg-zinc-600/90 dark:hover:bg-zinc-500"
                    />
                                </div>
                <div className="text-right text-[11px] text-zinc-500 dark:text-zinc-400">
                    {canvasSize.width} x {canvasSize.height}
                </div>
            </div>

            <ExerciseOrderPanel
                orderedItems={orderedItems}
                playerOptions={playerOptions}
                playerFilter={playerFilter}
                setPlayerFilter={setPlayerFilter}
                onEditItem={handleEditOrderedItem}
            />
        </div>
    )
}