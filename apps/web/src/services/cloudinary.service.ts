import { v2 as cloudinary } from "cloudinary"

import type { CloudinaryFolderKey } from "@/lib/cloudinary-folders"
import { CloudinaryFolder } from "@/lib/cloudinary-folders"
import { isCloudinaryConfigured } from "@/lib/cloudinary-url"

function configureCloudinary(): void {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL no está configurada")
  }

  cloudinary.config(process.env.CLOUDINARY_URL)
}

function fullPublicId(folder: string, publicId: string): string {
  return `${folder}/${publicId}`
}

export async function uploadImageBuffer(
  buffer: Buffer,
  mime: string,
  folder: CloudinaryFolderKey | string,
  publicId: string,
): Promise<string> {
  configureCloudinary()

  const folderPath = folder in CloudinaryFolder
    ? CloudinaryFolder[folder as CloudinaryFolderKey]
    : folder

  const base64 = buffer.toString("base64")
  const dataUri = `data:${mime};base64,${base64}`

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: folderPath,
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
  })

  return result.secure_url
}

export async function deleteCloudinaryImage(
  folder: CloudinaryFolderKey | string,
  publicId: string,
): Promise<void> {
  if (!isCloudinaryConfigured()) return

  configureCloudinary()

  const folderPath = folder in CloudinaryFolder
    ? CloudinaryFolder[folder as CloudinaryFolderKey]
    : folder

  await cloudinary.uploader
    .destroy(fullPublicId(folderPath, publicId))
    .catch((error) => {
      console.error("[cloudinary] delete failed:", error)
    })
}
