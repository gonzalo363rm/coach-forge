import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Explorar",
    description: "Explorá ejercicios y clases públicas en Coach Forge.",
    path: "/explore",
})

export default function ExploreIndexPage() {
    redirect("/explore/exercises")
}
