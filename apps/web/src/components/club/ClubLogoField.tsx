"use client"

import Image from "next/image"
import { useEffect, useId, useMemo, useRef, useState } from "react"
import { IoClose, IoPencil } from "react-icons/io5"

import { UserAvatarCropModal } from "@/components/users/UserAvatarCropModal"
import {
    isImageFileTooLarge,
    MAX_IMAGE_FILE_ERROR,
    MAX_IMAGE_FILE_MB,
} from "@/utils/element-image-file"

type Props = {
    clubName: string
    initialUrl: string | null
    onFileSelected: (file: File | null) => void
    onRemove: () => void
    error?: string | null
}

type CropSession = {
    src: string
    revokeOnClose: boolean
}

function buildInitials(clubName: string): string {
    const parts = clubName.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
        return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase()
    }
    const single = parts[0] ?? ""
    return (single.slice(0, 2) || "?").toUpperCase()
}

function isSvgFile(file: File): boolean {
    return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")
}

export function ClubLogoField({
    clubName,
    initialUrl,
    onFileSelected,
    onRemove,
    error,
}: Props) {
    const inputId = useId()
    const inputRef = useRef<HTMLInputElement>(null)
    const previewObjectUrlRef = useRef<string | null>(null)

    const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl)
    const [hasLocalSelection, setHasLocalSelection] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)
    const [cropSession, setCropSession] = useState<CropSession | null>(null)

    const initials = useMemo(() => buildInitials(clubName), [clubName])

    useEffect(() => {
        if (!hasLocalSelection) {
            setPreviewUrl(initialUrl)
        }
    }, [initialUrl, hasLocalSelection])

    useEffect(() => {
        return () => {
            if (previewObjectUrlRef.current) {
                URL.revokeObjectURL(previewObjectUrlRef.current)
            }
        }
    }, [])

    function setPreviewFromObjectUrl(url: string | null) {
        if (previewObjectUrlRef.current) {
            URL.revokeObjectURL(previewObjectUrlRef.current)
            previewObjectUrlRef.current = null
        }
        if (url?.startsWith("blob:")) {
            previewObjectUrlRef.current = url
        }
        setPreviewUrl(url)
    }

    function closeCropSession() {
        setCropSession((current) => {
            if (current?.revokeOnClose) {
                URL.revokeObjectURL(current.src)
            }
            return null
        })
        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }

    function applySelectedFile(file: File, objectPreviewUrl: string) {
        setHasLocalSelection(true)
        onFileSelected(file)
        setPreviewFromObjectUrl(objectPreviewUrl)
        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }

    function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        setLocalError(null)

        if (!file) {
            if (inputRef.current) {
                inputRef.current.value = ""
            }
            return
        }

        if (isImageFileTooLarge(file)) {
            setLocalError(MAX_IMAGE_FILE_ERROR)
            e.target.value = ""
            return
        }

        if (isSvgFile(file)) {
            applySelectedFile(file, URL.createObjectURL(file))
            return
        }

        const src = URL.createObjectURL(file)
        setCropSession({ src, revokeOnClose: true })
        e.target.value = ""
    }

    function handleCropConfirm(file: File, objectPreviewUrl: string) {
        closeCropSession()
        applySelectedFile(file, objectPreviewUrl)
    }

    function handleCropClose() {
        closeCropSession()
    }

    function handleRemove() {
        setLocalError(null)
        setHasLocalSelection(false)
        onFileSelected(null)
        onRemove()
        setPreviewFromObjectUrl(null)
        closeCropSession()
    }

    const displayError = localError ?? error
    const showRemove = Boolean(previewUrl)

    return (
        <>
            <div className="flex flex-col items-center gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                <div className="relative">
                    <div
                        className="relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                        aria-hidden={!previewUrl}
                    >
                        {previewUrl ? (
                            <Image
                                src={previewUrl}
                                alt=""
                                fill
                                sizes="96px"
                                className="object-cover"
                                unoptimized
                            />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-500 dark:text-zinc-400">
                                {initials}
                            </span>
                        )}
                    </div>

                    {showRemove ? (
                        <button
                            type="button"
                            onClick={handleRemove}
                            aria-label="Quitar logo"
                            className="absolute -bottom-1 -left-1 flex size-7 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-500 shadow-sm transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 dark:hover:text-zinc-100"
                        >
                            <IoClose className="size-3.5" aria-hidden />
                        </button>
                    ) : null}

                    <label
                        htmlFor={inputId}
                        aria-label={previewUrl ? "Cambiar logo" : "Subir logo"}
                        className="absolute -bottom-1 -right-1 flex size-7 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 dark:hover:text-zinc-100"
                    >
                        <IoPencil className="size-3.5" aria-hidden />
                    </label>

                    <input
                        ref={inputRef}
                        id={inputId}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="sr-only"
                        onChange={onImageChange}
                    />
                </div>

                <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                    Logo del club. PNG, JPG, WebP, SVG. Máx. {MAX_IMAGE_FILE_MB} MB.
                </p>

                {displayError ? (
                    <p className="text-center text-xs text-red-600 dark:text-red-400">
                        {displayError}
                    </p>
                ) : null}
            </div>

            {cropSession ? (
                <UserAvatarCropModal
                    imageSrc={cropSession.src}
                    onClose={handleCropClose}
                    onConfirm={handleCropConfirm}
                />
            ) : null}
        </>
    )
}
