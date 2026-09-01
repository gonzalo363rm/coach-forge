"use client"

import { ListNewLink } from "@/components/ui/ListNewLink"
import { formatCatalogStatus, formatDuration } from "@/lib/billing-labels"
import { applyDiscounts, formatMoneyArs } from "@/lib/plan-pricing"
import type { PlanDetail } from "@/services/plans.service"

import { PlanOfferRowActions } from "./PlanOfferRowActions"

type Props = {
    planId: string
    offers: PlanDetail["offers"]
}

export function PlanOffersSection({ planId, offers }: Props) {
    return (
        <section className="mx-auto mt-8 w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <header className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-zinc-800 dark:text-white">Ofertas</h2>
                <ListNewLink
                    href={`/admin/plans/${planId}/offers/new`}
                    ariaLabel="Nueva oferta"
                />
            </header>

            {offers.length === 0 ? (
                <p className="text-sm text-zinc-500">Este plan todavía no tiene ofertas.</p>
            ) : (
                <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                    <thead>
                        <tr className="text-left text-zinc-500">
                            <th className="py-2 pr-3 font-medium">Nombre</th>
                            <th className="py-2 pr-3 font-medium">Duración</th>
                            <th className="py-2 pr-3 font-medium">Precio</th>
                            <th className="py-2 pr-3 font-medium">Descuento</th>
                            <th className="py-2 pr-3 font-medium">Precio final</th>
                            <th className="py-2 pr-3 font-medium">Estado</th>
                            <th className="py-2 font-medium">
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {offers.map((offer) => {
                            const breakdown = applyDiscounts(
                                Number(offer.price),
                                offer.discounts.map((discount) => ({
                                    type: discount.type,
                                    value: Number(discount.value),
                                })),
                            )

                            return (
                                <tr key={offer.id}>
                                    <td className="py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-100">
                                        {offer.name}
                                    </td>
                                    <td className="whitespace-nowrap py-2 pr-3 text-zinc-700 dark:text-zinc-300">
                                        {formatDuration(offer.durationValue, offer.durationUnit)}
                                    </td>
                                    <td className="whitespace-nowrap py-2 pr-3 text-zinc-700 dark:text-zinc-300">
                                        {formatMoneyArs(Number(offer.price))}
                                    </td>
                                    <td className="py-2 pr-3 text-zinc-700 dark:text-zinc-300">
                                        {offer.discounts.length === 0
                                            ? "—"
                                            : offer.discounts
                                                  .map((discount) =>
                                                      discount.type === "percentage"
                                                          ? `${discount.name} (${discount.value}%)`
                                                          : `${discount.name} (${formatMoneyArs(Number(discount.value))})`,
                                                  )
                                                  .join(", ")}
                                    </td>
                                    <td className="whitespace-nowrap py-2 pr-3 font-medium text-zinc-900 dark:text-zinc-100">
                                        {formatMoneyArs(breakdown.finalPrice)}
                                    </td>
                                    <td className="py-2 pr-3">
                                        {formatCatalogStatus(offer.status)}
                                    </td>
                                    <td className="py-2 pl-1">
                                        <PlanOfferRowActions
                                            planId={planId}
                                            offerId={offer.id}
                                            status={offer.status}
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </section>
    )
}
