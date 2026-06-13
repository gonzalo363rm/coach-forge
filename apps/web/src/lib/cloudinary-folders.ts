const NODE_ENV = process.env.NODE_ENV === "production" ? "production" : "development";
export const CLOUDINARY_ROOT = `coach-forge/${NODE_ENV}`

export const CloudinaryFolder = {
  avatars: `${CLOUDINARY_ROOT}/avatars`,
  exercises: `${CLOUDINARY_ROOT}/exercises`,
  elements: `${CLOUDINARY_ROOT}/elements`,
} as const

export type CloudinaryFolderKey = keyof typeof CloudinaryFolder
