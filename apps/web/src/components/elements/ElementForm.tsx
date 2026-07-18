"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { createElementAction, updateElementAction } from "@/app/actions/elements"
import { FormActions } from "@/components/ui/FormActions"
import type { SportListOption } from "@/interfaces"
import {
    isImageFileTooLarge,
    MAX_IMAGE_FILE_ERROR,
    MAX_IMAGE_FILE_MB,
    readElementImageFile,
} from "@/utils/element-image-file"

type Props =
    | { mode: "create"; sports: SportListOption[] }
    | {
          mode: "edit"
          sports: SportListOption[]
          element: {
              id: string
              name: string
              image: string
              width: number
              height: number
              sportId: string | null
          }
      }

export function ElementForm(props: Props) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const [name, setName] = useState(props.mode === "edit" ? props.element.name : "")
    const [customId, setCustomId] = useState(props.mode === "edit" ? props.element.id : "")
    const [sportId, setSportId] = useState(
        props.mode === "edit" ? (props.element.sportId ?? "") : "",
    )
    const [width, setWidth] = useState(
        props.mode === "edit" ? String(props.element.width) : "",
    )
    const [height, setHeight] = useState(
        props.mode === "edit" ? String(props.element.height) : "",
    )
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        props.mode === "edit" ? props.element.image : null,
    )

    function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) {
            setImageFile(null)
            if (props.mode === "edit") {
                setPreviewUrl(props.element.image)
            } else {
                setPreviewUrl(null)
            }
            return
        }
        if (isImageFileTooLarge(file)) {
            setError(MAX_IMAGE_FILE_ERROR)
            setImageFile(null)
            e.target.value = ""
            if (props.mode === "edit") {
                setPreviewUrl(props.element.image)
            } else {
                setPreviewUrl(null)
            }
            return
        }
        setError(null)
        setImageFile(file)
        setPreviewUrl(URL.createObjectURL(file))
    }

    function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        const widthNum = parseFloat(width)
        const heightNum = parseFloat(height)
        if (Number.isNaN(widthNum) || widthNum <= 0) {
            setError("Indica un ancho válido en centímetros")
            return
        }
        if (Number.isNaN(heightNum) || heightNum <= 0) {
            setError("Indica un alto válido en centímetros")
            return
        }

        startTransition(async () => {
            try {
                if (props.mode === "create") {
                    if (!imageFile) {
                        setError("La imagen es obligatoria")
                        return
                    }
                    const image = await readElementImageFile(imageFile)
                    const result = await createElementAction({
                        id: customId.trim() || undefined,
                        name,
                        type: "image",
                        width: widthNum,
                        height: heightNum,
                        sportId: sportId || null,
                        ...image,
                    })
                    if (!result.ok) {
                        setError(result.error)
                        return
                    }
                    router.push("/admin/elements")
                    router.refresh()
                    return
                }

                const payload: Record<string, unknown> = {
                    id: props.element.id,
                    name,
                    width: widthNum,
                    height: heightNum,
                    sportId: sportId || null,
                }
                if (imageFile) {
                    const image = await readElementImageFile(imageFile)
                    Object.assign(payload, image)
                }

                const result = await updateElementAction(payload)
                if (!result.ok) {
                    setError(result.error)
                    return
                }
                router.push("/admin/elements")
                router.refresh()
            } catch (err) {
                setError(err instanceof Error ? err.message : "Error al guardar")
            }
        })
    }

    const title = props.mode === "create" ? "Nuevo elemento" : "Editar elemento"

    return (
        <div className="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-white">{title}</h1>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                {error ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {error}
                    </p>
                ) : null}

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="element-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Nombre
                    </label>
                    <input
                        id="element-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={200}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                </div>

                {props.mode === "create" ? (
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="element-id" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Identificador <span className="font-normal text-zinc-500">(opcional)</span>
                        </label>
                        <input
                            id="element-id"
                            value={customId}
                            onChange={(e) => setCustomId(e.target.value)}
                            maxLength={80}
                            placeholder="Se genera desde el nombre si lo dejas vacío"
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                    </div>
                ) : null}

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="element-sport" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Deporte <span className="font-normal text-zinc-500">(opcional)</span>
                    </label>
                    <select
                        id="element-sport"
                        value={sportId}
                        onChange={(e) => setSportId(e.target.value)}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                        <option value="">Sin deporte</option>
                        {props.sports.map((sport) => (
                            <option key={sport.id} value={sport.id}>
                                {sport.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="element-width" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Ancho
                        </label>
                        <input
                            id="element-width"
                            type="number"
                            step="1"
                            min="1"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            required
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="element-height" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Alto
                        </label>
                        <input
                            id="element-height"
                            type="number"
                            step="1"
                            min="1"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            required
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                    </div>
                </div>
                <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Indica el tamaño real del elemento en centímetros para que se escale correctamente en el
                    canvas.
                </p>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="element-image" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Imagen
                    </label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Tamaño máximo: {MAX_IMAGE_FILE_MB} MB
                    </p>
                    <input
                        id="element-image"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={onImageChange}
                        required={props.mode === "create"}
                        className="text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-800 dark:text-zinc-300 dark:file:bg-emerald-950/50 dark:file:text-emerald-200"
                    />
                    {previewUrl ? (
                        <Image
                            src={previewUrl}
                            alt="Vista previa"
                            width={80}
                            height={80}
                            className="mt-2 h-20 w-20 object-contain"
                            unoptimized
                        />
                    ) : null}
                </div>

                <FormActions pending={pending} cancelHref="/admin/elements" className="mt-2" />
            </form>
        </div>
    )
}
