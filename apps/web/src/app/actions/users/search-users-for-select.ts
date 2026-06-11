"use server"

import { z } from "zod"

import { requireAdmin } from "@/lib/require-admin"
import { searchUsersForSelectParamsSchema } from "@/schemas/user.schema"
import {
    usersSearchForSelect,
    type UsersSearchForSelectData,
} from "@/services/users.service"

import type { UserActionResult } from "./types"

export async function searchUsersForSelectAction(
    input: unknown,
): Promise<UserActionResult<UsersSearchForSelectData>> {
    const admin = await requireAdmin()
    if (!admin.ok) return admin

    const parsed = searchUsersForSelectParamsSchema.safeParse(input ?? {})
    if (!parsed.success) {
        return {
            ok: false,
            error: "Parámetros de búsqueda inválidos",
            details: z.treeifyError(parsed.error),
        }
    }

    const { search, page, take } = parsed.data
    const result = await usersSearchForSelect(search, page, take)
    if (!result.ok) return result

    return { ok: true, data: result.data }
}
