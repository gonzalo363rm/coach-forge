"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import clsx from "clsx"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { saveMyClubLogoAction, updateMyClubAction } from "@/app/actions/club"
import { ClubLogoField } from "@/components/club/ClubLogoField"
import { FormActions } from "@/components/ui/FormActions"
import { clubUpdateSchema, type ClubUpdateInput } from "@/schemas/club.schema"
import type { ClubWithMemberCount } from "@/services/clubs.service"
import { readElementImageFile } from "@/utils/element-image-file"

const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"

const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300"

type Props = {
    club: ClubWithMemberCount
}

async function uploadClubLogo(
    file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        const image = await readElementImageFile(file)
        const result = await saveMyClubLogoAction({
            imageBase64: image.imageBase64,
            imageMime: image.imageMime,
        })
        if (!result.ok) {
            return { ok: false, error: result.error }
        }
        return { ok: true }
    } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al subir la imagen"
        return { ok: false, error: msg }
    }
}

export function ClubSettingsForm({ club }: Props) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
    const [logoRemoved, setLogoRemoved] = useState(false)
    const [logoFieldKey, setLogoFieldKey] = useState(0)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ClubUpdateInput>({
        resolver: zodResolver(clubUpdateSchema),
        defaultValues: {
            name: club.name,
            address: club.address ?? "",
            logoUrl: club.logoUrl ?? "",
        },
    })

    const clubName = watch("name")
    const logoPreviewUrl = logoRemoved ? null : (club.logoUrl ?? null)

    function onSubmit(values: ClubUpdateInput) {
        setServerError(null)
        startTransition(async () => {
            const payload: ClubUpdateInput = {
                ...values,
                logoUrl: logoRemoved && !pendingLogoFile ? "" : values.logoUrl,
            }

            const result = await updateMyClubAction(payload)
            if (!result.ok) {
                setServerError(result.error)
                return
            }

            if (pendingLogoFile) {
                const upload = await uploadClubLogo(pendingLogoFile)
                if (!upload.ok) {
                    setServerError(
                        `Datos guardados, pero no se pudo subir el logo: ${upload.error}`,
                    )
                    return
                }
            }

            setPendingLogoFile(null)
            setLogoRemoved(false)
            setLogoFieldKey((k) => k + 1)
            router.refresh()
        })
    }

    return (
        <div className="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="mb-2 text-2xl font-bold text-zinc-800 dark:text-white">Mi Club</h1>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                Cupo de coaches:{" "}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {club.memberCount} / {club.maxMembers}
                </span>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <input type="hidden" {...register("logoUrl")} />

                {serverError ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {serverError}
                    </p>
                ) : null}

                <ClubLogoField
                    key={logoFieldKey}
                    clubName={clubName}
                    initialUrl={logoPreviewUrl}
                    onFileSelected={(file) => {
                        setPendingLogoFile(file)
                        if (file) setLogoRemoved(false)
                    }}
                    onRemove={() => {
                        setPendingLogoFile(null)
                        setLogoRemoved(true)
                        setValue("logoUrl", "")
                    }}
                />

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className={labelClass}>
                        Nombre del club
                    </label>
                    <input
                        id="name"
                        className={clsx(inputClass, errors.name && "border-red-500")}
                        {...register("name")}
                    />
                    {errors.name ? (
                        <p className="text-xs text-red-600">{errors.name.message}</p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="address" className={labelClass}>
                        Dirección{" "}
                        <span className="font-normal text-zinc-500">(opcional)</span>
                    </label>
                    <input id="address" className={inputClass} {...register("address")} />
                </div>

                <FormActions
                    submitLabel="Guardar cambios"
                    pending={pending}
                    cancelHref="/club/members"
                    className="mt-2"
                />
            </form>
        </div>
    )
}
