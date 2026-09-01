import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getActiveDiscountsAction } from "@/app/actions/discounts"
import { getPlanOfferByIdAction } from "@/app/actions/plan-offers"
import { getPlanByIdAction } from "@/app/actions/plans"
import { PlanOfferForm } from "@/components/plans/PlanOfferForm"
import { requireSuperadminPage } from "@/lib/require-superadmin-page"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Editar oferta",
    description: "Editá una oferta de plan.",
    noIndex: true,
})

interface Props {
    params: Promise<{ id: string; offerId: string }>
}

export default async function PlanOfferEditPage({ params }: Props) {
    await requireSuperadminPage()
    const { id: planId, offerId } = await params
    const [planResult, offerResult, discounts] = await Promise.all([
        getPlanByIdAction(planId),
        getPlanOfferByIdAction(offerId),
        getActiveDiscountsAction(),
    ])
    if (!planResult.ok || !offerResult.ok || offerResult.data.planId !== planId) {
        notFound()
    }

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <PlanOfferForm
                    planId={planId}
                    planName={planResult.data.name}
                    discounts={discounts.ok ? discounts.data : []}
                    offer={offerResult.data}
                />
            </div>
        </div>
    )
}
