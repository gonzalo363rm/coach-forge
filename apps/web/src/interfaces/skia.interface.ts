export type SkiaSnapshotDraw = (canvas: any, ck: any) => void

export type SkiaWebpSnapshotOptions = {
    /** Multiplicador de resolución (default 2). */
    scale?: number
    /** Draw custom; si no se pasa, usa el `onDraw` del canvas. */
    draw?: SkiaSnapshotDraw
    /** Ancho lógico del snapshot (default: ancho del canvas visible). */
    width?: number
    /** Alto lógico del snapshot (default: alto del canvas visible). */
    height?: number
}

export interface SkiaCanvasHandle {
    redraw: () => void
    getWebpSnapshot: (options?: SkiaWebpSnapshotOptions) => Promise<Uint8Array | null>
    saveAsImage: (filename?: string) => void
}

export type SkiaPointerModifiers = {
    ctrlKey: boolean
    metaKey: boolean
    shiftKey: boolean
    altKey: boolean
}

export interface SkiaCanvasProps {
    width: number
    height: number
    onDraw: (canvas: any, ck: any) => void
    onPointerDown?: (x: number, y: number, button: number, modifiers: SkiaPointerModifiers) => void
    onPointerMove?: (x: number, y: number, modifiers: SkiaPointerModifiers) => void
    onPointerUp?: (button: number) => void
    onContextMenu?: (x: number, y: number) => void
    onDrop?: (x: number, y: number, data: string) => void
    onReady?: () => void
    className?: string
    cursor?: string
    /**
     * Activa gestos táctiles (pinch-zoom/pan, long-press).
     * Solo afecta `pointerType === "touch"`; el mouse sigue igual.
     */
    touchGestures?: boolean
    /** Pinch con 2 dedos: centro, factor de escala relativo y pan en px de pantalla. */
    onPinch?: (
        centerX: number,
        centerY: number,
        scaleDelta: number,
        panDx: number,
        panDy: number,
    ) => void
    /** Cancela la acción del primer dedo al iniciar un gesto de 2 dedos. */
    onGestureCancel?: () => void
}
