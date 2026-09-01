"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import clsx from "clsx"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { createPlanOfferAction, updatePlanOfferAction } from "@/app/actions/plan-offers"
import { FormActions } from "@/components/ui/FormActions"
import { useToast } from "@/hooks/use-toast"
import { toDateInputValue } from "@/lib/billing-labels"
import { applyDiscounts, formatMoneyArs } from "@/lib/plan-pricing"
import {
    planOfferCreateSchema,
    type PlanOfferCreateInput,
} from "@/schemas/billing.schema"
import type { DiscountListItem } from "@/services/discounts.service"
import type { PlanOfferDetail } from "@/services/plan-offers.service"

const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300"

type Props = {
    planId: string
    planName: string
    discounts: DiscountListItem[]
    offer?: PlanOfferDetail
}

export function PlanOfferForm({ planId, planName, discounts, offer }: Props) {
    const router = useRouter()
    const { toast } = useToast()
    const [pending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(planOfferCreateSchema),
        defaultValues: {
            planId,
            name: offer?.name ?? "",
            durationValue: offer?.durationValue ?? 1,
            durationUnit: offer?.durationUnit ?? "month",
            price: offer?.price ?? "0",
            currency: offer?.currency ?? "ARS",
            validFrom: offer?.validFrom ?? null,
            validUntil: offer?.validUntil ?? null,
            status: offer?.status ?? "active",
            discountIds: offer?.discountIds ?? [],
        },
    })

    const price = watch("price")
    const discountIds = watch("discountIds") ?? []
    const selectedDiscounts = useMemo(
        () => discounts.filter((item) => discountIds.includes(item.id)),
        [discounts, discountIds],
    )

    const localPreview = useMemo(() => {
        const original = Number(price)
        if (Number.isNaN(original)) return null
        return applyDiscounts(
            original,
            selectedDiscounts.map((item) => ({
                type: item.type,
                value: Number(item.value),
            })),
        )
    }, [price, selectedDiscounts])

    function toggleDiscount(id: string) {
        const next = discountIds.includes(id)
            ? discountIds.filter((item) => item !== id)
            : [...discountIds, id]
        setValue("discountIds", next, { shouldDirty: true })
    }

    function onSubmit(values: PlanOfferCreateInput) {
        setServerError(null)
        startTransition(async () => {
            const result = offer
                ? await updatePlanOfferAction({ ...values, id: offer.id })
                : await createPlanOfferAction(values)
            if (!result.ok) {
                setServerError(result.error)
                return
            }
            toast({
                type: "success",
                title: offer ? "Oferta actualizada" : "Oferta creada",
                message: "Los cambios se guardaron correctamente.",
            })
            router.push(`/admin/plans/${planId}/edit`)
            router.refresh()
        })
    }

    return (
        <div className="mx-auto w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="mb-1 text-2xl font-bold text-zinc-800 dark:text-white">
                {offer ? "Editar oferta" : "Nueva oferta"}
            </h1>
            <p className="mb-6 text-sm text-zinc-500">Plan: {planName}</p>

            <form onSubmit={handleSubmit((values) => onSubmit(values as PlanOfferCreateInput))} className="flex flex-col gap-4">
                <input type="hidden" {...register("planId")} />
                <input type="hidden" {...register("currency")} />
                {serverError ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {serverError}
                    </p>
                ) : null}

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className={labelClass}>
                        Nombre
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

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="durationValue" className={labelClass}>
                            Duración
                        </label>
                        <input
                            id="durationValue"
                            type="number"
                            min={1}
                            className={inputClass}
                            {...register("durationValue", { valueAsNumber: true })}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="durationUnit" className={labelClass}>
                            Unidad
                        </label>
                        <select id="durationUnit" className={inputClass} {...register("durationUnit")}>
                            <option value="month">Meses</option>
                            <option value="year">Años</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="price" className={labelClass}>
                            Precio
                        </label>
                        <input id="price" className={inputClass} {...register("price")} />
                        {errors.price ? (
                            <p className="text-xs text-red-600">{errors.price.message}</p>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="validFrom" className={labelClass}>
                            Vigente desde
                        </label>
                        <input
                            id="validFrom"
                            type="date"
                            className={inputClass}
                            defaultValue={toDateInputValue(offer?.validFrom)}
                            onChange={(event) =>
                                setValue(
                                    "validFrom",
                                    event.target.value ? new Date(event.target.value) : null,
                                    { shouldDirty: true },
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
                            defaultValue={toDateInputValue(offer?.validUntil)}
                            onChange={(event) =>
                                setValue(
                                    "validUntil",
                                    event.target.value ? new Date(event.target.value) : null,
                                    { shouldDirty: true },
                                )
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="status" className={labelClass}>
                            Estado
                        </label>
                        <select id="status" className={inputClass} {...register("status")}>
                            <option value="active">Activa</option>
                            <option value="inactive">Inactiva</option>
                        </select>
                    </div>
                </div>

                <fieldset className="flex flex-col gap-2">
                    <legend className={labelClass}>Descuentos</legend>
                    {discounts.length === 0 ? (
                        <p className="text-sm text-zinc-500">
                            No hay descuentos activos. Creá uno en Descuentos.
                        </p>
                    ) : (
                        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
                            {discounts.map((discount) => (
                                <li key={discount.id} className="px-3 py-2">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={discountIds.includes(discount.id)}
                                            onChange={() => toggleDiscount(discount.id)}
                                        />
                                        <span>
                                            {discount.name}{" "}
                                            <span className="text-zinc-500">
                                                ({discount.type === "percentage"
                                                    ? `${discount.value}%`
                                                    : formatMoneyArs(Number(discount.value))}
                                                {discount.code ? ` · ${discount.code}` : ""})
                                            </span>
                                        </span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                    )}
                </fieldset>

                <div className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
                    <p className="font-medium text-zinc-800 dark:text-zinc-100">Precio final</p>
                    {localPreview ? (
                        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                            Original {formatMoneyArs(localPreview.originalPrice)}
                            {selectedDiscounts.length > 0 ? (
                                <>
                                    {" "}
                                    · {selectedDiscounts.map((item) => item.name).join(" + ")}{" "}
                                    {formatMoneyArs(localPreview.discountAmount)}
                                </>
                            ) : null}{" "}
                            · Final{" "}
                            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                                {formatMoneyArs(localPreview.finalPrice)}
                            </span>
                        </p>
                    ) : null}
                </div>

                <FormActions
                    pending={pending}
                    cancelHref={`/admin/plans/${planId}/edit`}
                    submitLabel={offer ? "Guardar oferta" : "Crear oferta"}
                    className="mt-2"
                />
            </form>
        </div>
    )
}
