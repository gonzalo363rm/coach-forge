import type { Metadata } from "next"

import { auth } from "@/auth"
import { PublicHomeContent } from "@/components/home/PublicHomeContent"
import { canShowUpgradeCta, getEffectiveEntitlements } from "@/lib/entitlements"
import { createPageMetadata } from "@/lib/seo"
import { getUserClubContext } from "@/services/clubs.service"
import {
    getClubHomeCatalogSafe,
    getPublicHomeCatalogSafe,
} from "@/services/home-catalog.service"
import { plansListPublicByType } from "@/services/plans.service"

export const revalidate = 300

export const metadata: Metadata = createPageMetadata({
    title: "Coach Forge | Ejercicios y clases públicas",
    description:
        "Explorá ejercicios y clases de entrenamiento públicas. Usá plantillas para crear tu contenido en Coach Forge.",
    path: "/",
    absoluteTitle: true,
})

export default async function Home() {
    const session = await auth()
    const clubContext = session?.user
        ? await getUserClubContext(session.user.id)
        : null

    const [communityCatalog, clubCatalog, individualPlans, clubPlans, entitlements] =
        await Promise.all([
            getPublicHomeCatalogSafe(),
            clubContext ? getClubHomeCatalogSafe(clubContext.clubId) : Promise.resolve(null),
            session?.user
                ? Promise.resolve([])
                : plansListPublicByType("individual"),
            session?.user ? Promise.resolve([]) : plansListPublicByType("club"),
            session?.user
                ? getEffectiveEntitlements(session.user.id)
                : Promise.resolve(null),
        ])

    const showUpgrade =
        entitlements != null &&
        canShowUpgradeCta(entitlements.subject, entitlements.catalogRole)

    return (
        <PublicHomeContent
            communityCatalog={communityCatalog}
            clubCatalog={clubCatalog}
            clubName={clubContext?.clubName ?? null}
            isLoggedIn={Boolean(session?.user)}
            firstName={session?.user?.firstName}
            individualPlans={individualPlans}
            clubPlans={clubPlans}
            showUpgrade={showUpgrade}
            upgradePlanName={entitlements?.planName ?? null}
            currentUserId={session?.user?.id ?? null}
        />
    )
}
