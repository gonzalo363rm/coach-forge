import type { ArrowElementInstance, CircleElementInstance, ImageElementInstance, LineElementInstance, RectElementInstance } from "@/interfaces"
import type { MutableRefObject } from "react"

import type { TempShape } from "./canvas-helpers"
import { getArrowCenter, getShapeBounds, hexToColor } from "./canvas-helpers"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createSafeFont = (ck: any, size: number) => {
    if (typeof ck?.Font !== "function") return null
    try {
        return new ck.Font(null, size)
    } catch {
        return null
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const drawBackground = (canvas: any, ck: any, width: number, height: number, bgColor: [number, number, number, number]) => {
    const paint = new ck.Paint()
    paint.setColor(ck.Color(...bgColor))
    canvas.drawRect(ck.LTRBRect(0, 0, width, height), paint)
    paint.delete()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const drawImageElement = (canvas: any, ck: any, img: ImageElementInstance, imagesCacheRef: MutableRefObject<Map<string, any>>, showLabels = true) => {
    if (!img.data.imageRef) return

    let skiaImg = imagesCacheRef.current.get(img.data.imageRef)
    if (skiaImg instanceof Uint8Array) {
        skiaImg = ck.MakeImageFromEncoded(skiaImg)
        if (skiaImg) {
            imagesCacheRef.current.set(img.data.imageRef, skiaImg)
        }
    }

    if (skiaImg && typeof skiaImg.width === "function") {
        const srcRect = ck.LTRBRect(0, 0, skiaImg.width(), skiaImg.height())
        const boxW = img.data.width
        const boxH = img.data.height
        const keepAR = img.data.maintainAspectRatio ?? true
        const rotation = img.rotation ?? 0

        let dstLeft = -boxW / 2
        let dstTop = -boxH / 2
        let dstW = boxW
        let dstH = boxH

        if (keepAR) {
            const srcW = skiaImg.width()
            const srcH = skiaImg.height()
            const scale = Math.min(boxW / srcW, boxH / srcH)
            dstW = srcW * scale
            dstH = srcH * scale
            dstLeft = -boxW / 2 + (boxW - dstW) / 2
            dstTop = -boxH / 2 + (boxH - dstH) / 2
        }

        const centerX = img.x + boxW / 2
        const centerY = img.y + boxH / 2
        canvas.save()
        canvas.translate(centerX, centerY)
        if (rotation !== 0) {
            canvas.rotate(rotation, 0, 0)
        }
        const dstRect = ck.LTRBRect(dstLeft, dstTop, dstLeft + dstW, dstTop + dstH)
        canvas.drawImageRect(skiaImg, srcRect, dstRect, null)
        canvas.restore()
    }

    if (showLabels && img.label && typeof canvas.drawText === "function" && typeof ck.Font === "function") {
        const labelPaint = new ck.Paint()
        labelPaint.setColor(ck.Color(255, 255, 255, 240))
        labelPaint.setAntiAlias(true)
        const labelFont = createSafeFont(ck, 14)
        if (!labelFont) {
            labelPaint.delete()
            return
        }
        canvas.drawText(img.label, img.x, img.y - 8, labelPaint, labelFont)
        labelFont.delete()
        labelPaint.delete()
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const drawArrow = (canvas: any, ck: any, arrow: ArrowElementInstance, selectedArrowId: string | null, defaultStroke: number, defaultColor: string, isTemp = false, showLabels = true) => {
    const points = arrow.data.points
    if (points.length < 2) return

    const isSelected = arrow.id !== null && arrow.id === selectedArrowId
    const path = new ck.Path()
    path.moveTo(points[0][0], points[0][1])

    if (points.length === 2) {
        path.lineTo(points[1][0], points[1][1])
    } else if (points.length === 3) {
        path.quadTo(points[1][0], points[1][1], points[2][0], points[2][1])
    } else {
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)]
            const p1 = points[i]
            const p2 = points[i + 1]
            const p3 = points[Math.min(points.length - 1, i + 2)]

            const cp1x = p1[0] + (p2[0] - p0[0]) / 6
            const cp1y = p1[1] + (p2[1] - p0[1]) / 6
            const cp2x = p2[0] - (p3[0] - p1[0]) / 6
            const cp2y = p2[1] - (p3[1] - p1[1]) / 6
            path.cubicTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1])
        }
    }

    const paint = new ck.Paint()
    paint.setAntiAlias(true)
    paint.setStyle(ck.PaintStyle.Stroke)
    paint.setStrokeWidth(arrow.style?.strokeWidth ?? defaultStroke)
    paint.setStrokeCap(ck.StrokeCap.Round)
    paint.setColor(ck.Color(...hexToColor(arrow.style?.strokeColor ?? defaultColor)))
    canvas.drawPath(path, paint)

    const end = points[points.length - 1]
    const penultimate = points[Math.max(0, points.length - 2)]
    const angle = Math.atan2(end[1] - penultimate[1], end[0] - penultimate[0])

    const arrowHeadSize = 12
    const arrowPath = new ck.Path()
    arrowPath.moveTo(end[0], end[1])
    arrowPath.lineTo(
        end[0] - arrowHeadSize * Math.cos(angle - Math.PI / 6),
        end[1] - arrowHeadSize * Math.sin(angle - Math.PI / 6),
    )
    arrowPath.moveTo(end[0], end[1])
    arrowPath.lineTo(
        end[0] - arrowHeadSize * Math.cos(angle + Math.PI / 6),
        end[1] - arrowHeadSize * Math.sin(angle + Math.PI / 6),
    )
    canvas.drawPath(arrowPath, paint)
    arrowPath.delete()
    path.delete()

    if (!isTemp && isSelected) {
        const handlePaint = new ck.Paint()
        handlePaint.setAntiAlias(true)

        handlePaint.setColor(ck.Color(34, 197, 94, 210))
        canvas.drawCircle(points[0][0], points[0][1], 6, handlePaint)
        handlePaint.setColor(ck.Color(239, 68, 68, 210))
        canvas.drawCircle(end[0], end[1], 6, handlePaint)
        handlePaint.setColor(ck.Color(59, 130, 246, 210))
        for (let i = 1; i < points.length - 1; i++) {
            canvas.drawCircle(points[i][0], points[i][1], 5, handlePaint)
        }

        if (points.length > 2) {
            const guidePaint = new ck.Paint()
            guidePaint.setAntiAlias(true)
            guidePaint.setColor(ck.Color(150, 150, 150, 80))
            guidePaint.setStyle(ck.PaintStyle.Stroke)
            guidePaint.setStrokeWidth(1)
            for (let i = 0; i < points.length - 1; i++) {
                canvas.drawLine(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], guidePaint)
            }
            guidePaint.delete()
        }

        handlePaint.delete()
    }

    if (showLabels && arrow.label && typeof canvas.drawText === "function" && typeof ck.Font === "function") {
        const labelPaint = new ck.Paint()
        labelPaint.setColor(ck.Color(255, 255, 255, 240))
        labelPaint.setAntiAlias(true)
        const labelFont = createSafeFont(ck, 14)
        if (!labelFont) {
            labelPaint.delete()
            paint.delete()
            return
        }
        const center = getArrowCenter(points)
        canvas.drawText(arrow.label, center[0], center[1] - 8, labelPaint, labelFont)
        labelFont.delete()
        labelPaint.delete()
    }

    paint.delete()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const drawCircleElement = (canvas: any, ck: any, circle: CircleElementInstance, showLabels = true) => {
    const paint = new ck.Paint()
    paint.setAntiAlias(true)
    paint.setStyle(ck.PaintStyle.Stroke)
    paint.setStrokeWidth(circle.style?.strokeWidth ?? 3)
    paint.setColor(ck.Color(...hexToColor(circle.style?.strokeColor ?? "#3b82f6", 230)))
    canvas.drawCircle(circle.x, circle.y, circle.data.radius, paint)
    paint.delete()

    if (showLabels && circle.label && typeof canvas.drawText === "function" && typeof ck.Font === "function") {
        const labelPaint = new ck.Paint()
        labelPaint.setColor(ck.Color(255, 255, 255, 240))
        labelPaint.setAntiAlias(true)
        const labelFont = createSafeFont(ck, 14)
        if (!labelFont) {
            labelPaint.delete()
            return
        }
        canvas.drawText(circle.label, circle.x - circle.data.radius, circle.y - circle.data.radius - 8, labelPaint, labelFont)
        labelFont.delete()
        labelPaint.delete()
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const drawRectElement = (canvas: any, ck: any, rect: RectElementInstance, showLabels = true) => {
    const paint = new ck.Paint()
    paint.setAntiAlias(true)
    paint.setStyle(ck.PaintStyle.Stroke)
    paint.setStrokeWidth(rect.style?.strokeWidth ?? 3)
    paint.setColor(ck.Color(...hexToColor(rect.style?.strokeColor ?? "#a855f7", 230)))
    const cornerRadius = rect.data.cornerRadius ?? 0
    const rectBounds = ck.LTRBRect(rect.x, rect.y, rect.x + rect.data.width, rect.y + rect.data.height)
    if (cornerRadius > 0) {
        canvas.drawRRect(ck.RRectXY(rectBounds, cornerRadius, cornerRadius), paint)
    } else {
        canvas.drawRect(rectBounds, paint)
    }
    paint.delete()

    if (showLabels && rect.label && typeof canvas.drawText === "function" && typeof ck.Font === "function") {
        const labelPaint = new ck.Paint()
        labelPaint.setColor(ck.Color(255, 255, 255, 240))
        labelPaint.setAntiAlias(true)
        const labelFont = createSafeFont(ck, 14)
        if (!labelFont) {
            labelPaint.delete()
            return
        }
        canvas.drawText(rect.label, rect.x, rect.y - 8, labelPaint, labelFont)
        labelFont.delete()
        labelPaint.delete()
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const drawLineElement = (canvas: any, ck: any, line: LineElementInstance, showLabels = true) => {
    const paint = new ck.Paint()
    paint.setAntiAlias(true)
    paint.setStyle(ck.PaintStyle.Stroke)
    paint.setStrokeWidth(line.style?.strokeWidth ?? 3)
    paint.setStrokeCap(ck.StrokeCap.Round)
    paint.setColor(ck.Color(...hexToColor(line.style?.strokeColor ?? "#22c55e", 230)))
    canvas.drawLine(line.data.start[0], line.data.start[1], line.data.end[0], line.data.end[1], paint)
    paint.delete()

    if (showLabels && line.label && typeof canvas.drawText === "function" && typeof ck.Font === "function") {
        const labelPaint = new ck.Paint()
        labelPaint.setColor(ck.Color(255, 255, 255, 240))
        labelPaint.setAntiAlias(true)
        const labelFont = createSafeFont(ck, 14)
        if (!labelFont) {
            labelPaint.delete()
            return
        }
        const centerX = (line.data.start[0] + line.data.end[0]) / 2
        const centerY = (line.data.start[1] + line.data.end[1]) / 2
        canvas.drawText(line.label, centerX, centerY - 8, labelPaint, labelFont)
        labelFont.delete()
        labelPaint.delete()
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const drawTempShape = (canvas: any, ck: any, tempShape: TempShape) => {
    const { left, top, width, height } = getShapeBounds(tempShape)
    const previewPaint = new ck.Paint()
    previewPaint.setAntiAlias(true)
    previewPaint.setStyle(ck.PaintStyle.Stroke)
    previewPaint.setStrokeWidth(2)
    previewPaint.setColor(
        tempShape.tool === "circle"
            ? ck.Color(59, 130, 246, 230)
            : tempShape.tool === "line"
                ? ck.Color(34, 197, 94, 230)
                : ck.Color(168, 85, 247, 230)
    )

    if (tempShape.tool === "circle") {
        const radius = Math.min(width, height) / 2
        canvas.drawCircle(left + width / 2, top + height / 2, radius, previewPaint)
    } else if (tempShape.tool === "line") {
        canvas.drawLine(tempShape.startX, tempShape.startY, tempShape.endX, tempShape.endY, previewPaint)
    } else {
        canvas.drawRect(ck.LTRBRect(left, top, left + width, top + height), previewPaint)
    }
    previewPaint.delete()
}

