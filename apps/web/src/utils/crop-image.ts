export type CropArea = {
    x: number
    y: number
    width: number
    height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener("load", () => resolve(image))
        image.addEventListener("error", () => reject(new Error("No se pudo cargar la imagen")))
        image.crossOrigin = "anonymous"
        image.src = src
    })
}

/** Recorta una región de la imagen y devuelve un WebP listo para subir. */
export async function getCroppedImageFile(
    imageSrc: string,
    pixelCrop: CropArea,
    fileName = "avatar.webp",
): Promise<File> {
    const image = await loadImage(imageSrc)
    const canvas = document.createElement("canvas")
    const size = Math.min(pixelCrop.width, pixelCrop.height, 512)
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext("2d")
    if (!ctx) {
        throw new Error("No se pudo preparar el recorte")
    }

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        size,
        size,
    )

    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (result) => {
                if (!result) {
                    reject(new Error("No se pudo generar la imagen recortada"))
                    return
                }
                resolve(result)
            },
            "image/webp",
            0.92,
        )
    })

    return new File([blob], fileName, { type: "image/webp" })
}
