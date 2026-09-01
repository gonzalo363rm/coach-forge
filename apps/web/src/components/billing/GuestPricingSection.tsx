"use client"

import clsx from "clsx"
import { useState } from "react"

import { PlanPricingCards } from "@/components/billing/PlanPricingCards"
import type { plansListPublicByType } from "@/services/plans.service"

type PlanCard = Awaited<ReturnType<typeof plansListPublicByType>>[number]

type Props = {
    individualPlans: PlanCard[]
    clubPlans: PlanCard[]
}

export function GuestPricingSection({ individualPlans, clubPlans }: Props) {
    const [tab, setTab] = useState<"individual" | "club">("individual")

    return (
        <section className="space-y-4">
            <div className="space-y-1">
                <h2 className="text-xl font-semibold text-zinc-800 dark:text-white">Planes</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Elegí el plan individual o de club. Iniciá sesión para suscribirte.
                </p>
            </div>
            <div
                role="tablist"
                aria-label="Tipo de plan"
                className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
            >
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "individual"}
                    onClick={() => setTab("individual")}
                    className={clsx(
                        "flex-1 cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors",
                        tab === "individual"
                            ? "bg-emerald-600 text-white"
                            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                    )}
                >
                    Individual
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "club"}
                    onClick={() => setTab("club")}
                    className={clsx(
                        "flex-1 cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors",
                        tab === "club"
                            ? "bg-emerald-600 text-white"
                            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                    )}
                >
                    Club
                </button>
            </div>
            <PlanPricingCards
                plans={tab === "individual" ? individualPlans : clubPlans}
                showCheckout={false}
            />
        </section>
    )
}
