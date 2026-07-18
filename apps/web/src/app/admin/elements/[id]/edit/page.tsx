import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ElementForm } from "@/components/elements/ElementForm"
import { createPageMetadata } from "@/lib/seo"
import { elementGetById } from "@/services/elements.service"
import { sportsListAll } from "@/services/sports.service"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Editar elemento",
    description: "Editá un elemento del canvas.",
    noIndex: true,
})

interface Props {
    params: Promise<{ id: string }>
}

export default async function ElementEditPage({ params }: Props) {
    const { id } = await params
    const [row, sportRows] = await Promise.all([elementGetById(id), sportsListAll()])
    if (!row) notFound()

    const sports = sportRows.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full flex-1 flex-col gap-6 p-8">
                <ElementForm
                    mode="edit"
                    sports={sports}
                    element={{
                        id: row.id,
                        name: row.name,
                        image: row.image,
                        width: row.width,
                        height: row.height,
                        sportId: row.sportId,
                    }}
                />
            </main>
        </div>
    )
}
