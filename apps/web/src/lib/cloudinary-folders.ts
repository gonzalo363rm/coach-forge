export const CLOUDINARY_ROOT = "coach-forge"

export const CloudinaryFolder = {
  avatars: `${CLOUDINARY_ROOT}/avatars`,
  exercises: `${CLOUDINARY_ROOT}/exercises`,
  elements: `${CLOUDINARY_ROOT}/elements`,
  classes: `${CLOUDINARY_ROOT}/classes`,
} as const

export type CloudinaryFolderKey = keyof typeof CloudinaryFolder
