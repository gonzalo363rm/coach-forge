"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { userProfileUpdateSchema } from "@/schemas/user.schema"
import { userProfileUpdate, type UserSafe } from "@/services/users.service"

import type { UserActionResult } from "./types"

export async function updateProfileAction(
    input: unknown,
): Promise<UserActionResult<UserSafe>> {
    const session = await auth()
    if (!session?.user) {
        return { ok: false, error: "No autenticado" }
    }

    const parsed = userProfileUpdateSchema.safeParse(input)
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

    const result = await userProfileUpdate(session.user.id, parsed.data)
    if (!result.ok) return result

    revalidatePath("/profile")
    revalidatePath("/")
    revalidatePath("/admin/users")

    return { ok: true, data: result.data }
}
