import { useCallback } from "react"
import type { Dispatch, MutableRefObject, SetStateAction } from "react"

import type {
    ArrowElementInstance,
    CircleElementInstance,
    ImageElementInstance,
    LineElementInstance,
    Point,
    RectElementInstance,
    ToolType,
} from "@/interfaces"

import type { ShapeTool, TempShape } from "../canvas-helpers"
import {
    applyDeltaToSelection,
    collectSelectionInMarquee,
    contextTargetToSelectionItem,
    isSelected,
    MARQUEE_MIN_SIZE,
    marqueeSize,
    type MarqueeRect,
    type SelectionItem,
} from "../canvas-selection"

export type DragTarget =
    | { type: "image"; index: number }
    | { type: "circle"; index: number }
    | { type: "rect"; index: number }
    | { type: "line"; index: number }
    | { type: "arrow-start"; index: number }
    | { type: "arrow-end"; index: number }
    | { type: "arrow-control"; index: number; controlIndex: number }
    | { type: "selection-group" }
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
    hasPaletteStamp: boolean
    contextMenuIsOpen: boolean
    images: ImageElementInstance[]
    arrows: ArrowElementInstance[]
    circles: CircleElementInstance[]
    rects: RectElementInstance[]
    lines: LineElementInstance[]
    selection: SelectionItem[]
    selectionRef: MutableRefObject<SelectionItem[]>
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
    setSelection: Dispatch<SetStateAction<SelectionItem[]>>
    setMarquee: Dispatch<SetStateAction<MarqueeRect | null>>
    setShowSelectionMenu: Dispatch<SetStateAction<boolean>>
    setCurrentTool: (tool: ToolType) => void
    setCircles: Dispatch<SetStateAction<CircleElementInstance[]>>
    setRects: Dispatch<SetStateAction<RectElementInstance[]>>
    setLines: Dispatch<SetStateAction<LineElementInstance[]>>
    setArrows: Dispatch<SetStateAction<ArrowElementInstance[]>>
    setImages: Dispatch<SetStateAction<ImageElementInstance[]>>
    draggingRef: MutableRefObject<DragTarget>
    isDrawingShapeRef: MutableRefObject<boolean>
    isDrawingMarqueeRef: MutableRefObject<boolean>
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
    hasPaletteStamp,
    contextMenuIsOpen,
    images,
    arrows,
    circles,
    rects,
    lines,
    selection,
    selectionRef,
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
    setSelection,
    setMarquee,
    setShowSelectionMenu,
    setCurrentTool,
    setCircles,
    setRects,
    setLines,
    setArrows,
    setImages,
    draggingRef,
    isDrawingShapeRef,
    isDrawingMarqueeRef,
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
    const canvasSnapshot = () => ({ images, arrows, circles, rects, lines })

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
            setSelection([])
            setShowSelectionMenu(false)
            setMarquee(null)
            return
        }

        if (
            currentTool === "circle" ||
            currentTool === "rect" ||
            currentTool === "square" ||
            currentTool === "line" ||
            currentTool === "dashed-line"
        ) {
            draggingRef.current = null
            isDrawingShapeRef.current = true
            setTempShape({ tool: currentTool as ShapeTool, startX: x, startY: y, endX: x, endY: y })
            setIsDrawingShape(true)
            setSelectedArrowId(null)
            setSelectedElement(null)
            setSelection([])
            setShowSelectionMenu(false)
            setMarquee(null)
            return
        }

        // Tool select (with optional palette stamp handled outside this hook)
        if (currentTool !== "select" || hasPaletteStamp) {
            return
        }

        const arrowHandle = findArrowHandleAt(x, y)
        if (arrowHandle && arrowHandle.type !== "selection-group") {
            const handleIndex =
                arrowHandle.type === "arrow-start" ||
                arrowHandle.type === "arrow-end" ||
                arrowHandle.type === "arrow-control"
                    ? arrowHandle.index
                    : -1
            const handleArrow = handleIndex >= 0 ? arrows[handleIndex] : null
            const onlyThisArrowSelected =
                handleArrow?.id != null &&
                selection.length === 1 &&
                selection[0]?.type === "arrow" &&
                selection[0].id === handleArrow.id

            if (onlyThisArrowSelected || selection.length === 0) {
                draggingRef.current = arrowHandle
                setSelectedArrowId(handleArrow?.id ?? null)
                if (handleIndex >= 0) {
                    setSelectedElement({ type: "arrow", index: handleIndex })
                    if (handleArrow?.id) {
                        setSelection([{ type: "arrow", id: handleArrow.id }])
                    }
                }
                setShowSelectionMenu(false)
                return
            }
        }

        const topElement = findTopElementAt(x, y)
        if (!topElement) {
            draggingRef.current = null
            isDrawingMarqueeRef.current = true
            setMarquee({ x0: x, y0: y, x1: x, y1: y })
            setSelectedArrowId(null)
            setSelectedElement(null)
            setShowSelectionMenu(false)
            return
        }

        const item = contextTargetToSelectionItem(topElement, canvasSnapshot())
        if (!item) {
            setSelectedArrowId(null)
            setSelectedElement(null)
            return
        }

        const alreadySelected = isSelected(selection, item.type, item.id)
        if (!alreadySelected) {
            setSelection([item])
            setSelectedElement(topElement)
            setSelectedArrowId(item.type === "arrow" ? item.id : null)
        } else {
            setSelectedElement(topElement)
            setSelectedArrowId(item.type === "arrow" ? item.id : null)
        }

        draggingRef.current = { type: "selection-group" }
        offsetRef.current = { x, y }
        setShowSelectionMenu(false)
        setMarquee(null)
    }, [
        arrows,
        circles,
        contextMenuIsOpen,
        currentTool,
        defaultArrowColor,
        defaultArrowStroke,
        findArrowHandleAt,
        findTopElementAt,
        generateId,
        hasPaletteStamp,
        images,
        isDrawingMarqueeRef,
        isDrawingShapeRef,
        lines,
        rects,
        selection,
        setContextMenu,
        setIsDrawingArrow,
        setIsDrawingShape,
        setMarquee,
        setSelectedArrowId,
        setSelectedElement,
        setSelection,
        setShowSelectionMenu,
        setTempArrow,
        setTempShape,
    ])

    const handlePointerMove = useCallback((x: number, y: number) => {
        if (isDrawingMarqueeRef.current) {
            setMarquee((prev) => (prev ? { ...prev, x1: x, y1: y } : prev))
            return
        }

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

        if (dragTarget.type === "selection-group") {
            const dx = x - offsetRef.current.x
            const dy = y - offsetRef.current.y
            if (dx === 0 && dy === 0) return
            offsetRef.current = { x, y }

            const selected = selectionRef.current
            setImages((prev) =>
                applyDeltaToSelection(selected, {
                    images: prev,
                    circles: [],
                    rects: [],
                    lines: [],
                    arrows: [],
                }, dx, dy).images,
            )
            setCircles((prev) =>
                applyDeltaToSelection(selected, {
                    images: [],
                    circles: prev,
                    rects: [],
                    lines: [],
                    arrows: [],
                }, dx, dy).circles,
            )
            setRects((prev) =>
                applyDeltaToSelection(selected, {
                    images: [],
                    circles: [],
                    rects: prev,
                    lines: [],
                    arrows: [],
                }, dx, dy).rects,
            )
            setLines((prev) =>
                applyDeltaToSelection(selected, {
                    images: [],
                    circles: [],
                    rects: [],
                    lines: prev,
                    arrows: [],
                }, dx, dy).lines,
            )
            setArrows((prev) =>
                applyDeltaToSelection(selected, {
                    images: [],
                    circles: [],
                    rects: [],
                    lines: [],
                    arrows: prev,
                }, dx, dy).arrows,
            )
            return
        }

        if (dragTarget.type === "image") {
            setImages((prev) => {
                const updated = [...prev]
                updated[dragTarget.index] = {
                    ...updated[dragTarget.index],
                    x: x - offsetRef.current.x,
                    y: y - offsetRef.current.y,
                }
                return updated
            })
            return
        }

        if (dragTarget.type === "circle") {
            setCircles((prev) => {
                const updated = [...prev]
                updated[dragTarget.index] = {
                    ...updated[dragTarget.index],
                    x: x - offsetRef.current.x,
                    y: y - offsetRef.current.y,
                }
                return updated
            })
            return
        }

        if (dragTarget.type === "rect") {
            setRects((prev) => {
                const updated = [...prev]
                updated[dragTarget.index] = {
                    ...updated[dragTarget.index],
                    x: x - offsetRef.current.x,
                    y: y - offsetRef.current.y,
                }
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
            updated[dragTarget.index] = {
                ...arrow,
                x: points[0][0],
                y: points[0][1],
                data: { points },
            }
            return updated
        })
    }, [
        draggingRef,
        isDrawingArrow,
        isDrawingMarqueeRef,
        isDrawingShapeRef,
        offsetRef,
        selectionRef,
        setArrows,
        setCircles,
        setImages,
        setLines,
        setMarquee,
        setRects,
        setTempArrow,
        setTempShape,
        tempArrow,
    ])

    const handlePointerUp = useCallback(() => {
        if (isDrawingMarqueeRef.current) {
            isDrawingMarqueeRef.current = false
            setMarquee((current) => {
                if (!current) {
                    setSelection([])
                    setShowSelectionMenu(false)
                    return null
                }

                const size = marqueeSize(current)
                if (size.width < MARQUEE_MIN_SIZE && size.height < MARQUEE_MIN_SIZE) {
                    setSelection([])
                    setShowSelectionMenu(false)
                    return null
                }

                const nextSelection = collectSelectionInMarquee(current, canvasSnapshot())
                setSelection(nextSelection)
                setShowSelectionMenu(nextSelection.length > 0)
                if (nextSelection.length === 1 && nextSelection[0]?.type === "arrow") {
                    setSelectedArrowId(nextSelection[0].id)
                } else {
                    setSelectedArrowId(null)
                }
                return null
            })
            draggingRef.current = null
            return
        }

        if (isDrawingArrow && tempArrow) {
            const completedArrow = withInitializedControls(tempArrow)
            const points = completedArrow.data.points
            const length = getArrowLengthFromPoints(points[0], points[points.length - 1])
            if (length > minArrowLength) {
                setArrows((prev) => [...prev, completedArrow])
                setSelectedArrowId(completedArrow.id)
                if (completedArrow.id) {
                    setSelection([{ type: "arrow", id: completedArrow.id }])
                    setShowSelectionMenu(true)
                }
            }
            setTempArrow(null)
            setIsDrawingArrow(false)
            setCurrentTool("select")
        }

        if (isDrawingShape && tempShape) {
            const { left, top, width, height } = getShapeBounds(tempShape)
            const isLineTool = tempShape.tool === "line" || tempShape.tool === "dashed-line"
            const lineLength = Math.hypot(
                tempShape.endX - tempShape.startX,
                tempShape.endY - tempShape.startY,
            )
            const hasMinimumSize = isLineTool ? lineLength > 8 : width > 8 && height > 8

            if (hasMinimumSize) {
                if (tempShape.tool === "circle") {
                    const radius = Math.min(width, height) / 2
                    const id = generateId()
                    setCircles((prev) => [
                        ...prev,
                        {
                            id,
                            definitionId: "circle",
                            type: "circle",
                            x: left + width / 2,
                            y: top + height / 2,
                            zIndex: 0,
                            data: { radius },
                            style: { strokeWidth: 3, strokeColor: defaultCircleColor },
                        },
                    ])
                    setSelection([{ type: "circle", id }])
                    setShowSelectionMenu(true)
                } else if (isLineTool) {
                    const id = generateId()
                    setLines((prev) => [
                        ...prev,
                        {
                            id,
                            definitionId: tempShape.tool,
                            type: "line",
                            x: tempShape.startX,
                            y: tempShape.startY,
                            zIndex: 0,
                            data: {
                                start: [tempShape.startX, tempShape.startY],
                                end: [tempShape.endX, tempShape.endY],
                            },
                            style: {
                                strokeWidth: 3,
                                strokeColor: defaultLineColor,
                                dash: tempShape.tool === "dashed-line" ? [12, 8] : undefined,
                            },
                        },
                    ])
                    setSelection([{ type: "line", id }])
                    setShowSelectionMenu(true)
                } else {
                    const id = generateId()
                    setRects((prev) => [
                        ...prev,
                        {
                            id,
                            definitionId: tempShape.tool === "square" ? "square" : "rect",
                            type: "rect",
                            x: left,
                            y: top,
                            zIndex: 0,
                            data: { width, height },
                            style: { strokeWidth: 3, strokeColor: defaultRectColor },
                        },
                    ])
                    setSelection([{ type: "rect", id }])
                    setShowSelectionMenu(true)
                }
            }
            setTempShape(null)
            setIsDrawingShape(false)
            isDrawingShapeRef.current = false
            setCurrentTool("select")
        }

        if (draggingRef.current?.type === "selection-group" || draggingRef.current) {
            setShowSelectionMenu((prev) => prev || selection.length > 0)
            if (selection.length > 0) {
                setShowSelectionMenu(true)
            }
        }

        isDrawingShapeRef.current = false
        draggingRef.current = null
    }, [
        defaultCircleColor,
        defaultLineColor,
        defaultRectColor,
        draggingRef,
        generateId,
        getArrowLengthFromPoints,
        getShapeBounds,
        images,
        arrows,
        circles,
        rects,
        lines,
        isDrawingArrow,
        isDrawingMarqueeRef,
        isDrawingShape,
        isDrawingShapeRef,
        minArrowLength,
        selection,
        setArrows,
        setCircles,
        setCurrentTool,
        setIsDrawingArrow,
        setIsDrawingShape,
        setLines,
        setMarquee,
        setRects,
        setSelectedArrowId,
        setSelection,
        setShowSelectionMenu,
        setTempArrow,
        setTempShape,
        tempArrow,
        tempShape,
        withInitializedControls,
    ])

    const handleContextMenu = useCallback((x: number, y: number) => {
        const target = findTopElementAt(x, y)
        if (!target) {
            setContextMenu({ isOpen: false, x: 0, y: 0, target: null })
            return
        }
        if (target.type === "arrow") setSelectedArrowId(arrows[target.index].id)
        else setSelectedArrowId(null)
        setSelectedElement(target)
        setShowSelectionMenu(false)
        setContextMenu({ isOpen: true, x, y, target })
    }, [arrows, findTopElementAt, setContextMenu, setSelectedArrowId, setSelectedElement, setShowSelectionMenu])

    return { handlePointerDown, handlePointerMove, handlePointerUp, handleContextMenu }
}
