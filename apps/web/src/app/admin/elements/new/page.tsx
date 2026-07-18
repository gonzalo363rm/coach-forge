import type { Metadata } from "next"

import { ElementForm } from "@/components/elements/ElementForm"
import { createPageMetadata } from "@/lib/seo"
import { sportsListAll } from "@/services/sports.service"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Nuevo elemento",
    description: "Creá un nuevo elemento para el canvas.",
    path: "/admin/elements/new",
    noIndex: true,
})

export default async function ElementNewPage() {
    const sportRows = await sportsListAll()
    const sports = sportRows.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full flex-1 flex-col gap-6 p-8">
                <ElementForm mode="create" sports={sports} />
            </main>
        </div>
    )
}
