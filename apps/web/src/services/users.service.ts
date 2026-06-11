import { Prisma, type User } from "@prisma/client"
import bcryptjs from "bcryptjs"

import { avatarImagePublicId, isCloudinaryUrl } from "@/lib/cloudinary-url"
import { getPrisma } from "@/lib/prisma"
import {
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "@/services/cloudinary.service"
import type {
    UserCreateInput,
    UserListFilters,
    UserListSortBy,
    UserUpdateInput,
} from "@/schemas/user.schema"

export type UserSafe = Omit<User, "passwordHash">

export type UserMutationResult =
    | { ok: true; data: UserSafe }
    | { ok: false; error: string }

export type UsersPaginatedData = {
    currentPage: number
    totalPages: number
    users: UserSafe[]
}

export type UsersPaginatedResult =
    | { ok: true; data: UsersPaginatedData }
    | { ok: false; error: string }

function toUserSafe(user: User): UserSafe {
    const { passwordHash: _passwordHash, ...safe } = user
    return safe
}

function buildUserWhereFilters(filters: UserListFilters): Prisma.UserWhereInput {
    const and: Prisma.UserWhereInput[] = []

    if (filters.search) {
        and.push({
            OR: [
                { firstName: { contains: filters.search, mode: "insensitive" } },
                { lastName: { contains: filters.search, mode: "insensitive" } },
                { email: { contains: filters.search, mode: "insensitive" } },
            ],
        })
    }

    if (filters.role != null) {
        and.push({ role: filters.role })
    }

    if (and.length === 0) return {}
    if (and.length === 1) return and[0]!
    return { AND: and }
}

function userListOrderBy(
    sortBy: UserListSortBy,
    sortDir: "asc" | "desc",
): Prisma.UserOrderByWithRelationInput {
    switch (sortBy) {
        case "firstName":
            return { firstName: sortDir }
        case "lastName":
            return { lastName: sortDir }
        case "email":
            return { email: sortDir }
        case "role":
            return { role: sortDir }
        case "createdAt":
            return { createdAt: sortDir }
        case "updatedAt":
        default:
            return { updatedAt: sortDir }
    }
}

export async function userGetById(id: string): Promise<UserSafe | null> {
    const user = await getPrisma().user.findUnique({ where: { id } })
    return user ? toUserSafe(user) : null
}

export async function usersListPaginated(
    page: number,
    take: number,
    filters: UserListFilters = {},
    sort: { sortBy: UserListSortBy; sortDir: "asc" | "desc" },
): Promise<UsersPaginatedResult> {
    const safePage = Math.max(1, Math.min(10_000, Math.floor(page)))
    const safeTake = Math.min(100, Math.max(1, Math.floor(take)))
    const where = buildUserWhereFilters(filters)

    try {
        const [users, total] = await Promise.all([
            getPrisma().user.findMany({
                take: safeTake,
                skip: (safePage - 1) * safeTake,
                orderBy: userListOrderBy(sort.sortBy, sort.sortDir),
                where,
            }),
            getPrisma().user.count({ where }),
        ])

        const totalPages = Math.max(1, Math.ceil(total / safeTake))

        return {
            ok: true,
            data: {
                currentPage: safePage,
                totalPages,
                users: users.map(toUserSafe),
            },
        }
    } catch (e) {
        console.error("[usersListPaginated]", e)
        return { ok: false, error: "Error al obtener la lista de usuarios" }
    }
}

export async function userCreate(data: UserCreateInput): Promise<UserMutationResult> {
    try {
        const existing = await getPrisma().user.findUnique({
            where: { email: data.email },
        })
        if (existing) {
            return { ok: false, error: "Ya existe un usuario con ese email" }
        }

        const passwordHash = await bcryptjs.hash(data.password, 12)
        const user = await getPrisma().user.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phoneNumber: data.phoneNumber?.trim() ? data.phoneNumber.trim() : null,
                role: data.role,
                avatarUrl: data.avatarUrl?.trim() ? data.avatarUrl.trim() : null,
                passwordHash,
                emailVerified: data.emailVerified ? new Date() : null,
            },
        })

        return { ok: true, data: toUserSafe(user) }
    } catch (e) {
        console.error("[userCreate]", e)
        return { ok: false, error: "Error al crear el usuario" }
    }
}

export async function userUpdate(data: UserUpdateInput): Promise<UserMutationResult> {
    try {
        const current = await getPrisma().user.findUnique({ where: { id: data.id } })
        if (!current) {
            return { ok: false, error: "Usuario no encontrado" }
        }

        if (data.email !== current.email) {
            const clash = await getPrisma().user.findUnique({
                where: { email: data.email },
            })
            if (clash && clash.id !== data.id) {
                return { ok: false, error: "Ya existe un usuario con ese email" }
            }
        }

        const nextAvatarUrl = data.avatarUrl?.trim() ? data.avatarUrl.trim() : null
        if (
            !nextAvatarUrl &&
            current.avatarUrl &&
            isCloudinaryUrl(current.avatarUrl)
        ) {
            await deleteCloudinaryImage("avatars", avatarImagePublicId(data.id))
        }

        const updateData: Prisma.UserUpdateInput = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber?.trim() ? data.phoneNumber.trim() : null,
            role: data.role,
            avatarUrl: nextAvatarUrl,
            emailVerified: data.emailVerified
                ? current.emailVerified ?? new Date()
                : null,
        }

        if (data.password && data.password.length > 0) {
            updateData.passwordHash = await bcryptjs.hash(data.password, 12)
        }

        const user = await getPrisma().user.update({
            where: { id: data.id },
            data: updateData,
        })

        return { ok: true, data: toUserSafe(user) }
    } catch (e) {
        console.error("[userUpdate]", e)
        return { ok: false, error: "Error al actualizar el usuario" }
    }
}

async function userOwnedContentCounts(
    userId: string,
): Promise<{ exercises: number; classes: number }> {
    const [exercises, classes] = await Promise.all([
        getPrisma().exercise.count({ where: { creatorId: userId } }),
        getPrisma().trainingClass.count({ where: { creatorId: userId } }),
    ])

    return { exercises, classes }
}

function formatUserInUseMessage(counts: { exercises: number; classes: number }): string {
    const parts: string[] = []
    if (counts.exercises > 0) {
        parts.push(`${counts.exercises} ejercicio${counts.exercises === 1 ? "" : "s"}`)
    }
    if (counts.classes > 0) {
        parts.push(`${counts.classes} clase${counts.classes === 1 ? "" : "s"}`)
    }

    return `No se puede eliminar: es creador de ${parts.join(" y ")}`
}

export async function userSaveAvatar(
    userId: string,
    imageBase64: string,
    mime: string,
): Promise<UserMutationResult> {
    try {
        const current = await getPrisma().user.findUnique({ where: { id: userId } })
        if (!current) {
            return { ok: false, error: "Usuario no encontrado" }
        }

        const buffer = Buffer.from(imageBase64, "base64")
        if (buffer.length === 0) {
            return { ok: false, error: "Imagen vacía" }
        }

        const url = await uploadImageBuffer(
            buffer,
            mime,
            "avatars",
            avatarImagePublicId(userId),
        )

        const user = await getPrisma().user.update({
            where: { id: userId },
            data: { avatarUrl: url },
        })

        return { ok: true, data: toUserSafe(user) }
    } catch (e) {
        console.error("[userSaveAvatar]", e)
        const msg = e instanceof Error ? e.message : "Error al guardar el avatar"
        return { ok: false, error: msg }
    }
}

export async function userDelete(
    id: string,
    currentUserId?: string | null,
): Promise<UserMutationResult> {
    if (currentUserId && id === currentUserId) {
        return { ok: false, error: "No puedes eliminar tu propia cuenta" }
    }

    try {
        const counts = await userOwnedContentCounts(id)
        if (counts.exercises > 0 || counts.classes > 0) {
            return { ok: false, error: formatUserInUseMessage(counts) }
        }

        const user = await getPrisma().user.delete({ where: { id } })

        if (user.avatarUrl && isCloudinaryUrl(user.avatarUrl)) {
            await deleteCloudinaryImage("avatars", avatarImagePublicId(id))
        }

        return { ok: true, data: toUserSafe(user) }
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2025") {
                return { ok: false, error: "Usuario no encontrado" }
            }
            if (e.code === "P2003") {
                return {
                    ok: false,
                    error: formatUserInUseMessage(await userOwnedContentCounts(id)),
                }
            }
        }
        console.error("[userDelete]", e)
        return { ok: false, error: "Error al eliminar el usuario" }
    }
}
