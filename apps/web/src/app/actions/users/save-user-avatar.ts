"use server"

import { z } from "zod"

import { requireAdmin } from "@/lib/require-admin"
import { userSaveAvatar, type UserSafe } from "@/services/users.service"

import { revalidateUsersViews } from "./revalidate-users"
import type { UserActionResult } from "./types"

const saveAvatarInputSchema = z.object({
    userId: z.string().min(1),
    imageBase64: z.string().min(1),
    imageMime: z.enum([
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/svg+xml",
    ]),
})

export async function saveUserAvatarAction(
    input: unknown,
): Promise<UserActionResult<UserSafe>> {
    const admin = await requireAdmin()
    if (!admin.ok) return admin

    const parsed = saveAvatarInputSchema.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false,
            error: "Datos de imagen inválidos",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await userSaveAvatar(
        parsed.data.userId,
        parsed.data.imageBase64,
        parsed.data.imageMime,
    )
    if (!result.ok) return result

    revalidateUsersViews()
    return { ok: true, data: result.data }
}
