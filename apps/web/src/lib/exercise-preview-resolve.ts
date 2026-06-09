import { existsSync } from "node:fs"
import { join } from "node:path"

import { exercisePreviewCloudinaryUrl } from "@/lib/cloudinary-url"
import { exercisePreviewFilename } from "@/utils/exercise-preview-url"

export const EXERCISE_PREVIEW_PLACEHOLDER = "/exercises/placeholder-preview.svg"

function localPreviewAbsolutePath(exerciseId: string): string {
  return join(process.cwd(), "public", "exercises", exercisePreviewFilename(exerciseId))
}

function localPreviewPublicPath(exerciseId: string): string {
  return `/exercises/${exercisePreviewFilename(exerciseId)}`
}

async function remoteImageExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", next: { revalidate: 300 } })
    return response.ok
  } catch {
    return false
  }
}

/** Resuelve la URL de vista previa: local legacy → Cloudinary → placeholder. */
export async function resolveExercisePreviewUrl(exerciseId: string): Promise<string> {
  if (existsSync(localPreviewAbsolutePath(exerciseId))) {
    return localPreviewPublicPath(exerciseId)
  }

  const cloudinaryUrl = exercisePreviewCloudinaryUrl(exerciseId)
  if (cloudinaryUrl && (await remoteImageExists(cloudinaryUrl))) {
    return cloudinaryUrl
  }

  return EXERCISE_PREVIEW_PLACEHOLDER
}
