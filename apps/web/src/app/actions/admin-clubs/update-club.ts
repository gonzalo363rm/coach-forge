"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdmin } from "@/lib/require-admin"
import { clubAdminUpdateSchema } from "@/schemas/club.schema"
import { clubAdminUpdate, clubGetAdminById, clubSaveLogo } from "@/services/clubs.service"

import type { ClubAdminActionResult } from "./types"

export async function getClubAdminByIdAction(id: string) {
    const admin = await requireAdmin()
    if (!admin.ok) return admin

    if (!id?.trim()) {
        return { ok: false as const, error: "Id obligatorio" }
    }

    const club = await clubGetAdminById(id)
    if (!club) {
        return { ok: false as const, error: "Club no encontrado" }
    }

    return { ok: true as const, data: club }
}

export async function updateClubAdminAction(
    input: unknown,
): Promise<ClubAdminActionResult<{ id: string }>> {
    const admin = await requireAdmin()
    if (!admin.ok) return admin

    const parsed = clubAdminUpdateSchema.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false,
            error:
                parsed.error.issues.map((i) => i.message).filter(Boolean).join(" ") ||
                "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await clubAdminUpdate(parsed.data)
    if (!result.ok) return result

    revalidatePath("/admin/clubs")
    revalidatePath(`/admin/clubs/${parsed.data.id}/edit`)
    revalidatePath("/admin/users")
    return { ok: true, data: { id: result.data.id } }
}

const saveClubLogoInputSchema = z.object({
    clubId: z.string().min(1),
    imageBase64: z.string().min(1),
    imageMime: z.enum([
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/svg+xml",
    ]),
})

export async function saveClubLogoAdminAction(
    input: unknown,
): Promise<ClubAdminActionResult<{ id: string; logoUrl: string | null }>> {
    const admin = await requireAdmin()
    if (!admin.ok) return admin

    const parsed = saveClubLogoInputSchema.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false,
            error: "Datos de imagen inválidos",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await clubSaveLogo(
        parsed.data.clubId,
        parsed.data.imageBase64,
        parsed.data.imageMime,
    )
    if (!result.ok) return result

    revalidatePath("/admin/clubs")
    revalidatePath(`/admin/clubs/${parsed.data.clubId}/edit`)
    revalidatePath("/club")
    return {
        ok: true,
        data: { id: result.data.id, logoUrl: result.data.logoUrl },
    }
}
