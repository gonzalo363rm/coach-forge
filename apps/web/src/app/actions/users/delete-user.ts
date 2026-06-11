"use server"

import { z } from "zod"

import { requireAdmin } from "@/lib/require-admin"
import { userDeleteParamsSchema } from "@/schemas/user.schema"
import { userDelete, type UserSafe } from "@/services/users.service"

import { revalidateUsersViews } from "./revalidate-users"
import type { UserActionResult } from "./types"

export async function deleteUserAction(input: unknown): Promise<UserActionResult<UserSafe>> {
    const admin = await requireAdmin()
    if (!admin.ok) return admin

    const raw = typeof input === "string" ? { id: input } : input
    const parsed = userDeleteParamsSchema.safeParse(raw)
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await userDelete(parsed.data.id, admin.user.id)
    if (!result.ok) return result

    revalidateUsersViews()
    return { ok: true, data: result.data }
}
