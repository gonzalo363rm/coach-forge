import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SportForm } from "@/components/sports/SportForm"
import { createPageMetadata } from "@/lib/seo"
import { sportsGetById } from "@/services/sports.service"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Editar deporte",
    description: "Editá un deporte de la plataforma.",
    noIndex: true,
})

interface Props {
    params: Promise<{ id: string }>
}

export default async function SportEditPage({ params }: Props) {
    const { id } = await params
    const sport = await sportsGetById(id)
    if (!sport) notFound()

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <SportForm mode="edit" sport={sport} />
            </div>
        </div>
    )
}
