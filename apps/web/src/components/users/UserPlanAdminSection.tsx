"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { assignUserPlanAction } from "@/app/actions/users"
import { Button } from "@/components/ui/button"
import {
    formatBillingDateTime,
    formatPlanCatalogRole,
    formatPlanType,
    toDateInputValue,
} from "@/lib/billing-labels"
import {
    assignUserPlanSchema,
    type AssignUserPlanInput,
} from "@/schemas/billing.schema"
import type { PlanSelectOption } from "@/services/plans.service"
import type { UserBillingAdminSummary } from "@/services/subscriptions.service"

const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"

const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300"

type Props = {
    userId: string
    billing: UserBillingAdminSummary
    plans: PlanSelectOption[]
}

export function UserPlanAdminSection({ userId, billing, plans }: Props) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [serverError, setServerError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<AssignUserPlanInput>({
        resolver: zodResolver(assignUserPlanSchema),
        defaultValues: {
            userId,
            planId: billing.currentPlanId ?? plans[0]?.id ?? "",
            endDate: billing.endDate ? toDateInputValue(billing.endDate) : "",
        },
    })

    const selectedPlanId = watch("planId")
    const selectedPlan = useMemo(
        () => plans.find((plan) => plan.id === selectedPlanId) ?? null,
        [plans, selectedPlanId],
    )
    const selectedIsFree = selectedPlan?.catalogRole === "free"

    if (!billing.canEdit) {
        return (
            <section className="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">Plan</h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {billing.reason ?? "No se puede editar el plan de este usuario."}
                </p>
            </section>
        )
    }

    function onSubmit(values: AssignUserPlanInput) {
        setServerError(null)
        setSuccess(null)
        startTransition(async () => {
            const result = await assignUserPlanAction({
                ...values,
                endDate: selectedIsFree ? "" : values.endDate,
            })
            if (!result.ok) {
                setServerError(result.error)
                return
            }
            setSuccess(
                result.data.mode === "free"
                    ? `Plan Free aplicado: ${result.data.planName}`
                    : `Plan actualizado: ${result.data.planName}`,
            )
            router.refresh()
        })
    }

    const roleLabel = formatPlanCatalogRole(billing.catalogRole ?? "none")

    return (
        <section className="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 space-y-1">
                <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">Plan</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Asigná el plan y la fecha de vencimiento. Tipo:{" "}
                    {billing.planType ? formatPlanType(billing.planType) : "—"}.
                </p>
            </div>

            <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                <p className="text-zinc-700 dark:text-zinc-300">
                    Actual:{" "}
                    <span className="font-medium">{billing.currentPlanName ?? "Sin plan"}</span>
                    {roleLabel ? ` (${roleLabel})` : null}
                </p>
                <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                    Vence:{" "}
                    {billing.endDate ? formatBillingDateTime(billing.endDate) : "Sin vencimiento"}
                    {billing.graceEndsAt ? (
                        <>
                            {" "}
                            (en gracia hasta {formatBillingDateTime(billing.graceEndsAt)})
                        </>
                    ) : null}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <input type="hidden" {...register("userId")} />

                {serverError ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {serverError}
                    </p>
                ) : null}
                {success ? (
                    <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                        {success}
                    </p>
                ) : null}

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="planId" className={labelClass}>
                        Plan
                    </label>
                    <select
                        id="planId"
                        className={inputClass}
                        disabled={plans.length === 0}
                        {...register("planId")}
                    >
                        {plans.length === 0 ? (
                            <option value="">No hay planes activos</option>
                        ) : (
                            plans.map((plan) => {
                                const badge = formatPlanCatalogRole(plan.catalogRole)
                                return (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name}
                                        {badge ? ` (${badge})` : ""}
                                    </option>
                                )
                            })
                        )}
                    </select>
                    {errors.planId ? (
                        <p className="text-xs text-red-600 dark:text-red-400">
                            {String(errors.planId.message)}
                        </p>
                    ) : null}
                </div>

                {!selectedIsFree ? (
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="endDate" className={labelClass}>
                            Vencimiento
                        </label>
                        <input
                            id="endDate"
                            type="date"
                            className={inputClass}
                            {...register("endDate")}
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Al vencer, el usuario conserva el plan durante 7 días de gracia;
                            después pasa a Free.
                        </p>
                        {errors.endDate ? (
                            <p className="text-xs text-red-600 dark:text-red-400">
                                {String(errors.endDate.message)}
                            </p>
                        ) : null}
                    </div>
                ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        El plan Free no tiene fecha de vencimiento: se cancelan las
                        suscripciones activas.
                    </p>
                )}

                <Button type="submit" disabled={pending || plans.length === 0} className="self-start">
                    {pending ? "Guardando…" : "Guardar plan"}
                </Button>
            </form>
        </section>
    )
}
