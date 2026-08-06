import { CloudinaryFolder } from "@/lib/cloudinary-folders"

function getCloudName(): string | null {
  const url = process.env.CLOUDINARY_URL
  if (!url) return null

  const match = url.match(/@([^/?]+)/)
  return match?.[1] ?? null
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(process.env.CLOUDINARY_URL && getCloudName())
}

export function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com")
}

export function buildCloudinaryImageUrl(
  folder: string,
  publicId: string,
  format?: string,
  version?: string | number | null,
): string | null {
  const cloudName = getCloudName()
  if (!cloudName) return null

  const fullPublicId = `${folder}/${publicId}`
  const suffix = format ? `.${format}` : ""
  const versionSegment =
    version != null && `${version}`.trim() !== "" ? `v${version}/` : ""

  return `https://res.cloudinary.com/${cloudName}/image/upload/${versionSegment}${fullPublicId}${suffix}`
}

export function elementImagePublicId(elementId: string): string {
  return `element-${elementId}`
}

export function exercisePreviewPublicId(exerciseId: string): string {
  return `exercise-${exerciseId}`
}

export function avatarImagePublicId(userId: string): string {
  return `user-${userId}`
}

export function clubLogoPublicId(clubId: string): string {
  return `club-${clubId}`
}

export function classImagePublicId(classId: string): string {
  return `class-${classId}`
}

export function elementCloudinaryUrl(elementId: string, format?: string): string | null {
  return buildCloudinaryImageUrl(
    CloudinaryFolder.elements,
    elementImagePublicId(elementId),
    format,
  )
}

export function exercisePreviewCloudinaryUrl(
  exerciseId: string,
  version?: string | number | null,
): string | null {
  return buildCloudinaryImageUrl(
    CloudinaryFolder.exercises,
    exercisePreviewPublicId(exerciseId),
    "webp",
    version,
  )
}
