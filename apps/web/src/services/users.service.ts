import { Prisma, type User } from "@prisma/client"
import bcryptjs from "bcryptjs"

import { avatarImagePublicId, isCloudinaryUrl } from "@/lib/cloudinary-url"
import { getPrisma } from "@/lib/prisma"
import {
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "@/services/cloudinary.service"
import type { UserSelectOption } from "@/lib/user-display"
import type {
    UserCreateInput,
    UserListFilters,
    UserListSortBy,
    UserProfileUpdateInput,
    UserUpdateInput,
} from "@/schemas/user.schema"

export type { UserSelectOption } from "@/lib/user-display"
export { formatUserDisplayName } from "@/lib/user-display"

export type UserSafe = Omit<User, "passwordHash">

export type UserListItem = UserSafe & {
    clubName: string | null
}

export type UserMutationResult =
    | { ok: true; data: UserSafe }
    | { ok: false; error: string }

export type UsersPaginatedData = {
    currentPage: number
    totalPages: number
    users: UserListItem[]
}

export type UsersPaginatedResult =
    | { ok: true; data: UsersPaginatedData }
    | { ok: false; error: string }

export type UsersSearchForSelectData = {
    users: UserSelectOption[]
    hasMore: boolean
}

export type UsersSearchForSelectResult =
    | { ok: true; data: UsersSearchForSelectData }
    | { ok: false; error: string }

function toUserSafe(user: User): UserSafe {
    const { passwordHash: _passwordHash, ...safe } = user
    return safe
}

function mergeUserWhere(
    ...parts: (Prisma.UserWhereInput | undefined)[]
): Prisma.UserWhereInput {
    const clauses = parts.filter(
        (part): part is Prisma.UserWhereInput =>
            part != null && Object.keys(part).length > 0,
    )
    if (clauses.length === 0) return {}
    if (clauses.length === 1) return clauses[0]!
    return { AND: clauses }
}

/** Solo usuarios no eliminados (borrado lógico). */
export const activeUserWhere: Prisma.UserWhereInput = { deletedAt: null }

export async function userFindActiveByEmail(email: string): Promise<User | null> {
    return getPrisma().user.findFirst({
        where: { email, deletedAt: null },
    })
}

function buildUserWhereFilters(filters: UserListFilters): Prisma.UserWhereInput {
    const and: Prisma.UserWhereInput[] = [{ deletedAt: null }]

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

    if (filters.clubId?.trim()) {
        const clubId = filters.clubId.trim()
        and.push({
            OR: [{ clubId }, { managedClub: { id: clubId } }],
        })
    }

    return mergeUserWhere(...and)
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
    const user = await getPrisma().user.findFirst({
        where: { id, deletedAt: null },
    })
    return user ? toUserSafe(user) : null
}

export async function userGetAvatarUrl(userId: string): Promise<string | null> {
    const user = await getPrisma().user.findUnique({
        where: { id: userId },
        select: { avatarUrl: true },
    })
    return user?.avatarUrl ?? null
}

export async function usersListPaginated(
    page: number,
    take: number,
    filters: UserListFilters = {},
    sort: { sortBy: UserListSortBy; sortDir: "asc" | "desc" },
    visibility?: Prisma.UserWhereInput,
): Promise<UsersPaginatedResult> {
    const safePage = Math.max(1, Math.min(10_000, Math.floor(page)))
    const safeTake = Math.min(100, Math.max(1, Math.floor(take)))
    const where = mergeUserWhere(buildUserWhereFilters(filters), visibility)

    try {
        const [users, total] = await Promise.all([
            getPrisma().user.findMany({
                take: safeTake,
                skip: (safePage - 1) * safeTake,
                orderBy: userListOrderBy(sort.sortBy, sort.sortDir),
                where,
                include: {
                    club: { select: { name: true } },
                    managedClub: { select: { name: true } },
                },
            }),
            getPrisma().user.count({ where }),
        ])

        const totalPages = Math.max(1, Math.ceil(total / safeTake))

        return {
            ok: true,
            data: {
                currentPage: safePage,
                totalPages,
                users: users.map((user) => {
                    const { club, managedClub, ...rest } = user
                    const safe = toUserSafe(rest)
                    const clubName =
                        managedClub?.name ?? club?.name ?? null
                    return { ...safe, clubName }
                }),
            },
        }
    } catch (e) {
        console.error("[usersListPaginated]", e)
        return { ok: false, error: "Error al obtener la lista de usuarios" }
    }
}

export async function usersSearchForSelect(
    search: string | null | undefined,
    page: number,
    take = 10,
): Promise<UsersSearchForSelectResult> {
    const safePage = Math.max(1, Math.min(10_000, Math.floor(page)))
    const safeTake = Math.min(50, Math.max(1, Math.floor(take)))
    const q = search?.trim() || null

    const where: Prisma.UserWhereInput = q
        ? {
              OR: [
                  { firstName: { contains: q, mode: "insensitive" } },
                  { lastName: { contains: q, mode: "insensitive" } },
              ],
          }
        : {}

    try {
        const [users, total] = await Promise.all([
            getPrisma().user.findMany({
                take: safeTake,
                skip: (safePage - 1) * safeTake,
                where,
                orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
                select: { id: true, firstName: true, lastName: true },
            }),
            getPrisma().user.count({ where }),
        ])

        return {
            ok: true,
            data: {
                users,
                hasMore: safePage * safeTake < total,
            },
        }
    } catch (e) {
        console.error("[usersSearchForSelect]", e)
        return { ok: false, error: "Error al buscar usuarios" }
    }
}

export async function userCreate(data: UserCreateInput): Promise<UserMutationResult> {
    try {
        const existing = await userFindActiveByEmail(data.email)
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

        if (data.role === "club_manager") {
            const { clubEnsureForManager } = await import("@/services/clubs.service")
            await clubEnsureForManager({
                id: user.id,
                firstName: user.firstName,
            })
        }

        return { ok: true, data: toUserSafe(user) }
    } catch (e) {
        console.error("[userCreate]", e)
        return { ok: false, error: "Error al crear el usuario" }
    }
}

export async function userUpdate(data: UserUpdateInput): Promise<UserMutationResult> {
    try {
        const current = await getPrisma().user.findFirst({
            where: { id: data.id, deletedAt: null },
        })
        if (!current) {
            return { ok: false, error: "Usuario no encontrado" }
        }

        if (data.email !== current.email) {
            const clash = await userFindActiveByEmail(data.email)
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

        // Al promover a club_manager, asegurar que exista el Club (relación 1:1).
        if (data.role === "club_manager") {
            const { clubEnsureForManager } = await import("@/services/clubs.service")
            await clubEnsureForManager({
                id: user.id,
                firstName: user.firstName,
            })
        }

        return { ok: true, data: toUserSafe(user) }
    } catch (e) {
        console.error("[userUpdate]", e)
        return { ok: false, error: "Error al actualizar el usuario" }
    }
}

export async function userProfileUpdate(
    userId: string,
    data: UserProfileUpdateInput,
): Promise<UserMutationResult> {
    const current = await getPrisma().user.findFirst({
        where: { id: userId, deletedAt: null },
    })
    if (!current) {
        return { ok: false, error: "Usuario no encontrado" }
    }

    return userUpdate({
        id: userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        avatarUrl: data.avatarUrl ?? current.avatarUrl ?? "",
        role: current.role,
        emailVerified: Boolean(current.emailVerified),
        password: data.password,
        confirmPassword: data.confirmPassword,
    })
}

export async function userSaveAvatar(
    userId: string,
    imageBase64: string,
    mime: string,
): Promise<UserMutationResult> {
    try {
        const current = await getPrisma().user.findFirst({
            where: { id: userId, deletedAt: null },
        })
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
        const current = await getPrisma().user.findFirst({
            where: { id, deletedAt: null },
            include: { managedClub: { select: { id: true } } },
        })
        if (!current) {
            return { ok: false, error: "Usuario no encontrado" }
        }

        if (current.managedClub) {
            return {
                ok: false,
                error: "No se puede eliminar: es manager de un club. Reasigná o eliminá el club primero.",
            }
        }

        const user = await getPrisma().$transaction(async (tx) => {
            await tx.authToken.deleteMany({ where: { userId: id } })
            return tx.user.update({
                where: { id },
                data: { deletedAt: new Date() },
            })
        })

        return { ok: true, data: toUserSafe(user) }
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
            return { ok: false, error: "Usuario no encontrado" }
        }
        console.error("[userDelete]", e)
        return { ok: false, error: "Error al eliminar el usuario" }
    }
}
