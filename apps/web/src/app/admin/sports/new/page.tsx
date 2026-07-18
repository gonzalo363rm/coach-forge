import type { Metadata } from "next"

import { SportForm } from "@/components/sports/SportForm"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Nuevo deporte",
    description: "Creá un nuevo deporte en la plataforma.",
    path: "/admin/sports/new",
    noIndex: true,
})

export default function SportNewPage() {
    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <SportForm mode="create" />
            </div>
        </div>
    )
}
