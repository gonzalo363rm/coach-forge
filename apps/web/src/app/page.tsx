import type { Metadata } from "next"

import { auth } from "@/auth"
import { PublicHomeContent } from "@/components/home/PublicHomeContent"
import { createPageMetadata } from "@/lib/seo"
import { getUserClubContext } from "@/services/clubs.service"
import {
    getClubHomeCatalogSafe,
    getPublicHomeCatalogSafe,
} from "@/services/home-catalog.service"

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

    const [communityCatalog, clubCatalog] = await Promise.all([
        getPublicHomeCatalogSafe(),
        clubContext ? getClubHomeCatalogSafe(clubContext.clubId) : Promise.resolve(null),
    ])

    return (
        <PublicHomeContent
            communityCatalog={communityCatalog}
            clubCatalog={clubCatalog}
            clubName={clubContext?.clubName ?? null}
            isLoggedIn={Boolean(session?.user)}
            firstName={session?.user?.firstName}
        />
    )
}
