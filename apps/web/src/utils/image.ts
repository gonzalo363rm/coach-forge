/**
 * Devuelve como Uint8Array. Necesario para dibujar en Skia/CanvasKit.
 * - PNG/JPG: devuelve los bytes originales.
 * - SVG: rasteriza a PNG (usando canvas 2D) y devuelve bytes PNG.
 * Devuelve null si hay algún error durante la carga.
 */

/** Calidad WebP para vistas previas de ejercicios (0–1, `toBlob` / fallback). */
export const EXERCISE_PREVIEW_WEBP_QUALITY = 0.92

/** Calidad 0–100 para `Image.encodeToBytes` de CanvasKit. */
export const EXERCISE_PREVIEW_WEBP_QUALITY_PERCENT = 92

/** Escala de rasterización al exportar la vista previa (2 = retina). */
export const EXERCISE_PREVIEW_PIXEL_RATIO = 2

export function htmlCanvasToEncodedBytes(
    canvas: HTMLCanvasElement,
    mime: string,
    quality?: number,
): Promise<Uint8Array | null> {
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) return resolve(null)
                blob.arrayBuffer().then((buffer) => resolve(new Uint8Array(buffer)))
            },
            mime,
            quality,
        )
    })
}

/** PNG desde un canvas 2D ya pintado (p. ej. rasterizar SVG para CanvasKit). */
export function htmlCanvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array | null> {
    return htmlCanvasToEncodedBytes(canvas, "image/png")
}

/** WebP desde un canvas 2D ya pintado. */
export function htmlCanvasToWebpBytes(canvas: HTMLCanvasElement): Promise<Uint8Array | null> {
    return htmlCanvasToEncodedBytes(canvas, "image/webp", EXERCISE_PREVIEW_WEBP_QUALITY)
}

/**
 * Exporta un canvas WebGL (p. ej. CanvasKit) copiando a 2D y codificando.
 * `toBlob` sobre el WebGL directo suele dar imagen vacía; `drawImage` es estable.
 */
function webglCanvasToEncodedBytes(
    source: HTMLCanvasElement,
    encode: (canvas: HTMLCanvasElement) => Promise<Uint8Array | null>,
): Promise<Uint8Array | null> {
    const w = source.width
    const h = source.height
    if (w < 1 || h < 1) return Promise.resolve(null)

    return new Promise((resolve) => {
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return resolve(null)

        try {
            ctx.drawImage(source, 0, 0)
        } catch {
            return resolve(null)
        }

        void encode(canvas).then(resolve)
    })
}

export function webglCanvasToWebpBytes(source: HTMLCanvasElement): Promise<Uint8Array | null> {
    return webglCanvasToEncodedBytes(source, htmlCanvasToWebpBytes)
}

/** @deprecated Preferir {@link webglCanvasToWebpBytes} para vistas previas guardadas. */
export function webglCanvasToPngBytes(source: HTMLCanvasElement): Promise<Uint8Array | null> {
    return webglCanvasToEncodedBytes(source, htmlCanvasToPngBytes)
}

const svgTextToPngBytes = async (
  svgText: string,
  opts?: { width?: number; height?: number; maintainAspectRatio?: boolean }
): Promise<Uint8Array | null> => {
  const safeWidth = Math.max(1, Math.floor(opts?.width ?? 1));
  const safeHeight = Math.max(1, Math.floor(opts?.height ?? 1));
  const maintainAspectRatio = opts?.maintainAspectRatio ?? true;
  const scale = 2; // un poco más nítido sin disparar el peso

  const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;

  return await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Dimensiones intrínsecas del SVG renderizado por el browser
      const intrinsicW = Math.max(1, img.naturalWidth || safeWidth);
      const intrinsicH = Math.max(1, img.naturalHeight || safeHeight);

      // Rasterizamos a PNG preservando aspecto si se pide
      const fit = maintainAspectRatio ? Math.min(safeWidth / intrinsicW, safeHeight / intrinsicH) : 1;
      const outW = Math.max(1, Math.floor((maintainAspectRatio ? intrinsicW * fit : safeWidth) * scale));
      const outH = Math.max(1, Math.floor((maintainAspectRatio ? intrinsicH * fit : safeHeight) * scale));

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      htmlCanvasToPngBytes(canvas).then(resolve);
    };
    img.onerror = () => resolve(null);
    img.src = svgDataUri;
  });
};

export const loadImageAsBytes = async (
  url: string,
  opts?: { width?: number; height?: number; maintainAspectRatio?: boolean }
): Promise<Uint8Array | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    const isSvg = url.toLowerCase().includes(".svg") || contentType.includes("image/svg");

    if (isSvg) {
      const svgText = await response.text();
      return await svgTextToPngBytes(svgText, opts);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error("Error cargando imagen:", error);
    return null;
  }
};


