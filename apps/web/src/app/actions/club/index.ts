"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireClubManager } from "@/lib/require-club-manager"
import {
    clubMemberCreateSchema,
    clubMemberUpdateSchema,
    clubUpdateSchema,
    getClubMembersPaginatedParamsSchema,
} from "@/schemas/club.schema"
import {
    clubCreateMember,
    clubDeleteMember,
    clubGetByManagerId,
    clubGetMember,
    clubMembersListPaginated,
    clubSaveLogo,
    clubUpdate,
    clubUpdateMember,
    type ClubMembersPaginatedData,
} from "@/services/clubs.service"

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function getMyClubAction() {
    const check = await requireClubManager()
    if (!check.ok) return check

    const club = await clubGetByManagerId(check.user.id)
    if (!club) {
        return { ok: false as const, error: "No se encontró el club" }
    }

    return { ok: true as const, data: club }
}

export async function updateMyClubAction(input: unknown): Promise<ActionResult<{ id: string }>> {
    const check = await requireClubManager()
    if (!check.ok) return check

    const parsed = clubUpdateSchema.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false,
            error: parsed.error.issues.map((i) => i.message).join(" ") || "Validación fallida",
        }
    }

    const result = await clubUpdate(check.clubId, parsed.data)
    if (!result.ok) return result

    revalidatePath("/club")
    return { ok: true, data: { id: result.data.id } }
}

const saveClubLogoInputSchema = z.object({
    imageBase64: z.string().min(1),
    imageMime: z.enum([
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/svg+xml",
    ]),
})

export async function saveMyClubLogoAction(
    input: unknown,
): Promise<ActionResult<{ id: string; logoUrl: string | null }>> {
    const check = await requireClubManager()
    if (!check.ok) return check

    const parsed = saveClubLogoInputSchema.safeParse(input)
    if (!parsed.success) {
        return { ok: false, error: "Datos de imagen inválidos" }
    }

    const result = await clubSaveLogo(
        check.clubId,
        parsed.data.imageBase64,
        parsed.data.imageMime,
    )
    if (!result.ok) return result

    revalidatePath("/club")
    revalidatePath("/admin/clubs")
    return {
        ok: true,
        data: { id: result.data.id, logoUrl: result.data.logoUrl },
    }
}

export async function getClubMembersPaginatedAction(
    input: unknown,
): Promise<ActionResult<ClubMembersPaginatedData>> {
    const check = await requireClubManager()
    if (!check.ok) return check

    const parsed = getClubMembersPaginatedParamsSchema.safeParse(input)
    if (!parsed.success) {
        return { ok: false, error: "Parámetros de listado inválidos" }
    }

    const { page, take, filters, sortBy, sortDir } = parsed.data
    return clubMembersListPaginated(check.clubId, page, take, filters ?? {}, {
        sortBy,
        sortDir,
    })
}

export async function createClubMemberAction(input: unknown) {
    const check = await requireClubManager()
    if (!check.ok) return check

    const parsed = clubMemberCreateSchema.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false as const,
            error:
                parsed.error.issues.map((i) => i.message).filter(Boolean).join(" ") ||
                "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await clubCreateMember(check.clubId, parsed.data)
    if (!result.ok) return result

    revalidatePath("/club/members")
    return result
}

export async function getClubMemberAction(id: string) {
    const check = await requireClubManager()
    if (!check.ok) return check

    if (!id?.trim()) {
        return { ok: false as const, error: "Id obligatorio" }
    }

    const member = await clubGetMember(check.clubId, id)
    if (!member) {
        return { ok: false as const, error: "Coach no encontrado en tu club" }
    }

    return { ok: true as const, data: member }
}

export async function updateClubMemberAction(input: unknown) {
    const check = await requireClubManager()
    if (!check.ok) return check

    const parsed = clubMemberUpdateSchema.safeParse(input)
    if (!parsed.success) {
        return {
            ok: false as const,
            error:
                parsed.error.issues.map((i) => i.message).filter(Boolean).join(" ") ||
                "Validación fallida",
            details: z.treeifyError(parsed.error),
        }
    }

    const result = await clubUpdateMember(check.clubId, parsed.data)
    if (!result.ok) return result

    revalidatePath("/club/members")
    revalidatePath(`/club/members/${parsed.data.id}/edit`)
    return result
}

export async function deleteClubMemberAction(input: { id: string }) {
    const check = await requireClubManager()
    if (!check.ok) return check

    if (!input.id?.trim()) {
        return { ok: false as const, error: "Id obligatorio" }
    }

    const result = await clubDeleteMember(check.clubId, input.id)
    if (!result.ok) return result

    revalidatePath("/club/members")
    return result
}
