"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { userSaveAvatar, type UserSafe } from "@/services/users.service"

import type { UserActionResult } from "./types"

const saveMyAvatarInputSchema = z.object({
    imageBase64: z.string().min(1),
    imageMime: z.enum([
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/svg+xml",
    ]),
})

export async function saveMyAvatarAction(
    input: unknown,
): Promise<UserActionResult<UserSafe>> {
    const session = await auth()
    if (!session?.user) {
        return { ok: false, error: "No autenticado" }
    }

    const parsed = saveMyAvatarInputSchema.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false,
            error: "Datos de imagen inválidos",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await userSaveAvatar(
        session.user.id,
        parsed.data.imageBase64,
        parsed.data.imageMime,
    )
    if (!result.ok) return result

    revalidatePath("/profile")
    revalidatePath("/")
    revalidatePath("/admin/users")

    return { ok: true, data: result.data }
}
