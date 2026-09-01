"use client"

import clsx from "clsx"
import { useMemo, useState, useTransition } from "react"

import { createCheckoutPreferenceAction } from "@/app/actions/billing"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
    durationToMonths,
    formatBillingPeriodLabel,
    formatPlanCatalogRole,
    formatPlanFeature,
} from "@/lib/billing-labels"
import { applyDiscounts, formatMoneyArs } from "@/lib/plan-pricing"
import type { plansListPublicByType } from "@/services/plans.service"

type PlanCard = Awaited<ReturnType<typeof plansListPublicByType>>[number]
type PlanOffer = PlanCard["offers"][number]

type DurationOption = {
    key: string
    durationValue: number
    durationUnit: "month" | "year"
    months: number
    label: string
}

type Props = {
    plans: PlanCard[]
    showCheckout: boolean
    currentPlanId?: string | null
}

function offerDurationKey(offer: Pick<PlanOffer, "durationValue" | "durationUnit">): string {
    return `${offer.durationValue}:${offer.durationUnit}`
}

function collectDurationOptions(plans: PlanCard[]): DurationOption[] {
    const byKey = new Map<string, DurationOption>()
    for (const plan of plans) {
        const isFreePlan =
            plan.catalogRole === "free" ||
            plan.offers.length === 0 ||
            plan.offers.every((item) => Number(item.price) === 0)
        if (isFreePlan) continue
        for (const offer of plan.offers) {
            const key = offerDurationKey(offer)
            if (byKey.has(key)) continue
            byKey.set(key, {
                key,
                durationValue: offer.durationValue,
                durationUnit: offer.durationUnit,
                months: durationToMonths(offer.durationValue, offer.durationUnit),
                label: formatBillingPeriodLabel(offer.durationValue, offer.durationUnit),
            })
        }
    }
    return [...byKey.values()].sort((a, b) => a.months - b.months)
}

function pickOfferForDuration(
    offers: PlanOffer[],
    duration: DurationOption | null,
): PlanOffer | null {
    if (!duration) return null
    const matches = offers.filter(
        (offer) =>
            offer.durationValue === duration.durationValue &&
            offer.durationUnit === duration.durationUnit,
    )
    if (matches.length === 0) return null
    return matches.reduce((best, offer) =>
        Number(offer.price) < Number(best.price) ? offer : best,
    )
}

function formatDiscountLabel(
    offer: PlanOffer,
    discountAmount: number,
    originalPrice: number,
): string | null {
    if (discountAmount <= 0 || originalPrice <= 0) return null

    const percentages = offer.discounts.filter((d) => d.type === "percentage")
    const onlyPercentages =
        offer.discounts.length > 0 && offer.discounts.every((d) => d.type === "percentage")

    if (onlyPercentages && percentages.length > 0) {
        const totalPct = percentages.reduce((sum, d) => sum + Number(d.value), 0)
        const rounded = Math.round(totalPct * 10) / 10
        return `-${rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1)}%`
    }

    const pct = Math.round((discountAmount / originalPrice) * 100)
    if (pct <= 0) return null
    return `-${pct}%`
}

export function PlanPricingCards({ plans, showCheckout, currentPlanId = null }: Props) {
    const { toast } = useToast()
    const [pendingOfferId, setPendingOfferId] = useState<string | null>(null)
    const [pending, startTransition] = useTransition()

    const durationOptions = useMemo(() => collectDurationOptions(plans), [plans])
    const longestDurationKey = durationOptions.at(-1)?.key ?? null
    const [durationKey, setDurationKey] = useState<string | null>(longestDurationKey)

    const selectedDuration =
        durationOptions.find((item) => item.key === durationKey) ??
        durationOptions.find((item) => item.key === longestDurationKey) ??
        null

    function checkout(planOfferId: string) {
        setPendingOfferId(planOfferId)
        startTransition(async () => {
            const result = await createCheckoutPreferenceAction({ planOfferId })
            setPendingOfferId(null)
            if (!result.ok) {
                toast({
                    type: "error",
                    title: "No se pudo iniciar el pago",
                    message: result.error,
                })
                return
            }
            window.location.href = result.data.initPoint
        })
    }

    if (plans.length === 0) {
        return <p className="text-sm text-zinc-500">Todavía no hay planes publicados.</p>
    }

    return (
        <div className="space-y-4">
            {durationOptions.length > 1 ? (
                <div className="flex justify-center">
                    <div
                        role="tablist"
                        aria-label="Duración de la oferta"
                        className="inline-flex flex-wrap justify-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                        {durationOptions.map((option) => {
                            const selected = selectedDuration?.key === option.key
                            return (
                                <button
                                    key={option.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={selected}
                                    onClick={() => setDurationKey(option.key)}
                                    className={clsx(
                                        "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                        selected
                                            ? "bg-emerald-600 text-white"
                                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                                    )}
                                >
                                    {option.label}
                                </button>
                            )
                        })}
                    </div>
                </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                    const isFree =
                        plan.catalogRole === "free" ||
                        plan.offers.length === 0 ||
                        plan.offers.every((item) => Number(item.price) === 0)
                    const isCurrent = Boolean(currentPlanId && plan.id === currentPlanId)
                    const roleLabel = formatPlanCatalogRole(
                        isFree && plan.catalogRole === "none" ? "free" : plan.catalogRole,
                    )
                    const offer = isFree
                        ? null
                        : pickOfferForDuration(plan.offers, selectedDuration)
                    const breakdown = offer
                        ? applyDiscounts(
                              Number(offer.price),
                              offer.discounts.map((d) => ({
                                  type: d.type,
                                  value: Number(d.value),
                              })),
                          )
                        : null
                    const discountLabel =
                        offer && breakdown
                            ? formatDiscountLabel(
                                  offer,
                                  breakdown.discountAmount,
                                  breakdown.originalPrice,
                              )
                            : null

                    return (
                        <article
                            key={plan.id}
                            className={clsx(
                                "flex flex-col gap-3 rounded-xl border p-5",
                                isCurrent
                                    ? "border-emerald-500 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/20"
                                    : plan.catalogRole === "full"
                                      ? "border-emerald-500/60 bg-white dark:border-emerald-800 dark:bg-zinc-950"
                                      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
                            )}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                    {plan.name}
                                </h3>
                                <div className="flex flex-wrap justify-end gap-1">
                                    {isCurrent ? (
                                        <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                                            Plan actual
                                        </span>
                                    ) : null}
                                    {roleLabel && !isCurrent ? (
                                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                                            {roleLabel}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                            {plan.description ? (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {plan.description}
                                </p>
                            ) : null}

                            {plan.permissions.length > 0 ? (
                                <ul className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                                    {plan.permissions.map((permission) => (
                                        <li key={permission.code} className="flex gap-2">
                                            <span
                                                className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500"
                                                aria-hidden
                                            />
                                            <span>{formatPlanFeature(permission)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-zinc-500">
                                    Sin características configuradas.
                                </p>
                            )}

                            {isFree ? null : offer && breakdown ? (
                                <div className="mt-auto space-y-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                                    <div className="flex flex-wrap items-baseline gap-2">
                                        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                                            {formatMoneyArs(breakdown.finalPrice)}
                                        </p>
                                        {discountLabel ? (
                                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                {discountLabel}
                                            </span>
                                        ) : null}
                                    </div>
                                    {breakdown.discountAmount > 0 ? (
                                        <p className="text-xs text-zinc-500 line-through">
                                            {formatMoneyArs(breakdown.originalPrice)}
                                        </p>
                                    ) : null}
                                    <p className="text-xs text-zinc-500">
                                        {offer.name} ·{" "}
                                        {formatBillingPeriodLabel(
                                            offer.durationValue,
                                            offer.durationUnit,
                                        )}
                                    </p>
                                    {showCheckout && !isCurrent ? (
                                        <Button
                                            type="button"
                                            className="mt-3 w-full"
                                            size="sm"
                                            disabled={pending && pendingOfferId === offer.id}
                                            onClick={() => checkout(offer.id)}
                                        >
                                            {pending && pendingOfferId === offer.id
                                                ? "Redirigiendo…"
                                                : "Suscribirme"}
                                        </Button>
                                    ) : null}
                                </div>
                            ) : !isFree ? (
                                <p className="mt-auto border-t border-zinc-200 pt-3 text-sm text-zinc-500 dark:border-zinc-800">
                                    {selectedDuration
                                        ? `Sin oferta ${selectedDuration.label.toLowerCase()}`
                                        : "Sin oferta publicada"}
                                </p>
                            ) : null}
                        </article>
                    )
                })}
            </div>
        </div>
    )
}
