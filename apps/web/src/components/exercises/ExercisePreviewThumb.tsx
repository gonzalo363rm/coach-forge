"use client"

import { useEffect, useMemo, useState } from "react"
import { IoCloseOutline } from "react-icons/io5"

const PREVIEW_PLACEHOLDER = "/exercises/placeholder-preview.svg"

type Props = {
    previewUrl: string
    title: string
}

export function ExercisePreviewThumb({ previewUrl, title }: Props) {
    const [open, setOpen] = useState(false)
    const [fullSrc, setFullSrc] = useState(previewUrl)

    useEffect(() => {
        setFullSrc(previewUrl)
    }, [previewUrl])

    useEffect(() => {
        if (!open) return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false)
        }

        document.addEventListener("keydown", onKeyDown)

        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        return () => {
            document.removeEventListener("keydown", onKeyDown)
            document.body.style.overflow = prevOverflow
        }
    }, [open])

    const modalTitleId = useMemo(
        () => `exercise-preview-${Math.random().toString(36).slice(2)}`,
        [],
    )

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 cursor-pointer"
                aria-label={`Abrir vista previa de ${title}`}
                title={`Vista previa: ${title}`}
            >
                <picture>
                    <source srcSet={previewUrl} type="image/png" />
                    <img
                        src={previewUrl}
                        alt={`Vista previa de ${title}`}
                        width={96}
                        height={56}
                        className="h-14 w-24 shrink-0 rounded-md border border-zinc-200 object-cover dark:border-zinc-700"
                        loading="lazy"
                        onError={(e) => {
                            const el = e.currentTarget
                            if (el.dataset.fallback === "1") return
                            el.dataset.fallback = "1"
                            el.src = PREVIEW_PLACEHOLDER
                        }}
                    />
                </picture>
            </button>

            {open ? (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4"
                    role="presentation"
                    onPointerDown={(e) => {
                        if (e.target === e.currentTarget) setOpen(false)
                    }}
                >
                    <div
                        className="relative w-full max-w-4xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={modalTitleId}
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <div className="absolute right-2 top-2 z-10">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center justify-center rounded-md bg-black/50 p-2 text-white backdrop-blur transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                                aria-label="Cerrar"
                            >
                                <IoCloseOutline className="size-5" aria-hidden />
                            </button>
                        </div>

                        <h2 id={modalTitleId} className="sr-only">
                            Vista previa: {title}
                        </h2>

                        <img
                            src={fullSrc}
                            alt={`Vista previa de ${title}`}
                            className="max-h-[85vh] w-full rounded-xl border border-zinc-200 bg-white object-contain shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
                            onError={() => setFullSrc(PREVIEW_PLACEHOLDER)}
                        />
                    </div>
                </div>
            ) : null}
        </>
    )
}
