export interface SkiaCanvasHandle {
    redraw: () => void;
    saveAsImage: (filename?: string) => void;
}

export interface SkiaCanvasProps {
    width: number;
    height: number;
    onDraw: (canvas: any, ck: any) => void;
    onPointerDown?: (x: number, y: number) => void;
    onPointerMove?: (x: number, y: number) => void;
    onPointerUp?: () => void;
    onContextMenu?: (x: number, y: number) => void;
    onDrop?: (x: number, y: number, data: string) => void;
    className?: string;
}