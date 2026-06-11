"use server"

import { z } from "zod"

import { requireAdmin } from "@/lib/require-admin"
import {
    assignableRolesForActor,
    canAdminEditUser,
    canManageUserRoles,
} from "@/lib/user-permissions"
import { userUpdateSchema } from "@/schemas/user.schema"
import { userGetById, userUpdate, type UserSafe } from "@/services/users.service"

import { revalidateUsersViews } from "./revalidate-users"
import type { UserActionResult } from "./types"

export async function updateUserAction(input: unknown): Promise<UserActionResult<UserSafe>> {
    const admin = await requireAdmin()
    if (!admin.ok) return admin

    const parsed = userUpdateSchema.safeParse(input)
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

    const target = await userGetById(parsed.data.id)
    if (!target) {
        return { ok: false, error: "Usuario no encontrado" }
    }
    if (!canAdminEditUser(admin.user.role, admin.user.id, target)) {
        return { ok: false, error: "No tienes permisos para editar este usuario" }
    }

    const data = { ...parsed.data }
    if (!canManageUserRoles(admin.user.role)) {
        data.role = target.role
    } else if (!assignableRolesForActor(admin.user.role).includes(data.role)) {
        data.role = target.role
    }

    const result = await userUpdate(data)
    if (!result.ok) return result

    revalidateUsersViews()
    return { ok: true, data: result.data }
}
