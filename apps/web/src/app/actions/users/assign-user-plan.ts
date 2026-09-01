"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireSuperadmin } from "@/lib/require-superadmin"
import { assignUserPlanSchema } from "@/schemas/billing.schema"
import { assignPlanBySuperadmin } from "@/services/subscriptions.service"

import { revalidateUsersViews } from "./revalidate-users"
import type { UserActionResult } from "./types"

export async function assignUserPlanAction(
    input: unknown,
): Promise<
    UserActionResult<{
        planId: string
        planName: string
        endDate: Date | null
        mode: "free" | "subscription"
    }>
> {
    const admin = await requireSuperadmin()
    if (!admin.ok) return admin

    const parsed = assignUserPlanSchema.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false,
            error:
                parsed.error.issues.map((i) => i.message).filter(Boolean).join(" ") ||
                "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await assignPlanBySuperadmin({
        userId: parsed.data.userId,
        planId: parsed.data.planId,
        endDate: parsed.data.endDate || null,
    })
    if (!result.ok) return result

    revalidateUsersViews()
    revalidatePath(`/admin/users/${parsed.data.userId}/edit`)
    revalidatePath("/plans")
    revalidatePath("/payments/mine")
    revalidatePath("/admin/payments")

    return { ok: true, data: result.data }
}
