"use client"

import { GuestPricingSection } from "@/components/billing/GuestPricingSection"
import { PlanPricingCards } from "@/components/billing/PlanPricingCards"
import { UpgradePlanBanner } from "@/components/billing/UpgradePlanBanner"
import { HomeVisualCollage } from "@/components/home/HomeVisualCollage"
import { ButtonLink } from "@/components/ui/button"
import type { plansListPublicByType } from "@/services/plans.service"

type PlanCard = Awaited<ReturnType<typeof plansListPublicByType>>[number]

type LoggedInPlans = {
    plans: PlanCard[]
    description: string
    showCheckout: boolean
    currentPlanId: string | null
    inGracePeriod: boolean
    blockCheaperPlans: boolean
}

type Props = {
    firstName?: string
    individualPlans?: PlanCard[]
    clubPlans?: PlanCard[]
    showGuestPlans?: boolean
    loggedInPlans?: LoggedInPlans | null
    showUpgrade?: boolean
    upgradePlanName?: string | null
}

export function PublicHomeContent({
    firstName,
    individualPlans = [],
    clubPlans = [],
    showGuestPlans = false,
    loggedInPlans = null,
    showUpgrade = false,
    upgradePlanName = null,
}: Props) {
    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 p-6 sm:p-8">
                <header className="space-y-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Coach Forge
                    </p>
                    <h1 className="max-w-3xl text-3xl font-bold text-zinc-800 sm:text-4xl dark:text-white">
                        {firstName
                            ? `Hola, ${firstName}`
                            : "Creá ejercicios y clases de entrenamiento"}
                    </h1>
                    <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
                        Editor visual 2D, plantillas públicas y sesiones en vivo. Organizá tu
                        trabajo, compartí con tu club y llevá las clases al celular.
                    </p>
                </header>

                {showUpgrade ? <UpgradePlanBanner planName={upgradePlanName} /> : null}

                <HomeVisualCollage />

                <section className="mx-auto max-w-3xl space-y-4 text-center">
                    <h2 className="text-2xl font-bold text-zinc-800 dark:text-white sm:text-3xl">
                        Organizá, planificá y compartí con tu equipo
                    </h2>
                    <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                        Armá ejercicios claros en el canvas, construí clases con tiempos y
                        descansos, y compartilas con otros coaches o con tu club. Trabajá de
                        forma conjunta, seguí lo que ya funciona y llevá mejoras reales a cada
                        entrenamiento.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-1">
                        <ButtonLink href="/explore/exercises" variant="soft">
                            Ver ejercicios públicos
                        </ButtonLink>
                        <ButtonLink href="/explore/classes" variant="soft">
                            Ver clases públicas
                        </ButtonLink>
                    </div>
                </section>

                <section className="mx-auto max-w-3xl space-y-3 text-center">
                    <h2 className="text-xl font-semibold text-zinc-800 dark:text-white">
                        Llevala a la cancha
                    </h2>
                    <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                        Descubrí cómo instalar la app en iOS o Android y llevátela con vos a
                        tus clases, con cronómetro y ejercicios a mano.
                    </p>
                    <div className="flex justify-center pt-1">
                        <ButtonLink href="/app" variant="secondary">
                            Ver instructivo de instalación
                        </ButtonLink>
                    </div>
                </section>

                {showGuestPlans ? (
                    <GuestPricingSection
                        individualPlans={individualPlans}
                        clubPlans={clubPlans}
                    />
                ) : loggedInPlans ? (
                    <section className="space-y-4">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-zinc-800 dark:text-white">
                                Planes
                            </h2>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                {loggedInPlans.description}
                            </p>
                        </div>
                        <PlanPricingCards
                            plans={loggedInPlans.plans}
                            showCheckout={loggedInPlans.showCheckout}
                            currentPlanId={loggedInPlans.currentPlanId}
                            inGracePeriod={loggedInPlans.inGracePeriod}
                            blockCheaperPlans={loggedInPlans.blockCheaperPlans}
                        />
                    </section>
                ) : null}
            </main>
        </div>
    )
}
