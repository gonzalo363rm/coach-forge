"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import clsx from "clsx"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { createClubMemberAction } from "@/app/actions/club"
import { FormActions } from "@/components/ui/FormActions"
import {
    clubMemberCreateSchema,
    type ClubMemberCreateInput,
} from "@/schemas/club.schema"

const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"

const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300"

type Props = {
    clubName: string
    memberCount: number
    maxMembers: number
}

export function ClubMemberCreateForm({ clubName, memberCount, maxMembers }: Props) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)
    const atQuota = memberCount >= maxMembers

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ClubMemberCreateInput>({
        resolver: zodResolver(clubMemberCreateSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            password: "",
            confirmPassword: "",
            emailVerified: true,
        },
    })

    function onSubmit(values: ClubMemberCreateInput) {
        if (atQuota) return
        setServerError(null)
        startTransition(async () => {
            const result = await createClubMemberAction(values)
            if (!result.ok) {
                setServerError(result.error)
                return
            }
            router.push("/club/members")
            router.refresh()
        })
    }

    return (
        <div className="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="mb-2 text-2xl font-bold text-zinc-800 dark:text-white">Nuevo coach</h1>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                Quedará vinculado a {clubName}.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {atQuota ? (
                    <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        Cupo completo ({maxMembers} coaches). No podés crear más hasta ampliar el
                        límite.
                    </p>
                ) : null}

                {serverError ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {serverError}
                    </p>
                ) : null}

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="firstName" className={labelClass}>
                            Nombre
                        </label>
                        <input
                            id="firstName"
                            disabled={atQuota}
                            className={clsx(inputClass, errors.firstName && "border-red-500")}
                            {...register("firstName")}
                        />
                        {errors.firstName ? (
                            <p className="text-xs text-red-600">{errors.firstName.message}</p>
                        ) : null}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="lastName" className={labelClass}>
                            Apellido
                        </label>
                        <input
                            id="lastName"
                            disabled={atQuota}
                            className={clsx(inputClass, errors.lastName && "border-red-500")}
                            {...register("lastName")}
                        />
                        {errors.lastName ? (
                            <p className="text-xs text-red-600">{errors.lastName.message}</p>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className={labelClass}>
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        disabled={atQuota}
                        className={clsx(inputClass, errors.email && "border-red-500")}
                        {...register("email")}
                    />
                    {errors.email ? (
                        <p className="text-xs text-red-600">{errors.email.message}</p>
                    ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="phoneNumber" className={labelClass}>
                        Teléfono{" "}
                        <span className="font-normal text-zinc-500">(opcional)</span>
                    </label>
                    <input
                        id="phoneNumber"
                        disabled={atQuota}
                        className={inputClass}
                        {...register("phoneNumber")}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className={labelClass}>
                        Contraseña
                    </label>
                    <input
                        id="password"
                        type="password"
                        disabled={atQuota}
                        className={clsx(inputClass, errors.password && "border-red-500")}
                        {...register("password")}
                    />
                    {errors.password ? (
                        <p className="text-xs text-red-600">{errors.password.message}</p>
                    ) : (
                        <p className="text-xs text-zinc-500">Mínimo 8 caracteres</p>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirmPassword" className={labelClass}>
                        Confirmar contraseña
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        disabled={atQuota}
                        className={clsx(inputClass, errors.confirmPassword && "border-red-500")}
                        {...register("confirmPassword")}
                    />
                    {errors.confirmPassword ? (
                        <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
                    ) : null}
                </div>

                <FormActions
                    submitLabel="Crear coach"
                    pending={pending}
                    submitDisabled={atQuota}
                    cancelHref="/club/members"
                    className="mt-2"
                />
            </form>
        </div>
    )
}
