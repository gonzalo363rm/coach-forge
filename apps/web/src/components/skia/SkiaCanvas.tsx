"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import CanvasKitInit from "canvaskit-wasm/bin/full/canvaskit";

import { SkiaCanvasHandle, SkiaCanvasProps, SkiaWebpSnapshotOptions } from "@/interfaces";
import {
  EXERCISE_PREVIEW_PIXEL_RATIO,
  EXERCISE_PREVIEW_WEBP_QUALITY_PERCENT,
  webglCanvasToWebpBytes,
} from "@/utils/image"

// Cache global para CanvasKit (singleton)
let canvasKitPromise: Promise<any> | null = null;

function loadCanvasKit(): Promise<any> {
  if (canvasKitPromise) return canvasKitPromise;

  canvasKitPromise = CanvasKitInit({
    locateFile: (file: string) => `/canvaskit/${file}`,
  });

  return canvasKitPromise;
}

/**
 * Componente de Canvas usando CanvasKit (Skia WebAssembly) directamente
 * Compatible con Next.js sin necesidad de react-native-skia
 */
export const SkiaCanvas = forwardRef<SkiaCanvasHandle, SkiaCanvasProps>(
  function SkiaCanvas({ width, height, onDraw, onPointerDown, onPointerMove, onPointerUp, onContextMenu, onDrop, onReady, className }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const surfaceRef = useRef<any>(null);
  const ckRef = useRef<any>(null);
  const onDrawRef = useRef(onDraw);
  const onReadyRef = useRef(onReady);
  const skipNextContextMenuRef = useRef(false);
  onDrawRef.current = onDraw;
  onReadyRef.current = onReady;

  // Exponer funciones via ref
  useImperativeHandle(ref, () => {
    const paintFrame = (): boolean => {
      if (!surfaceRef.current || !ckRef.current) return false;
      try {
        const ck = ckRef.current;
        const surface = surfaceRef.current;
        const canvas = surface.getCanvas();
        canvas.clear(ck.TRANSPARENT);
        onDrawRef.current(canvas, ck);
        surface.flush();
        return true;
      } catch (err) {
        console.error("Error en paintFrame de SkiaCanvas:", err);
        return false;
      }
    };

    const getWebpSnapshot = async (
      options?: SkiaWebpSnapshotOptions,
    ): Promise<Uint8Array | null> => {
      const ck = ckRef.current;
      const el = canvasRef.current;
      if (!ck || !el) return null;

      const scale = Math.max(
        1,
        Math.min(3, options?.scale ?? EXERCISE_PREVIEW_PIXEL_RATIO),
      );
      const draw =
        options?.draw ??
        ((canvas: any, ckArg: any) => {
          onDrawRef.current(canvas, ckArg);
        });

      const w = el.width;
      const h = el.height;
      if (w < 1 || h < 1) return null;

      const outW = Math.round(w * scale);
      const outH = Math.round(h * scale);

      // Surface de software a mayor resolución: nítido y sin depender del buffer WebGL.
      const surface = typeof ck.MakeSurface === "function" ? ck.MakeSurface(outW, outH) : null;
      if (surface) {
        try {
          const canvas = surface.getCanvas();
          canvas.clear(ck.TRANSPARENT);
          canvas.save();
          canvas.scale(scale, scale);
          draw(canvas, ck);
          canvas.restore();
          surface.flush();

          const image = surface.makeImageSnapshot();
          if (image) {
            try {
              const bytes = image.encodeToBytes(
                ck.ImageFormat.WEBP,
                EXERCISE_PREVIEW_WEBP_QUALITY_PERCENT,
              );
              if (bytes && bytes.byteLength > 0) {
                return bytes;
              }
            } finally {
              image.delete();
            }
          }
        } catch (err) {
          console.error("Error en snapshot hi-res de SkiaCanvas:", err);
        } finally {
          surface.delete();
        }
      }

      // Fallback: leer el canvas WebGL visible a 1×.
      if (!paintFrame()) return null;
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (!canvasRef.current) return null;
      return webglCanvasToWebpBytes(canvasRef.current);
    };

    return {
      redraw: () => {
        paintFrame();
      },
      getWebpSnapshot,
      saveAsImage: (filename = "skia-canvas.webp") => {
        void getWebpSnapshot().then((bytes) => {
          if (!bytes) return;

          const blob = new Blob([new Uint8Array(bytes)], { type: "image/webp" });
          const url = URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          URL.revokeObjectURL(url);
        });
      },
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initSkia() {
      try {
        const ck = await loadCanvasKit();
        
        if (!mounted || !canvasRef.current) return;

        ckRef.current = ck;

        // Crear surface
        const surface = ck.MakeWebGLCanvasSurface(canvasRef.current);
        if (!surface) {
          throw new Error("No se pudo crear el surface WebGL");
        }

        surfaceRef.current = surface;

        // Renderizar
        try {
          const canvas = surface.getCanvas();
          canvas.clear(ck.TRANSPARENT);
          onDrawRef.current(canvas, ck);
          surface.flush();
          setIsLoading(false);
          onReadyRef.current?.();
        } catch (err) {
          console.error("Error al renderizar SkiaCanvas:", err);
          setIsLoading(false);
        }

      } catch (err) {
        console.error("Error inicializando CanvasKit:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Error desconocido");
          setIsLoading(false);
        }
      }
    }

    initSkia();

    return () => {
      mounted = false;
      if (surfaceRef.current) {
        surfaceRef.current.delete();
        surfaceRef.current = null;
      }
    };
  }, [width, height]);

  // Obtener coordenadas relativas al canvas
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const { x, y } = getCanvasCoords(e);
    onPointerDown?.(x, y);
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    onPointerMove?.(x, y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    onPointerUp?.();
    const target = e.target as HTMLCanvasElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (skipNextContextMenuRef.current) {
      skipNextContextMenuRef.current = false;
      return;
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onContextMenu?.(x, y);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 2) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    skipNextContextMenuRef.current = true;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onContextMenu?.(x, y);
  };

  // Handlers para drag & drop desde elementos externos
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDropEvent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData("application/json");
    console.log("Drop event received, data:", data);
    if (!data || !onDrop) {
      console.log("No data or onDrop handler");
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log("Calling onDrop with x:", x, "y:", y);
    onDrop(x, y, data);
  };

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 ${className}`}
        style={{ width, height }}
      >
        <span className="text-sm">Error: {error}</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`} 
      style={{ width, height }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
            <span className="text-xs text-zinc-500">Cargando...</span>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width, height, touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDrop={handleDropEvent}
      />
    </div>
  );
});

export default SkiaCanvas;
