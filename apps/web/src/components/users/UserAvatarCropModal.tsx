"use client"

import * as Slider from "@radix-ui/react-slider"
import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"

import { Button } from "@/components/ui/button"
import { getCroppedImageFile } from "@/utils/crop-image"

type Props = {
    imageSrc: string
    onClose: () => void
    onConfirm: (file: File, previewUrl: string) => void
}

export function UserAvatarCropModal({ imageSrc, onClose, onConfirm }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const onCropComplete = useCallback((_: Area, pixels: Area) => {
        setCroppedAreaPixels(pixels)
    }, [])

    async function handleConfirm() {
        if (!croppedAreaPixels) return
        setError(null)
        setPending(true)
        try {
            const file = await getCroppedImageFile(imageSrc, croppedAreaPixels)
            onConfirm(file, URL.createObjectURL(file))
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error al recortar la imagen")
        } finally {
            setPending(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            role="presentation"
            onPointerDown={(e) => {
                if (e.target === e.currentTarget && !pending) onClose()
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="avatar-crop-title"
                className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
                    <h2
                        id="avatar-crop-title"
                        className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                        Ajustar foto
                    </h2>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        Arrastra y haz zoom para encuadrar el avatar.
                    </p>
                </div>

                <div className="relative h-72 bg-zinc-900">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="space-y-2 px-4 py-3">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Zoom
                    </label>
                    <Slider.Root
                        className="relative flex h-5 w-full touch-none items-center select-none"
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.05}
                        onValueChange={([value]) => setZoom(value ?? 1)}
                    >
                        <Slider.Track className="relative h-1.5 grow rounded-full bg-zinc-200 dark:bg-zinc-600">
                            <Slider.Range className="absolute h-full rounded-full bg-emerald-500" />
                        </Slider.Track>
                        <Slider.Thumb className="block size-4 rounded-full border border-emerald-600 bg-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" />
                    </Slider.Root>
                </div>

                {error ? (
                    <p className="px-4 pb-2 text-sm text-red-600 dark:text-red-400">{error}</p>
                ) : null}

                <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={pending}
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        disabled={pending || !croppedAreaPixels}
                        onClick={() => void handleConfirm()}
                    >
                        {pending ? "Guardando…" : "Usar foto"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
