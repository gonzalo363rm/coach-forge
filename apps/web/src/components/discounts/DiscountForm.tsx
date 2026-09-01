"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import clsx from "clsx"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { createDiscountAction, updateDiscountAction } from "@/app/actions/discounts"
import { FormActions } from "@/components/ui/FormActions"
import { useToast } from "@/hooks/use-toast"
import { toDateInputValue } from "@/lib/billing-labels"
import {
    discountCreateSchema,
    type DiscountCreateInput,
} from "@/schemas/billing.schema"
import type { DiscountListItem } from "@/services/discounts.service"

const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300"

type Props = { mode: "create" } | { mode: "edit"; discount: DiscountListItem }

export function DiscountForm(props: Props) {
    const router = useRouter()
    const { toast } = useToast()
    const [pending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(discountCreateSchema),
        defaultValues:
            props.mode === "edit"
                ? {
                      name: props.discount.name,
                      type: props.discount.type,
                      value: props.discount.value,
                      code: props.discount.code ?? "",
                      validFrom: props.discount.validFrom,
                      validUntil: props.discount.validUntil,
                      maxUses: props.discount.maxUses,
                      status: props.discount.status,
                  }
                : {
                      name: "",
                      type: "percentage",
                      value: "10",
                      code: "",
                      validFrom: null,
                      validUntil: null,
                      maxUses: null,
                      status: "active",
                  },
    })

    function onSubmit(values: DiscountCreateInput) {
        setServerError(null)
        startTransition(async () => {
            const result =
                props.mode === "edit"
                    ? await updateDiscountAction({ ...values, id: props.discount.id })
                    : await createDiscountAction(values)
            if (!result.ok) {
                setServerError(result.error)
                return
            }
            toast({
                type: "success",
                title: props.mode === "edit" ? "Descuento actualizado" : "Descuento creado",
                message: "Los cambios se guardaron correctamente.",
            })
            router.push("/admin/discounts")
            router.refresh()
        })
    }

    return (
        <div className="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-white">
                {props.mode === "edit" ? "Editar descuento" : "Nuevo descuento"}
            </h1>
            <form onSubmit={handleSubmit((values) => onSubmit(values as DiscountCreateInput))} className="flex flex-col gap-4">
                {serverError ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {serverError}
                    </p>
                ) : null}

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className={labelClass}>
                        Nombre
                    </label>
                    <input id="name" className={inputClass} {...register("name")} />
                    {errors.name ? (
                        <p className="text-xs text-red-600">{errors.name.message}</p>
                    ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="type" className={labelClass}>
                            Tipo
                        </label>
                        <select id="type" className={inputClass} {...register("type")}>
                            <option value="percentage">Porcentaje</option>
                            <option value="fixed">Monto fijo</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="value" className={labelClass}>
                            Valor
                        </label>
                        <input id="value" className={inputClass} {...register("value")} />
                        {errors.value ? (
                            <p className="text-xs text-red-600">{errors.value.message}</p>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="code" className={labelClass}>
                        Código{" "}
                        <span className="font-normal text-zinc-500">
                            (vacío = nombre en mayúsculas, sin espacios)
                        </span>
                    </label>
                    <input id="code" className={inputClass} {...register("code")} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="validFrom" className={labelClass}>
                            Vigente desde
                        </label>
                        <input
                            id="validFrom"
                            type="date"
                            className={inputClass}
                            defaultValue={toDateInputValue(
                                props.mode === "edit" ? props.discount.validFrom : null,
                            )}
                            onChange={(event) =>
                                setValue(
                                    "validFrom",
                                    event.target.value ? new Date(event.target.value) : null,
                                )
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="validUntil" className={labelClass}>
                            Vigente hasta
                        </label>
                        <input
                            id="validUntil"
                            type="date"
                            className={inputClass}
                            defaultValue={toDateInputValue(
                                props.mode === "edit" ? props.discount.validUntil : null,
                            )}
                            onChange={(event) =>
                                setValue(
                                    "validUntil",
                                    event.target.value ? new Date(event.target.value) : null,
                                )
                            }
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="maxUses" className={labelClass}>
                            Máximo de usos
                        </label>
                        <input
                            id="maxUses"
                            type="number"
                            min={1}
                            className={inputClass}
                            {...register("maxUses")}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="status" className={labelClass}>
                            Estado
                        </label>
                        <select id="status" className={inputClass} {...register("status")}>
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                        </select>
                    </div>
                </div>

                <FormActions
                    pending={pending}
                    cancelHref="/admin/discounts"
                    submitLabel={props.mode === "edit" ? "Guardar cambios" : "Crear descuento"}
                    className="mt-2"
                />
            </form>
        </div>
    )
}
