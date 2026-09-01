import { revalidatePath } from "next/cache"

export function revalidateBillingViews(planId?: string) {
    revalidatePath("/admin/plans")
    revalidatePath("/admin/discounts")
    if (planId) {
        revalidatePath(`/admin/plans/${planId}/edit`)
    }
}
