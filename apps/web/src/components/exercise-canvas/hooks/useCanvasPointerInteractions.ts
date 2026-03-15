import { useCallback } from "react"
import type { Dispatch, MutableRefObject, SetStateAction } from "react"

import type { ArrowElementInstance, CircleElementInstance, ImageElementInstance, LineElementInstance, Point, RectElementInstance, ToolType } from "@/interfaces"

import type { ShapeTool, TempShape } from "../canvas-helpers"

export type DragTarget =
    | { type: "image"; index: number }
    | { type: "circle"; index: number }
    | { type: "rect"; index: number }
    | { type: "line"; index: number }
    | { type: "arrow-start"; index: number }
    | { type: "arrow-end"; index: number }
    | { type: "arrow-control"; index: number; controlIndex: number }
    | null

export type ContextTarget =
    | { type: "image"; index: number }
    | { type: "circle"; index: number }
    | { type: "rect"; index: number }
    | { type: "line"; index: number }
    | { type: "arrow"; index: number }
    | null

interface Args {
    currentTool: ToolType
    contextMenuIsOpen: boolean
    images: ImageElementInstance[]
    arrows: ArrowElementInstance[]
    circles: CircleElementInstance[]
    rects: RectElementInstance[]
    lines: LineElementInstance[]
    isDrawingArrow: boolean
    tempArrow: ArrowElementInstance | null
    isDrawingShape: boolean
    tempShape: TempShape | null
    setContextMenu: Dispatch<SetStateAction<{ isOpen: boolean; x: number; y: number; target: ContextTarget }>>
    setTempArrow: Dispatch<SetStateAction<ArrowElementInstance | null>>
    setIsDrawingArrow: Dispatch<SetStateAction<boolean>>
    setTempShape: Dispatch<SetStateAction<TempShape | null>>
    setIsDrawingShape: Dispatch<SetStateAction<boolean>>
    setSelectedArrowId: Dispatch<SetStateAction<string | null>>
    setSelectedElement: Dispatch<SetStateAction<ContextTarget>>
    setCurrentTool: (tool: ToolType) => void
    setCircles: Dispatch<SetStateAction<CircleElementInstance[]>>
    setRects: Dispatch<SetStateAction<RectElementInstance[]>>
    setLines: Dispatch<SetStateAction<LineElementInstance[]>>
    setArrows: Dispatch<SetStateAction<ArrowElementInstance[]>>
    setImages: Dispatch<SetStateAction<ImageElementInstance[]>>
    draggingRef: MutableRefObject<DragTarget>
    isDrawingShapeRef: MutableRefObject<boolean>
    offsetRef: MutableRefObject<{ x: number; y: number }>
    generateId: () => string
    defaultArrowColor: string
    defaultArrowStroke: number
    defaultCircleColor: string
    defaultRectColor: string
    defaultLineColor: string
    minArrowLength: number
    withInitializedControls: (arrow: ArrowElementInstance) => ArrowElementInstance
    getArrowLengthFromPoints: (start: Point, end: Point) => number
    getShapeBounds: (shape: TempShape) => { left: number; top: number; width: number; height: number }
    findArrowHandleAt: (x: number, y: number) => DragTarget
    findTopElementAt: (x: number, y: number) => ContextTarget
}

export const useCanvasPointerInteractions = ({
    currentTool,
    contextMenuIsOpen,
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
    defaultArrowColor,
    defaultArrowStroke,
    defaultCircleColor,
    defaultRectColor,
    defaultLineColor,
    minArrowLength,
    withInitializedControls,
    getArrowLengthFromPoints,
    getShapeBounds,
    findArrowHandleAt,
    findTopElementAt,
}: Args) => {
    const handlePointerDown = useCallback((x: number, y: number) => {
        if (contextMenuIsOpen) {
            setContextMenu((prev) => ({ ...prev, isOpen: false, target: null }))
        }

        if (currentTool === "arrow") {
            const newArrow: ArrowElementInstance = {
                id: generateId(),
                definitionId: "arrow",
                type: "arrow",
                x,
                y,
                data: { points: [[x, y], [x, y]] },
                style: { strokeColor: defaultArrowColor, strokeWidth: defaultArrowStroke },
            }
            setTempArrow(newArrow)
            setIsDrawingArrow(true)
            setSelectedArrowId(null)
            setSelectedElement(null)
            return
        }

        if (currentTool === "circle" || currentTool === "rect" || currentTool === "square" || currentTool === "line") {
            draggingRef.current = null
            isDrawingShapeRef.current = true
            setTempShape({ tool: currentTool as ShapeTool, startX: x, startY: y, endX: x, endY: y })
            setIsDrawingShape(true)
            setSelectedArrowId(null)
            setSelectedElement(null)
            return
        }

        const arrowHandle = findArrowHandleAt(x, y)
        if (arrowHandle) {
            draggingRef.current = arrowHandle
            setSelectedArrowId(arrows[arrowHandle.index].id)
            setSelectedElement({ type: "arrow", index: arrowHandle.index })
            return
        }

        const topElement = findTopElementAt(x, y)
        if (!topElement) {
            setSelectedArrowId(null)
            setSelectedElement(null)
            return
        }

        if (topElement.type === "image") {
            draggingRef.current = topElement
            offsetRef.current = { x: x - images[topElement.index].x, y: y - images[topElement.index].y }
            setSelectedArrowId(null)
            setSelectedElement(topElement)
            return
        }

        if (topElement.type === "circle") {
            draggingRef.current = topElement
            offsetRef.current = { x: x - circles[topElement.index].x, y: y - circles[topElement.index].y }
            setSelectedArrowId(null)
            setSelectedElement(null)
            return
        }

        if (topElement.type === "rect") {
            draggingRef.current = topElement
            offsetRef.current = { x: x - rects[topElement.index].x, y: y - rects[topElement.index].y }
            setSelectedArrowId(null)
            setSelectedElement(null)
            return
        }

        if (topElement.type === "line") {
            draggingRef.current = topElement
            offsetRef.current = { x, y }
            setSelectedArrowId(null)
            setSelectedElement(null)
            return
        }

        setSelectedArrowId(arrows[topElement.index].id)
        setSelectedElement(topElement)
    }, [arrows, circles, contextMenuIsOpen, currentTool, defaultArrowColor, defaultArrowStroke, findArrowHandleAt, findTopElementAt, generateId, images, isDrawingShapeRef, rects, setContextMenu, setIsDrawingArrow, setIsDrawingShape, setSelectedArrowId, setSelectedElement, setTempArrow, setTempShape])

    const handlePointerMove = useCallback((x: number, y: number) => {
        if (isDrawingShapeRef.current) {
            setTempShape((prev) => (prev ? { ...prev, endX: x, endY: y } : prev))
            return
        }

        if (isDrawingArrow && tempArrow) {
            setTempArrow((prev) => {
                if (!prev) return prev
                const points: Point[] = [...prev.data.points]
                points[1] = [x, y]
                return { ...prev, data: { points } }
            })
            return
        }

        if (!draggingRef.current) return
        const dragTarget = draggingRef.current

        if (dragTarget.type === "image") {
            setImages((prev) => {
                const updated = [...prev]
                updated[dragTarget.index] = { ...updated[dragTarget.index], x: x - offsetRef.current.x, y: y - offsetRef.current.y }
                return updated
            })
            return
        }

        if (dragTarget.type === "circle") {
            setCircles((prev) => {
                const updated = [...prev]
                updated[dragTarget.index] = { ...updated[dragTarget.index], x: x - offsetRef.current.x, y: y - offsetRef.current.y }
                return updated
            })
            return
        }

        if (dragTarget.type === "rect") {
            setRects((prev) => {
                const updated = [...prev]
                updated[dragTarget.index] = { ...updated[dragTarget.index], x: x - offsetRef.current.x, y: y - offsetRef.current.y }
                return updated
            })
            return
        }

        if (dragTarget.type === "line") {
            const dx = x - offsetRef.current.x
            const dy = y - offsetRef.current.y
            offsetRef.current = { x, y }
            setLines((prev) => {
                const updated = [...prev]
                const current = updated[dragTarget.index]
                updated[dragTarget.index] = {
                    ...current,
                    x: current.x + dx,
                    y: current.y + dy,
                    data: {
                        start: [current.data.start[0] + dx, current.data.start[1] + dy],
                        end: [current.data.end[0] + dx, current.data.end[1] + dy],
                    },
                }
                return updated
            })
            return
        }

        setArrows((prev) => {
            const updated = [...prev]
            const arrow = updated[dragTarget.index]
            const points: Point[] = [...arrow.data.points]
            if (dragTarget.type === "arrow-start") points[0] = [x, y]
            else if (dragTarget.type === "arrow-end") points[points.length - 1] = [x, y]
            else if (dragTarget.type === "arrow-control") points[dragTarget.controlIndex] = [x, y]
            updated[dragTarget.index] = { ...arrow, x: points[0][0], y: points[0][1], data: { points } }
            return updated
        })
    }, [draggingRef, isDrawingArrow, isDrawingShapeRef, offsetRef, setArrows, setCircles, setImages, setLines, setRects, setTempArrow, setTempShape, tempArrow])

    const handlePointerUp = useCallback(() => {
        if (isDrawingArrow && tempArrow) {
            const completedArrow = withInitializedControls(tempArrow)
            const points = completedArrow.data.points
            const length = getArrowLengthFromPoints(points[0], points[points.length - 1])
            if (length > minArrowLength) {
                setArrows((prev) => [...prev, completedArrow])
                setSelectedArrowId(completedArrow.id)
            }
            setTempArrow(null)
            setIsDrawingArrow(false)
            setCurrentTool("select")
        }

        if (isDrawingShape && tempShape) {
            const { left, top, width, height } = getShapeBounds(tempShape)
            if (width > 8 && height > 8) {
                if (tempShape.tool === "circle") {
                    const radius = Math.min(width, height) / 2
                    setCircles((prev) => [...prev, { id: generateId(), definitionId: "circle", type: "circle", x: left + width / 2, y: top + height / 2, zIndex: 0, data: { radius }, style: { strokeWidth: 3, strokeColor: defaultCircleColor } }])
                } else if (tempShape.tool === "line") {
                    setLines((prev) => [...prev, {
                        id: generateId(),
                        definitionId: "line",
                        type: "line",
                        x: tempShape.startX,
                        y: tempShape.startY,
                        zIndex: 0,
                        data: { start: [tempShape.startX, tempShape.startY], end: [tempShape.endX, tempShape.endY] },
                        style: { strokeWidth: 3, strokeColor: defaultLineColor },
                    }])
                } else {
                    setRects((prev) => [...prev, { id: generateId(), definitionId: tempShape.tool === "square" ? "square" : "rect", type: "rect", x: left, y: top, zIndex: 0, data: { width, height }, style: { strokeWidth: 3, strokeColor: defaultRectColor } }])
                }
            }
            setTempShape(null)
            setIsDrawingShape(false)
            isDrawingShapeRef.current = false
            setCurrentTool("select")
        }

        isDrawingShapeRef.current = false
        draggingRef.current = null
    }, [defaultCircleColor, defaultLineColor, defaultRectColor, draggingRef, generateId, getArrowLengthFromPoints, getShapeBounds, isDrawingArrow, isDrawingShape, isDrawingShapeRef, minArrowLength, setArrows, setCircles, setCurrentTool, setIsDrawingArrow, setIsDrawingShape, setLines, setRects, setSelectedArrowId, setTempArrow, setTempShape, tempArrow, tempShape, withInitializedControls])

    const handleContextMenu = useCallback((x: number, y: number) => {
        const target = findTopElementAt(x, y)
        if (!target) {
            setContextMenu({ isOpen: false, x: 0, y: 0, target: null })
            return
        }
        if (target.type === "arrow") setSelectedArrowId(arrows[target.index].id)
        else setSelectedArrowId(null)
        setSelectedElement(target)
        setContextMenu({ isOpen: true, x, y, target })
    }, [arrows, findTopElementAt, setContextMenu, setSelectedArrowId, setSelectedElement])

    return { handlePointerDown, handlePointerMove, handlePointerUp, handleContextMenu }
}

