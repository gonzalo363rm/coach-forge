import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getActivePermissionsAction, getPlanByIdAction } from "@/app/actions/plans"
import { PlanForm } from "@/components/plans/PlanForm"
import { PlanOffersSection } from "@/components/plans/PlanOffersSection"
import { requireSuperadminPage } from "@/lib/require-superadmin-page"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Editar plan",
    description: "Editá un plan comercial y sus ofertas.",
    noIndex: true,
})

interface Props {
    params: Promise<{ id: string }>
}

export default async function PlanEditPage({ params }: Props) {
    await requireSuperadminPage()
    const { id } = await params
    const [planResult, permissions] = await Promise.all([
        getPlanByIdAction(id),
        getActivePermissionsAction(),
    ])
    if (!planResult.ok) notFound()

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <PlanForm
                    mode="edit"
                    catalog={permissions.ok ? permissions.data : []}
                    plan={planResult.data}
                />
                <PlanOffersSection planId={planResult.data.id} offers={planResult.data.offers} />
            </div>
        </div>
    )
}
