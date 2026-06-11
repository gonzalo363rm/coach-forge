"use server"

import { z } from "zod"

import { requireAdmin } from "@/lib/require-admin"
import {
    filterableRolesForActor,
    userListVisibilityFilter,
} from "@/lib/user-permissions"
import { getUsersPaginatedParamsSchema } from "@/schemas/user.schema"
import {
    usersListPaginated,
    type UsersPaginatedData,
} from "@/services/users.service"

import type { UserActionResult } from "./types"

export async function getUsersPaginatedAction(
    input: unknown,
): Promise<UserActionResult<UsersPaginatedData>> {
    const admin = await requireAdmin()
    if (!admin.ok) return admin

    const parsed = getUsersPaginatedParamsSchema.safeParse(input ?? {})
    if (!parsed.success) {
        return {
            ok: false,
            error: "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const { page, take, filters, sortBy, sortDir } = parsed.data
    const allowedRoles = filterableRolesForActor(admin.user.role)
    const safeFilters = { ...(filters ?? {}) }
    if (safeFilters.role != null && !allowedRoles.includes(safeFilters.role)) {
        safeFilters.role = null
    }

    const result = await usersListPaginated(
        page,
        take,
        safeFilters,
        { sortBy, sortDir },
        userListVisibilityFilter(admin.user.role),
    )
    if (!result.ok) return result

    return { ok: true, data: result.data }
}
