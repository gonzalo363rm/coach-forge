import { existsSync, unlinkSync } from "node:fs"
import { join } from "node:path"

import { exercisePreviewCloudinaryUrl, isCloudinaryConfigured } from "@/lib/cloudinary-url"
import { exercisePreviewFilename } from "@/utils/exercise-preview-url"

export const EXERCISE_PREVIEW_PLACEHOLDER = "/exercises/placeholder-preview.svg"

function localPreviewAbsolutePath(exerciseId: string): string {
  return join(process.cwd(), "public", "exercises", exercisePreviewFilename(exerciseId))
}

function localPreviewPublicPath(exerciseId: string): string {
  return `/exercises/${exercisePreviewFilename(exerciseId)}`
}

/** Elimina preview local legacy para que no opaque una subida a Cloudinary. */
export function removeLocalExercisePreview(exerciseId: string): void {
  const abs = localPreviewAbsolutePath(exerciseId)
  if (!existsSync(abs)) return
  try {
    unlinkSync(abs)
  } catch (e) {
    console.error("[removeLocalExercisePreview]", exerciseId, e)
  }
}

function toCacheVersion(
  cacheToken?: string | number | Date | null,
): string | number | null {
  if (cacheToken == null) return null
  if (cacheToken instanceof Date) return cacheToken.getTime()
  return cacheToken
}

async function remoteImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store" })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Resuelve la URL de vista previa: Cloudinary (preferido) → local legacy → placeholder.
 * `cacheToken` se usa como versión en la URL de Cloudinary para romper caché del CDN/navegador.
 */
export async function resolveExercisePreviewUrl(
  exerciseId: string,
  cacheToken?: string | number | Date | null,
): Promise<string> {
  const version = toCacheVersion(cacheToken)

  if (isCloudinaryConfigured()) {
    // Comprobar existencia sin versión; servir con versión para cache-bust.
    const baseUrl = exercisePreviewCloudinaryUrl(exerciseId)
    if (baseUrl && (await remoteImageExists(baseUrl))) {
      return exercisePreviewCloudinaryUrl(exerciseId, version) ?? baseUrl
    }
  }

  if (existsSync(localPreviewAbsolutePath(exerciseId))) {
    const bust = version != null ? `?v=${encodeURIComponent(String(version))}` : ""
    return `${localPreviewPublicPath(exerciseId)}${bust}`
  }

  return EXERCISE_PREVIEW_PLACEHOLDER
}
