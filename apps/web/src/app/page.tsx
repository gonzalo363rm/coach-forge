import type { Metadata } from "next"

import { auth } from "@/auth"
import { PublicHomeContent } from "@/components/home/PublicHomeContent"
import { getPublicHomeCatalogSafe } from "@/services/home-catalog.service"

export const revalidate = 300

export const metadata: Metadata = {
    title: "Coach Forge | Ejercicios y clases públicas",
    description:
        "Explorá ejercicios y clases de entrenamiento públicas. Usá plantillas para crear tu contenido.",
}

export default async function Home() {
    const catalog = await getPublicHomeCatalogSafe()
    const session = await auth()

    return (
        <PublicHomeContent
            catalog={catalog}
            isLoggedIn={Boolean(session?.user)}
            firstName={session?.user?.firstName}
        />
    )
}
