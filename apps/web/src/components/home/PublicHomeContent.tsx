"use client"

import clsx from "clsx"
import { useState } from "react"

import { GuestPricingSection } from "@/components/billing/GuestPricingSection"
import { UpgradePlanBanner } from "@/components/billing/UpgradePlanBanner"
import type { PublicHomeCatalog } from "@/services/home-catalog.service"
import type { plansListPublicByType } from "@/services/plans.service"

import { HomeCatalogSections } from "./HomeCatalogSections"

type Tab = "club" | "community"
type PlanCard = Awaited<ReturnType<typeof plansListPublicByType>>[number]

type Props = {
    communityCatalog: PublicHomeCatalog
    clubCatalog: PublicHomeCatalog | null
    clubName: string | null
    isLoggedIn: boolean
    firstName?: string
    individualPlans?: PlanCard[]
    clubPlans?: PlanCard[]
    showUpgrade?: boolean
    upgradePlanName?: string | null
    currentUserId?: string | null
}

export function PublicHomeContent({
    communityCatalog,
    clubCatalog,
    clubName,
    isLoggedIn,
    firstName,
    individualPlans = [],
    clubPlans = [],
    showUpgrade = false,
    upgradePlanName = null,
    currentUserId = null,
}: Props) {
    const hasClubTab = Boolean(clubCatalog && clubName)
    const [activeTab, setActiveTab] = useState<Tab>(hasClubTab ? "club" : "community")
    const catalog = activeTab === "club" && clubCatalog ? clubCatalog : communityCatalog
    const showGuestPricing =
        !isLoggedIn && (individualPlans.length > 0 || clubPlans.length > 0)

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 p-6 sm:p-8">
                <header className="space-y-3">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                        {firstName ? `Hola, ${firstName}` : "Coach Forge"}
                    </h1>
                    <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
                        {isLoggedIn
                            ? hasClubTab
                                ? "Explorá el contenido de tu club o el de la comunidad."
                                : "Explorá ejercicios y clases públicas. Usá una plantilla para crear tu versión o comenzá una sesión."
                            : "Conocé los planes y explorá ejercicios y clases de la comunidad. Iniciá sesión para usar plantillas."}
                    </p>
                </header>

                {showUpgrade ? <UpgradePlanBanner planName={upgradePlanName} /> : null}

                {showGuestPricing ? (
                    <GuestPricingSection
                        individualPlans={individualPlans}
                        clubPlans={clubPlans}
                    />
                ) : null}

                <section
                    className={clsx(
                        "space-y-6",
                        (showGuestPricing || showUpgrade) &&
                            "border-t border-zinc-200 pt-10 dark:border-zinc-800",
                    )}
                >
                    {!isLoggedIn ? (
                        <div className="space-y-1">
                            <h2 className="text-xl font-semibold text-zinc-800 dark:text-white">
                                Explorá la comunidad
                            </h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Ejercicios y clases públicas para inspirarte.
                            </p>
                        </div>
                    ) : null}

                    {hasClubTab ? (
                        <div
                            role="tablist"
                            aria-label="Catálogo"
                            className="flex gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === "club"}
                                onClick={() => setActiveTab("club")}
                                className={clsx(
                                    "flex-1 cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors",
                                    activeTab === "club"
                                        ? "bg-emerald-600 text-white"
                                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                                )}
                            >
                                {clubName}
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === "community"}
                                onClick={() => setActiveTab("community")}
                                className={clsx(
                                    "flex-1 cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors",
                                    activeTab === "community"
                                        ? "bg-emerald-600 text-white"
                                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                                )}
                            >
                                Comunidad
                            </button>
                        </div>
                    ) : null}

                    <HomeCatalogSections
                        catalog={catalog}
                        isLoggedIn={isLoggedIn}
                        currentUserId={currentUserId}
                    />
                </section>
            </main>
        </div>
    )
}
