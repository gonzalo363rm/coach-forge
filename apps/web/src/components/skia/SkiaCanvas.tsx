"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import CanvasKitInit from "canvaskit-wasm/bin/full/canvaskit";

import { SkiaCanvasHandle, SkiaCanvasProps, SkiaWebpSnapshotOptions } from "@/interfaces";
import {
  EXERCISE_PREVIEW_MAX_OUTPUT_SIDE,
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

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_PX = 8;

type ActivePointer = {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
};

/**
 * Componente de Canvas usando CanvasKit (Skia WebAssembly) directamente
 * Compatible con Next.js sin necesidad de react-native-skia
 */
export const SkiaCanvas = forwardRef<SkiaCanvasHandle, SkiaCanvasProps>(
  function SkiaCanvas({
    width,
    height,
    onDraw,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onContextMenu,
    onDrop,
    onReady,
    className,
    cursor,
    touchGestures = false,
    onPinch,
    onGestureCancel,
  }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const surfaceRef = useRef<any>(null);
  const ckRef = useRef<any>(null);
  const skipNextContextMenuRef = useRef(false);
  const activePointersRef = useRef<Map<number, ActivePointer>>(new Map());
  const pinchBaseDistanceRef = useRef(0);
  const pinchBaseCenterRef = useRef({ x: 0, y: 0 });
  const isPinchingRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const suppressNextClickUpRef = useRef(false);
  const onDrawRef = useRef(onDraw);
  const onReadyRef = useRef(onReady);
  const onPinchRef = useRef(onPinch);
  const onGestureCancelRef = useRef(onGestureCancel);
  const onContextMenuRef = useRef(onContextMenu);
  onDrawRef.current = onDraw;
  onReadyRef.current = onReady;
  onPinchRef.current = onPinch;
  onGestureCancelRef.current = onGestureCancel;
  onContextMenuRef.current = onContextMenu;

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

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

      const w = Math.max(1, Math.round(options?.width ?? el.width));
      const h = Math.max(1, Math.round(options?.height ?? el.height));
      if (w < 1 || h < 1) return null;

      let outScale = scale;
      const maxSide = Math.max(w, h);
      if (maxSide * outScale > EXERCISE_PREVIEW_MAX_OUTPUT_SIDE) {
        outScale = EXERCISE_PREVIEW_MAX_OUTPUT_SIDE / maxSide;
      }

      const outW = Math.max(1, Math.round(w * outScale));
      const outH = Math.max(1, Math.round(h * outScale));

      // Surface de software a mayor resolución: nítido y sin depender del buffer WebGL.
      const surface = typeof ck.MakeSurface === "function" ? ck.MakeSurface(outW, outH) : null;
      if (surface) {
        try {
          const canvas = surface.getCanvas();
          canvas.clear(ck.TRANSPARENT);
          canvas.save();
          canvas.scale(outScale, outScale);
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
      clearLongPress();
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

  const getModifiers = (e: React.PointerEvent<HTMLCanvasElement>) => ({
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    shiftKey: e.shiftKey,
    altKey: e.altKey,
  });

  const pointerDistance = (a: ActivePointer, b: ActivePointer) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  };

  const pointerCenter = (a: ActivePointer, b: ActivePointer) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const isTouch = touchGestures && e.pointerType === "touch";

    if (isTouch) {
      const { x, y } = getCanvasCoords(e);
      activePointersRef.current.set(e.pointerId, {
        id: e.pointerId,
        x,
        y,
        startX: x,
        startY: y,
      });
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

      if (activePointersRef.current.size === 2) {
        clearLongPress();
        longPressFiredRef.current = false;
        if (!isPinchingRef.current) {
          onGestureCancelRef.current?.();
          suppressNextClickUpRef.current = true;
        }
        isPinchingRef.current = true;
        const pts = [...activePointersRef.current.values()];
        pinchBaseDistanceRef.current = Math.max(1, pointerDistance(pts[0], pts[1]));
        pinchBaseCenterRef.current = pointerCenter(pts[0], pts[1]);
        return;
      }

      if (activePointersRef.current.size === 1) {
        longPressFiredRef.current = false;
        clearLongPress();
        longPressTimerRef.current = setTimeout(() => {
          longPressFiredRef.current = true;
          suppressNextClickUpRef.current = true;
          onGestureCancelRef.current?.();
          onContextMenuRef.current?.(x, y);
        }, LONG_PRESS_MS);

        onPointerDown?.(x, y, 0, getModifiers(e));
      }
      return;
    }

    // 0 = izquierdo, 1 = rueda (pan)
    if (e.button !== 0 && e.button !== 1) return;
    if (e.button === 1) {
      e.preventDefault();
    }
    const { x, y } = getCanvasCoords(e);
    onPointerDown?.(x, y, e.button, getModifiers(e));
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const isTouch = touchGestures && e.pointerType === "touch";
    const { x, y } = getCanvasCoords(e);

    if (isTouch) {
      const existing = activePointersRef.current.get(e.pointerId);
      if (existing) {
        existing.x = x;
        existing.y = y;
      }

      if (isPinchingRef.current && activePointersRef.current.size >= 2) {
        const pts = [...activePointersRef.current.values()];
        const dist = Math.max(1, pointerDistance(pts[0], pts[1]));
        const center = pointerCenter(pts[0], pts[1]);
        const scaleDelta = dist / pinchBaseDistanceRef.current;
        const panDx = center.x - pinchBaseCenterRef.current.x;
        const panDy = center.y - pinchBaseCenterRef.current.y;
        pinchBaseDistanceRef.current = dist;
        pinchBaseCenterRef.current = center;
        onPinchRef.current?.(center.x, center.y, scaleDelta, panDx, panDy);
        return;
      }

      if (existing && activePointersRef.current.size === 1) {
        const moved = Math.hypot(x - existing.startX, y - existing.startY);
        if (moved > LONG_PRESS_MOVE_PX) {
          clearLongPress();
        }
      }
    }

    onPointerMove?.(x, y, getModifiers(e));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const isTouch = touchGestures && e.pointerType === "touch";

    if (isTouch) {
      activePointersRef.current.delete(e.pointerId);
      clearLongPress();

      if (activePointersRef.current.size < 2) {
        isPinchingRef.current = false;
      }

      const target = e.target as HTMLCanvasElement;
      if (target.hasPointerCapture(e.pointerId)) {
        target.releasePointerCapture(e.pointerId);
      }

      if (suppressNextClickUpRef.current || longPressFiredRef.current) {
        suppressNextClickUpRef.current = false;
        longPressFiredRef.current = false;
        return;
      }

      if (activePointersRef.current.size === 0) {
        onPointerUp?.(0);
      }
      return;
    }

    if (e.button !== 0 && e.button !== 1) return;
    onPointerUp?.(e.button);
    const target = e.target as HTMLCanvasElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!touchGestures || e.pointerType !== "touch") return;
    activePointersRef.current.delete(e.pointerId);
    clearLongPress();
    if (activePointersRef.current.size < 2) {
      isPinchingRef.current = false;
    }
    onGestureCancelRef.current?.();
  };

  const handleAuxClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Evita el autoscroll del navegador con el botón central.
    if (e.button === 1) {
      e.preventDefault();
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
        style={{ width, height, touchAction: "none", cursor: cursor ?? "default" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onMouseUp={handleMouseUp}
        onAuxClick={handleAuxClick}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDrop={handleDropEvent}
      />
    </div>
  );
});

export default SkiaCanvas;
