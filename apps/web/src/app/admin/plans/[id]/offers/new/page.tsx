import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getActiveDiscountsAction } from "@/app/actions/discounts"
import { getPlanByIdAction } from "@/app/actions/plans"
import { PlanOfferForm } from "@/components/plans/PlanOfferForm"
import { requireSuperadminPage } from "@/lib/require-superadmin-page"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Nueva oferta",
    description: "Creá una oferta para un plan.",
    noIndex: true,
})

interface Props {
    params: Promise<{ id: string }>
}

export default async function PlanOfferNewPage({ params }: Props) {
    await requireSuperadminPage()
    const { id: planId } = await params
    const [planResult, discounts] = await Promise.all([
        getPlanByIdAction(planId),
        getActiveDiscountsAction(),
    ])
    if (!planResult.ok) notFound()

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <PlanOfferForm
                    planId={planId}
                    planName={planResult.data.name}
                    discounts={discounts.ok ? discounts.data : []}
                />
            </div>
        </div>
    )
}
