"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import clsx from "clsx"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import {
    saveClubLogoAdminAction,
    updateClubAdminAction,
} from "@/app/actions/admin-clubs"
import { ClubLogoField } from "@/components/club/ClubLogoField"
import { FormActions } from "@/components/ui/FormActions"
import { formatUserDisplayName } from "@/lib/user-display"
import {
    clubAdminUpdateSchema,
    type ClubAdminUpdateInput,
} from "@/schemas/club.schema"
import type { ClubAdminDetail } from "@/services/clubs.service"
import { readElementImageFile } from "@/utils/element-image-file"

const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"

const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300"

type Props = {
    club: ClubAdminDetail
}

async function uploadClubLogo(
    clubId: string,
    file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        const image = await readElementImageFile(file)
        const result = await saveClubLogoAdminAction({
            clubId,
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

export function AdminClubForm({ club }: Props) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
    const [logoRemoved, setLogoRemoved] = useState(false)
    const ownerName = formatUserDisplayName(club.manager)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ClubAdminUpdateInput>({
        resolver: zodResolver(clubAdminUpdateSchema),
        defaultValues: {
            id: club.id,
            name: club.name,
            address: club.address ?? "",
            logoUrl: club.logoUrl ?? "",
            maxMembers: club.maxMembers,
        },
    })

    const clubName = watch("name")
    const logoPreviewUrl = logoRemoved ? null : (club.logoUrl ?? null)

    function onSubmit(values: ClubAdminUpdateInput) {
        setServerError(null)
        startTransition(async () => {
            const payload: ClubAdminUpdateInput = {
                ...values,
                logoUrl: logoRemoved && !pendingLogoFile ? "" : values.logoUrl,
            }

            const result = await updateClubAdminAction(payload)
            if (!result.ok) {
                setServerError(result.error)
                return
            }

            if (pendingLogoFile) {
                const upload = await uploadClubLogo(club.id, pendingLogoFile)
                if (!upload.ok) {
                    setServerError(
                        `Datos guardados, pero no se pudo subir el logo: ${upload.error}`,
                    )
                    return
                }
            }

            router.push("/admin/clubs")
            router.refresh()
        })
    }

    return (
        <div className="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="mb-2 text-2xl font-bold text-zinc-800 dark:text-white">
                Editar club
            </h1>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                Dueño:{" "}
                <Link
                    href={`/admin/users/${club.manager.id}/edit`}
                    className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                    {ownerName}
                </Link>{" "}
                ({club.manager.email}). Coaches: {club.memberCount} /{" "}
                {club.maxMembers}.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <input type="hidden" {...register("id")} />
                <input type="hidden" {...register("logoUrl")} />

                {serverError ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {serverError}
                    </p>
                ) : null}

                <ClubLogoField
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

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="maxMembers" className={labelClass}>
                        Cupo de coaches
                    </label>
                    <input
                        id="maxMembers"
                        type="number"
                        min={1}
                        max={1000}
                        className={clsx(inputClass, errors.maxMembers && "border-red-500")}
                        {...register("maxMembers", { valueAsNumber: true })}
                    />
                    {errors.maxMembers ? (
                        <p className="text-xs text-red-600">{errors.maxMembers.message}</p>
                    ) : (
                        <p className="text-xs text-zinc-500">
                            Límite de coaches que puede crear el manager del club.
                        </p>
                    )}
                </div>

                <FormActions
                    submitLabel="Guardar cambios"
                    pending={pending}
                    cancelHref="/admin/clubs"
                    className="mt-2"
                />
            </form>
        </div>
    )
}
