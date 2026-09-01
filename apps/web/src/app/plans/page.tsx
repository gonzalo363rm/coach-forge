import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { PlanPricingCards } from "@/components/billing/PlanPricingCards"
import { getEffectiveEntitlements } from "@/lib/entitlements"
import { createPageMetadata } from "@/lib/seo"
import { plansListPublicByType } from "@/services/plans.service"

export const metadata: Metadata = createPageMetadata({
    title: "Planes",
    description: "Consultá los planes de Coach Forge.",
    path: "/plans",
})

export default async function PlansPage() {
    const session = await auth()
    if (!session?.user) {
        redirect("/login?callbackUrl=/plans")
    }

    const { subject, planId, inGracePeriod, catalogRole } = await getEffectiveEntitlements(
        session.user.id,
    )
    if (!subject) {
        redirect("/")
    }

    // Staff ve catálogo individual por defecto (solo lectura).
    const planType =
        subject.actorRole === "admin" || subject.actorRole === "superadmin"
            ? "individual"
            : subject.planType

    const canCheckout = subject.canManageBilling
    const plans = await plansListPublicByType(planType)

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6 sm:p-8">
                <header className="space-y-2">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">Planes</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {subject.isClubMemberCoach
                            ? "Planes del club. Solo el manager puede suscribirse o cambiar el plan."
                            : subject.planType === "club"
                              ? "Planes para tu club. Podés suscribirte desde acá."
                              : "Planes individuales para tu cuenta de coach."}
                    </p>
                </header>
                <PlanPricingCards
                    plans={plans}
                    showCheckout={canCheckout}
                    currentPlanId={planId}
                    inGracePeriod={inGracePeriod}
                    blockCheaperPlans={catalogRole === "full" && !inGracePeriod}
                />
            </main>
        </div>
    )
}
