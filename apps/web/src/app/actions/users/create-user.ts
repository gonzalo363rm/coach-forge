"use server"

import { z } from "zod"

import { requireAdmin } from "@/lib/require-admin"
import {
    assignableRolesForActor,
    canManageUserRoles,
} from "@/lib/user-permissions"
import { userCreateSchema } from "@/schemas/user.schema"
import { userCreate, type UserSafe } from "@/services/users.service"

import { revalidateUsersViews } from "./revalidate-users"
import type { UserActionResult } from "./types"

export async function createUserAction(input: unknown): Promise<UserActionResult<UserSafe>> {
    const admin = await requireAdmin()
    if (!admin.ok) return admin

    const parsed = userCreateSchema.safeParse(input)
    if (!parsed.success) {
        const issues = parsed.error.issues
        const error =
            issues.map((i) => i.message).filter(Boolean).join(" ") || "Validación fallida"
        return {
            ok: false,
            error,
            details: z.treeifyError(parsed.error),
        }
    }

    const data = { ...parsed.data }
    if (!canManageUserRoles(admin.user.role)) {
        data.role = "coach"
    } else if (!assignableRolesForActor(admin.user.role).includes(data.role)) {
        data.role = "coach"
    }

    const result = await userCreate(data)
    if (!result.ok) return result

    revalidateUsersViews()
    return { ok: true, data: result.data }
}
