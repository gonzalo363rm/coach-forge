import type { Club, Prisma } from "@prisma/client"
import bcryptjs from "bcryptjs"

import { clubLogoPublicId, isCloudinaryUrl } from "@/lib/cloudinary-url"
import { getPrisma } from "@/lib/prisma"
import type {
    ClubAdminUpdateInput,
    ClubListFilters,
    ClubListSortBy,
    ClubMemberCreateInput,
    ClubMemberListFilters,
    ClubMemberListSortBy,
    ClubMemberUpdateInput,
    ClubUpdateInput,
} from "@/schemas/club.schema"
import {
    deleteCloudinaryImage,
    uploadImageBuffer,
} from "@/services/cloudinary.service"
import type { UserSafe } from "@/services/users.service"

export type ClubWithMemberCount = Club & {
    memberCount: number
}

export type ClubManagerSummary = {
    id: string
    firstName: string
    lastName: string
    email: string
}

export type ClubListItem = Club & {
    memberCount: number
    manager: ClubManagerSummary
}

export type ClubAdminDetail = ClubListItem

export type ClubsPaginatedData = {
    currentPage: number
    totalPages: number
    clubs: ClubListItem[]
}

export type ClubsPaginatedResult =
    | { ok: true; data: ClubsPaginatedData }
    | { ok: false; error: string }

export type ClubSelectOption = {
    id: string
    name: string
}

export type ClubMutationResult =
    | { ok: true; data: Club }
    | { ok: false; error: string }

export type ClubMemberMutationResult =
    | { ok: true; data: UserSafe }
    | { ok: false; error: string }

export type ClubMembersPaginatedData = {
    currentPage: number
    totalPages: number
    users: UserSafe[]
    memberCount: number
    maxMembers: number
}

export type ClubMembersPaginatedResult =
    | { ok: true; data: ClubMembersPaginatedData }
    | { ok: false; error: string }

export type UserClubContext = {
    clubId: string
    clubName: string
} | null

function toUserSafe(user: {
    id: string
    firstName: string
    lastName: string
    phoneNumber: string | null
    email: string
    emailVerified: Date | null
    passwordHash: string
    role: UserSafe["role"]
    avatarUrl: string | null
    clubId: string | null
    createdAt: Date
    updatedAt: Date
}): UserSafe {
    const { passwordHash: _passwordHash, ...safe } = user
    return safe
}

export async function clubEnsureForManager(
    manager: { id: string; firstName: string },
    defaults?: { name?: string; address?: string | null },
): Promise<Club> {
    const prisma = getPrisma()
    const existing = await prisma.club.findUnique({ where: { managerId: manager.id } })
    if (existing) return existing

    return prisma.club.create({
        data: {
            name: defaults?.name?.trim() || `Club de ${manager.firstName.trim()}`,
            address: defaults?.address?.trim() ? defaults.address.trim() : null,
            managerId: manager.id,
            maxMembers: 20,
        },
    })
}

export async function clubGetByManagerId(managerId: string): Promise<ClubWithMemberCount | null> {
    const prisma = getPrisma()
    const club = await prisma.club.findUnique({ where: { managerId } })
    if (!club) return null

    const memberCount = await prisma.user.count({
        where: { clubId: club.id, role: "coach" },
    })

    return { ...club, memberCount }
}

export async function clubGetById(id: string): Promise<ClubWithMemberCount | null> {
    const prisma = getPrisma()
    const club = await prisma.club.findUnique({ where: { id } })
    if (!club) return null

    const memberCount = await prisma.user.count({
        where: { clubId: club.id, role: "coach" },
    })

    return { ...club, memberCount }
}

export async function clubGetAdminById(id: string): Promise<ClubAdminDetail | null> {
    const prisma = getPrisma()
    const club = await prisma.club.findUnique({
        where: { id },
        include: {
            manager: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    })
    if (!club) return null

    const memberCount = await prisma.user.count({
        where: { clubId: club.id, role: "coach" },
    })

    return { ...club, memberCount }
}

function clubListOrderBy(
    sortBy: ClubListSortBy,
    sortDir: "asc" | "desc",
): Prisma.ClubOrderByWithRelationInput {
    switch (sortBy) {
        case "name":
            return { name: sortDir }
        case "maxMembers":
            return { maxMembers: sortDir }
        case "createdAt":
            return { createdAt: sortDir }
        case "updatedAt":
        default:
            return { updatedAt: sortDir }
    }
}

export async function clubsListPaginated(
    page: number,
    take: number,
    filters: ClubListFilters = {},
    sort: { sortBy: ClubListSortBy; sortDir: "asc" | "desc" } = {
        sortBy: "updatedAt",
        sortDir: "desc",
    },
): Promise<ClubsPaginatedResult> {
    const safePage = Math.max(1, Math.min(10_000, Math.floor(page)))
    const safeTake = Math.min(100, Math.max(1, Math.floor(take)))

    const and: Prisma.ClubWhereInput[] = []
    const search = filters.search?.trim()
    if (search) {
        and.push({
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { address: { contains: search, mode: "insensitive" } },
                {
                    manager: {
                        OR: [
                            { firstName: { contains: search, mode: "insensitive" } },
                            { lastName: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } },
                        ],
                    },
                },
            ],
        })
    }

    const where: Prisma.ClubWhereInput = and.length > 0 ? { AND: and } : {}

    try {
        const prisma = getPrisma()
        const [clubs, total] = await Promise.all([
            prisma.club.findMany({
                where,
                take: safeTake,
                skip: (safePage - 1) * safeTake,
                orderBy: clubListOrderBy(sort.sortBy, sort.sortDir),
                include: {
                    manager: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            members: { where: { role: "coach" } },
                        },
                    },
                },
            }),
            prisma.club.count({ where }),
        ])

        const totalPages = Math.max(1, Math.ceil(total / safeTake))

        return {
            ok: true,
            data: {
                currentPage: safePage,
                totalPages,
                clubs: clubs.map(({ _count, ...club }) => ({
                    ...club,
                    memberCount: _count.members,
                })),
            },
        }
    } catch (e) {
        console.error("[clubsListPaginated]", e)
        return { ok: false, error: "Error al listar clubes" }
    }
}

export async function clubsListForSelect(): Promise<ClubSelectOption[]> {
    return getPrisma().club.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    })
}

export async function clubAdminUpdate(
    data: ClubAdminUpdateInput,
): Promise<ClubMutationResult> {
    try {
        const prisma = getPrisma()
        const existing = await prisma.club.findUnique({ where: { id: data.id } })
        if (!existing) {
            return { ok: false, error: "Club no encontrado" }
        }

        const nextLogoUrl = data.logoUrl?.trim() ? data.logoUrl.trim() : null
        if (!nextLogoUrl && existing.logoUrl && isCloudinaryUrl(existing.logoUrl)) {
            await deleteCloudinaryImage("clubs", clubLogoPublicId(data.id))
        }

        const club = await prisma.club.update({
            where: { id: data.id },
            data: {
                name: data.name,
                address: data.address?.trim() ? data.address.trim() : null,
                logoUrl: nextLogoUrl,
                maxMembers: data.maxMembers,
            },
        })

        return { ok: true, data: club }
    } catch (e) {
        console.error("[clubAdminUpdate]", e)
        return { ok: false, error: "Error al actualizar el club" }
    }
}

export async function getUserClubContext(userId: string): Promise<UserClubContext> {
    const prisma = getPrisma()
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            clubId: true,
            club: { select: { id: true, name: true } },
            managedClub: { select: { id: true, name: true } },
        },
    })

    if (!user) return null

    if (user.role === "club_manager" && user.managedClub) {
        return { clubId: user.managedClub.id, clubName: user.managedClub.name }
    }

    if (user.clubId && user.club) {
        return { clubId: user.club.id, clubName: user.club.name }
    }

    return null
}

export async function clubUpdate(
    clubId: string,
    data: ClubUpdateInput,
): Promise<ClubMutationResult> {
    try {
        const prisma = getPrisma()
        const current = await prisma.club.findUnique({ where: { id: clubId } })
        if (!current) {
            return { ok: false, error: "Club no encontrado" }
        }

        const nextLogoUrl = data.logoUrl?.trim() ? data.logoUrl.trim() : null
        if (!nextLogoUrl && current.logoUrl && isCloudinaryUrl(current.logoUrl)) {
            await deleteCloudinaryImage("clubs", clubLogoPublicId(clubId))
        }

        const updated = await prisma.club.update({
            where: { id: clubId },
            data: {
                name: data.name.trim(),
                address: data.address?.trim() ? data.address.trim() : null,
                logoUrl: nextLogoUrl,
            },
        })
        return { ok: true, data: updated }
    } catch (e) {
        console.error("[clubUpdate]", e)
        return { ok: false, error: "Error al actualizar el club" }
    }
}

export async function clubSaveLogo(
    clubId: string,
    imageBase64: string,
    mime: string,
): Promise<ClubMutationResult> {
    try {
        const prisma = getPrisma()
        const current = await prisma.club.findUnique({ where: { id: clubId } })
        if (!current) {
            return { ok: false, error: "Club no encontrado" }
        }

        const buffer = Buffer.from(imageBase64, "base64")
        if (buffer.length === 0) {
            return { ok: false, error: "Imagen vacía" }
        }

        const url = await uploadImageBuffer(
            buffer,
            mime,
            "clubs",
            clubLogoPublicId(clubId),
        )

        const updated = await prisma.club.update({
            where: { id: clubId },
            data: { logoUrl: url },
        })

        return { ok: true, data: updated }
    } catch (e) {
        console.error("[clubSaveLogo]", e)
        const msg = e instanceof Error ? e.message : "Error al guardar el logo"
        return { ok: false, error: msg }
    }
}

async function assertMemberQuota(clubId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const prisma = getPrisma()
    const club = await prisma.club.findUnique({ where: { id: clubId } })
    if (!club) {
        return { ok: false, error: "Club no encontrado" }
    }

    const memberCount = await prisma.user.count({
        where: { clubId, role: "coach" },
    })

    if (memberCount >= club.maxMembers) {
        return {
            ok: false,
            error: `Cupo alcanzado (${club.maxMembers} coaches). Contactá al administrador para ampliarlo.`,
        }
    }

    return { ok: true }
}

export async function clubCreateMember(
    clubId: string,
    data: ClubMemberCreateInput,
): Promise<ClubMemberMutationResult> {
    const quota = await assertMemberQuota(clubId)
    if (!quota.ok) return quota

    try {
        const prisma = getPrisma()
        const existing = await prisma.user.findUnique({ where: { email: data.email } })
        if (existing) {
            return { ok: false, error: "Ya existe un usuario con ese email" }
        }

        const passwordHash = await bcryptjs.hash(data.password, 12)
        const user = await prisma.user.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phoneNumber: data.phoneNumber?.trim() ? data.phoneNumber.trim() : null,
                role: "coach",
                clubId,
                passwordHash,
                emailVerified: data.emailVerified ? new Date() : null,
            },
        })

        return { ok: true, data: toUserSafe(user) }
    } catch (e) {
        console.error("[clubCreateMember]", e)
        return { ok: false, error: "Error al crear el coach" }
    }
}

export async function clubGetMember(
    clubId: string,
    memberId: string,
): Promise<UserSafe | null> {
    const user = await getPrisma().user.findUnique({ where: { id: memberId } })
    if (!user || user.clubId !== clubId || user.role !== "coach") return null
    return toUserSafe(user)
}

export async function clubUpdateMember(
    clubId: string,
    data: ClubMemberUpdateInput,
): Promise<ClubMemberMutationResult> {
    try {
        const prisma = getPrisma()
        const member = await prisma.user.findUnique({ where: { id: data.id } })
        if (!member || member.clubId !== clubId || member.role !== "coach") {
            return { ok: false, error: "Coach no encontrado en tu club" }
        }

        if (data.email !== member.email) {
            const clash = await prisma.user.findUnique({ where: { email: data.email } })
            if (clash && clash.id !== data.id) {
                return { ok: false, error: "Ya existe un usuario con ese email" }
            }
        }

        const updateData: Prisma.UserUpdateInput = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber?.trim() ? data.phoneNumber.trim() : null,
            emailVerified: data.emailVerified
                ? member.emailVerified ?? new Date()
                : null,
        }

        if (data.password && data.password.length > 0) {
            updateData.passwordHash = await bcryptjs.hash(data.password, 12)
        }

        const user = await prisma.user.update({
            where: { id: data.id },
            data: updateData,
        })

        return { ok: true, data: toUserSafe(user) }
    } catch (e) {
        console.error("[clubUpdateMember]", e)
        return { ok: false, error: "Error al actualizar el coach" }
    }
}

function clubMemberListOrderBy(
    sortBy: ClubMemberListSortBy,
    sortDir: "asc" | "desc",
): Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[] {
    switch (sortBy) {
        case "firstName":
            return [{ firstName: sortDir }, { lastName: "asc" }]
        case "email":
            return { email: sortDir }
        case "phoneNumber":
            return { phoneNumber: sortDir }
        case "createdAt":
            return { createdAt: sortDir }
        case "updatedAt":
            return { updatedAt: sortDir }
        case "lastName":
        default:
            return [{ lastName: sortDir }, { firstName: "asc" }]
    }
}

export async function clubMembersListPaginated(
    clubId: string,
    page: number,
    take: number,
    filters: ClubMemberListFilters = {},
    sort: { sortBy: ClubMemberListSortBy; sortDir: "asc" | "desc" } = {
        sortBy: "lastName",
        sortDir: "asc",
    },
): Promise<ClubMembersPaginatedResult> {
    const safePage = Math.max(1, Math.min(10_000, Math.floor(page)))
    const safeTake = Math.min(100, Math.max(1, Math.floor(take)))

    const and: Prisma.UserWhereInput[] = [{ clubId, role: "coach" }]
    const search = filters.search?.trim()
    if (search) {
        and.push({
            OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phoneNumber: { contains: search, mode: "insensitive" } },
            ],
        })
    }

    const where: Prisma.UserWhereInput = { AND: and }

    try {
        const prisma = getPrisma()
        const club = await prisma.club.findUnique({ where: { id: clubId } })
        if (!club) {
            return { ok: false, error: "Club no encontrado" }
        }

        const [users, total, memberCount] = await Promise.all([
            prisma.user.findMany({
                where,
                take: safeTake,
                skip: (safePage - 1) * safeTake,
                orderBy: clubMemberListOrderBy(sort.sortBy, sort.sortDir),
            }),
            prisma.user.count({ where }),
            prisma.user.count({ where: { clubId, role: "coach" } }),
        ])

        const totalPages = Math.max(1, Math.ceil(total / safeTake))

        return {
            ok: true,
            data: {
                currentPage: safePage,
                totalPages,
                users: users.map(toUserSafe),
                memberCount,
                maxMembers: club.maxMembers,
            },
        }
    } catch (e) {
        console.error("[clubMembersListPaginated]", e)
        return { ok: false, error: "Error al listar coaches" }
    }
}

export async function clubDeleteMember(
    clubId: string,
    memberId: string,
): Promise<ClubMemberMutationResult> {
    try {
        const prisma = getPrisma()
        const member = await prisma.user.findUnique({ where: { id: memberId } })
        if (!member || member.clubId !== clubId || member.role !== "coach") {
            return { ok: false, error: "Coach no encontrado en tu club" }
        }

        await prisma.user.delete({ where: { id: memberId } })
        return { ok: true, data: toUserSafe(member) }
    } catch (e) {
        console.error("[clubDeleteMember]", e)
        return { ok: false, error: "Error al eliminar el coach" }
    }
}
