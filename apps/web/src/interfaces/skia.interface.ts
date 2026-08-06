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

export interface SkiaCanvasProps {
    width: number
    height: number
    onDraw: (canvas: any, ck: any) => void
    onPointerDown?: (x: number, y: number) => void
    onPointerMove?: (x: number, y: number) => void
    onPointerUp?: () => void
    onContextMenu?: (x: number, y: number) => void
    onDrop?: (x: number, y: number, data: string) => void
    onReady?: () => void
    className?: string
}
