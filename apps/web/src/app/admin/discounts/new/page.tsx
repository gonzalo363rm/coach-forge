import type { Metadata } from "next"

import { DiscountForm } from "@/components/discounts/DiscountForm"
import { requireSuperadminPage } from "@/lib/require-superadmin-page"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Nuevo descuento",
    description: "Creá un descuento o cupón.",
    path: "/admin/discounts/new",
    noIndex: true,
})

export default async function DiscountNewPage() {
    await requireSuperadminPage()

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <DiscountForm mode="create" />
            </div>
        </div>
    )
}
