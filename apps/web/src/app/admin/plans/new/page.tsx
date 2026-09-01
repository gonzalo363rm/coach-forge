import type { Metadata } from "next"

import { getActivePermissionsAction } from "@/app/actions/plans"
import { PlanForm } from "@/components/plans/PlanForm"
import { requireSuperadminPage } from "@/lib/require-superadmin-page"
import { createPageMetadata } from "@/lib/seo"

export const metadata: Metadata = createPageMetadata({
    title: "Admin · Nuevo plan",
    description: "Creá un plan comercial.",
    path: "/admin/plans/new",
    noIndex: true,
})

export default async function PlanNewPage() {
    await requireSuperadminPage()
    const permissions = await getActivePermissionsAction()
    const catalog = permissions.ok ? permissions.data : []

    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
                <PlanForm mode="create" catalog={catalog} />
            </div>
        </div>
    )
}
