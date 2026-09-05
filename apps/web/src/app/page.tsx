import type { Metadata } from "next"

import { auth } from "@/auth"
import { PublicHomeContent } from "@/components/home/PublicHomeContent"
import {
    canShowUpgradeCta,
    getEffectiveEntitlements,
} from "@/lib/entitlements"
import { createPageMetadata } from "@/lib/seo"
import { canViewPlansNav } from "@/lib/user-permissions"
import { plansListPublicByType } from "@/services/plans.service"

export const revalidate = 300

export const metadata: Metadata = createPageMetadata({
    title: "Coach Forge | Ejercicios y clases de entrenamiento",
    description:
        "Creá ejercicios y clases con un editor visual. Explorá la comunidad, instalá la app y elegí tu plan.",
    path: "/",
    absoluteTitle: true,
})

export default async function Home() {
    const session = await auth()

    const entitlements = session?.user
        ? await getEffectiveEntitlements(session.user.id)
        : null

    const showUpgrade =
        entitlements != null &&
        canShowUpgradeCta(entitlements.subject, entitlements.catalogRole)

    const showGuestPlans = !session?.user
    const canShowLoggedInPlans =
        Boolean(session?.user?.role) &&
        canViewPlansNav(session!.user!.role) &&
        Boolean(entitlements?.subject)

    let individualPlans: Awaited<ReturnType<typeof plansListPublicByType>> = []
    let clubPlans: Awaited<ReturnType<typeof plansListPublicByType>> = []
    let loggedInPlans: {
        plans: Awaited<ReturnType<typeof plansListPublicByType>>
        description: string
        showCheckout: boolean
        currentPlanId: string | null
        inGracePeriod: boolean
        blockCheaperPlans: boolean
    } | null = null

    if (showGuestPlans) {
        ;[individualPlans, clubPlans] = await Promise.all([
            plansListPublicByType("individual"),
            plansListPublicByType("club"),
        ])
    } else if (canShowLoggedInPlans && entitlements?.subject) {
        const subject = entitlements.subject
        const planType =
            subject.actorRole === "admin" || subject.actorRole === "superadmin"
                ? "individual"
                : subject.planType

        const plans = await plansListPublicByType(planType)
        const description = subject.isClubMemberCoach
            ? "Planes del club. Solo el manager puede suscribirse o cambiar el plan."
            : subject.planType === "club"
              ? "Planes para tu club. Podés suscribirte desde acá."
              : "Planes individuales para tu cuenta de coach."

        loggedInPlans = {
            plans,
            description,
            showCheckout: subject.canManageBilling,
            currentPlanId: entitlements.planId,
            inGracePeriod: entitlements.inGracePeriod,
            blockCheaperPlans:
                entitlements.catalogRole === "full" && !entitlements.inGracePeriod,
        }
    }

    return (
        <PublicHomeContent
            firstName={session?.user?.firstName}
            individualPlans={individualPlans}
            clubPlans={clubPlans}
            showGuestPlans={showGuestPlans}
            loggedInPlans={loggedInPlans}
            showUpgrade={showUpgrade}
            upgradePlanName={entitlements?.planName ?? null}
        />
    )
}
