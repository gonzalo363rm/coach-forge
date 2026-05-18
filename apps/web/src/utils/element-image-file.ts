/** Debe coincidir con `experimental.serverActions.bodySizeLimit` en `next.config.ts`. */
export const MAX_IMAGE_FILE_BYTES = 2 * 1024 * 1024
export const MAX_IMAGE_FILE_MB = 2
export const MAX_IMAGE_FILE_ERROR = `La imagen supera el tamaño máximo de ${MAX_IMAGE_FILE_MB} MB.`

export function isImageFileTooLarge(file: File): boolean {
    return file.size > MAX_IMAGE_FILE_BYTES
}

const ALLOWED_MIME = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
])

export type ParsedElementImageFile = {
    imageBase64: string
    imageMime: "image/png" | "image/jpeg" | "image/jpg" | "image/webp" | "image/svg+xml"
}

export async function readElementImageFile(file: File): Promise<ParsedElementImageFile> {
    const mime = file.type || "application/octet-stream"
    if (!ALLOWED_MIME.has(mime)) {
        throw new Error("Formato no soportado. Usa PNG, JPG, WebP o SVG.")
    }
    if (isImageFileTooLarge(file)) {
        throw new Error(MAX_IMAGE_FILE_ERROR)
    }

    const buffer = await file.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]!)
    }

    return {
        imageBase64: btoa(binary),
        imageMime: mime as ParsedElementImageFile["imageMime"],
    }
}
