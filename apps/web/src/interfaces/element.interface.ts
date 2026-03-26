// ─── Tipos para el menu ──────────────────────────────────────────────
export type ToolType = 'arrow' | 'select' | 'circle' | 'rect' | 'square' | 'line' | 'dashed-line'

// ─── Tipos base ──────────────────────────────────────────────

export type ElementType =
  | "image"
  | "player"
  | "arrow"
  | "circle"
  | "rect"
  | "line";

export type Point = [number, number];

// ─── Definición (catálogo / plantilla) ───────────────────────
// Lo mínimo para describir un elemento disponible en el menú.

export interface ElementDefinition {
  id: string;
  type: ElementType;
  name: string;
  image: string;          // icono/imagen para mostrar en el catálogo
  width: number;
  height: number;
}

// ─── Instancias (canvas) ─────────────────────────────────────
// Cuando un elemento se coloca en el canvas, se crea una instancia
// con posición, transformaciones y datos específicos del tipo.

export interface BaseElementInstance {
  id: null | string;
  definitionId: string;   // referencia al ElementDefinition.id
  type: ElementType;

  // Posición
  x: number;
  y: number;

  // Transformaciones
  rotation?: number;
  scale?: number;
  zIndex?: number;

  // Metadatos opcionales
  label?: string;
  description?: string;
  order?: number;
  assignedPlayers?: string[];

  // Estilo visual
  style?: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    dash?: number[];
    opacity?: number;
  };
}

export interface ImageElementInstance extends BaseElementInstance {
  type: "image" | "player";
  data: {
    width: number;
    height: number;
    imageRef: string | null;
    maintainAspectRatio?: boolean;
  };
}

export interface ArrowElementInstance extends BaseElementInstance {
  type: "arrow";
  data: {
    points: Point[];                // [start, ...controlPoints, end]
  };
  style?: {
    strokeColor?: string;
    strokeWidth?: number;
    dash?: number[];
    opacity?: number;
  };
}

export interface CircleElementInstance extends BaseElementInstance {
  type: "circle";
  data: {
    radius: number;
  };
}

export interface RectElementInstance extends BaseElementInstance {
  type: "rect";
  data: {
    width: number;
    height: number;
    cornerRadius?: number;
  };
}

export interface LineElementInstance extends BaseElementInstance {
  type: "line";
  data: {
    start: Point;
    end: Point;
  };
}

export type ElementInstance =
  | ImageElementInstance
  | ArrowElementInstance
  | CircleElementInstance
  | RectElementInstance
  | LineElementInstance;
