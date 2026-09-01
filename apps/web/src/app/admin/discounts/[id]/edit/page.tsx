import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getDiscountByIdAction } from "@/app/actions/discounts"
import { DiscountForm } from "@/components/discounts/DiscountForm"
import { requireSuperadminPage } from "@/lib/require-superadmin-page"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Editar descuento",
    description: "Editá un descuento o cupón.",
    noIndex: true,
})

interface Props {
    params: Promise<{ id: string }>
}

export default async function DiscountEditPage({ params }: Props) {
    await requireSuperadminPage()
    const { id } = await params
    const result = await getDiscountByIdAction(id)
    if (!result.ok) notFound()

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <DiscountForm mode="edit" discount={result.data} />
            </div>
        </div>
    )
}
