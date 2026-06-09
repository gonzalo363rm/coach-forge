import type { Prisma, TrainingClass } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"
import {
    computeExerciseCount,
    computeTotalMinutes,
} from "@/schemas/training-class.schema"
import type {
    TrainingClassCreateInput,
    TrainingClassListFilters,
    TrainingClassListSortBy,
    TrainingClassUpdateInput,
} from "@/schemas/training-class.schema"

export type TrainingClassWithItems = TrainingClass & {
    sport?: { name: string; slug: string } | null
    items: {
        id: string
        exerciseId: string
        sortOrder: number
        durationMinutes: number | null
        isOptional: boolean
        exercise: {
            id: string
            title: string
            difficulty: number
            sportId: string | null
        }
    }[]
}

export type TrainingClassListItem = TrainingClass & {
    sport: { name: string; slug: string } | null
    exerciseCount: number
    totalMinutes: number
}

export type TrainingClassesPaginatedData = {
    currentPage: number
    totalPages: number
    classes: TrainingClassListItem[]
}

export type TrainingClassesPaginatedResult =
    | { ok: true; data: TrainingClassesPaginatedData }
    | { ok: false; error: string }

export type TrainingClassMutationResult =
    | { ok: true; data: TrainingClassWithItems }
    | { ok: false; error: string }

function buildTrainingClassWhereFilters(
    filters: TrainingClassListFilters,
): Prisma.TrainingClassWhereInput {
    const and: Prisma.TrainingClassWhereInput[] = []

    if (filters.search) {
        and.push({ title: { contains: filters.search, mode: "insensitive" } })
    }
    if (filters.sport) {
        and.push({ sport: { slug: filters.sport } })
    }
    if (filters.difficulty != null) {
        and.push({ difficulty: filters.difficulty })
    }
    if (filters.isPublic != null) {
        and.push({ isPublic: filters.isPublic })
    }

    if (and.length === 0) return {}
    if (and.length === 1) return and[0]!
    return { AND: and }
}

function trainingClassListOrderBy(
    sortBy: TrainingClassListSortBy,
    sortDir: "asc" | "desc",
): Prisma.TrainingClassOrderByWithRelationInput {
    switch (sortBy) {
        case "title":
            return { title: sortDir }
        case "description":
            return { description: sortDir }
        case "sport":
            return { sport: { name: sortDir } }
        case "difficulty":
            return { difficulty: sortDir }
        case "exerciseCount":
            return { items: { _count: sortDir } }
        case "isPublic":
            return { isPublic: sortDir }
        case "createdAt":
            return { createdAt: sortDir }
        case "totalMinutes":
        case "updatedAt":
        default:
            return { updatedAt: sortDir }
    }
}

const trainingClassListInclude = {
    sport: { select: { name: true, slug: true } },
    items: {
        select: {
            durationMinutes: true,
            isOptional: true,
        },
    },
} satisfies Prisma.TrainingClassInclude

function mapRowToListItem(
    row: Prisma.TrainingClassGetPayload<{ include: typeof trainingClassListInclude }>,
): TrainingClassListItem {
    const { items, sport, ...rest } = row
    return {
        ...rest,
        sport,
        exerciseCount: computeExerciseCount(items),
        totalMinutes: computeTotalMinutes(items),
    }
}

const trainingClassItemsInclude = {
    sport: { select: { name: true, slug: true } },
    items: {
        orderBy: { sortOrder: "asc" as const },
        include: {
            exercise: {
                select: {
                    id: true,
                    title: true,
                    difficulty: true,
                    sportId: true,
                },
            },
        },
    },
} satisfies Prisma.TrainingClassInclude

export async function trainingClassesListPaginated(
    page: number,
    take: number,
    filters: TrainingClassListFilters = {},
    sort: { sortBy: TrainingClassListSortBy; sortDir: "asc" | "desc" },
): Promise<TrainingClassesPaginatedResult> {
    const safePage = Math.max(1, Math.min(10_000, Math.floor(page)))
    const safeTake = Math.min(100, Math.max(1, Math.floor(take)))
    const where = buildTrainingClassWhereFilters(filters)

    try {
        const skip = (safePage - 1) * safeTake

        let rows: Prisma.TrainingClassGetPayload<{
            include: typeof trainingClassListInclude
        }>[]
        let total: number

        if (sort.sortBy === "totalMinutes") {
            const all = await getPrisma().trainingClass.findMany({
                where,
                include: trainingClassListInclude,
            })
            total = all.length
            const sorted = [...all].sort((a, b) => {
                const diff =
                    computeTotalMinutes(a.items) - computeTotalMinutes(b.items)
                return sort.sortDir === "asc" ? diff : -diff
            })
            rows = sorted.slice(skip, skip + safeTake)
        } else {
            ;[rows, total] = await Promise.all([
                getPrisma().trainingClass.findMany({
                    take: safeTake,
                    skip,
                    orderBy: trainingClassListOrderBy(sort.sortBy, sort.sortDir),
                    where,
                    include: trainingClassListInclude,
                }),
                getPrisma().trainingClass.count({ where }),
            ])
        }

        const totalPages = Math.max(1, Math.ceil(total / safeTake))

        const classes: TrainingClassListItem[] = rows.map(mapRowToListItem)

        return {
            ok: true,
            data: {
                currentPage: safePage,
                totalPages,
                classes,
            },
        }
    } catch (e) {
        console.error("[trainingClassesListPaginated]", e)
        return { ok: false, error: "Error al obtener la lista de clases" }
    }
}

export async function trainingClassCreate(
    data: TrainingClassCreateInput,
    creatorId?: string | null,
): Promise<TrainingClassWithItems> {
    return getPrisma().trainingClass.create({
        data: {
            title: data.title,
            description: data.description ?? null,
            difficulty: data.difficulty,
            isPublic: data.isPublic,
            ...(creatorId ? { creator: { connect: { id: creatorId } } } : {}),
            ...(data.sportId ? { sport: { connect: { id: data.sportId } } } : {}),
            items: {
                create: data.items.map((item) => ({
                    exerciseId: item.exerciseId,
                    sortOrder: item.sortOrder,
                    durationMinutes: item.isOptional ? null : (item.durationMinutes ?? null),
                    isOptional: item.isOptional,
                })),
            },
        },
        include: trainingClassItemsInclude,
    })
}

export async function trainingClassGetById(
    id: string,
): Promise<TrainingClassWithItems | null> {
    return getPrisma().trainingClass.findUnique({
        where: { id },
        include: trainingClassItemsInclude,
    })
}

export async function trainingClassUpdate(
    data: TrainingClassUpdateInput,
): Promise<TrainingClassMutationResult> {
    try {
        const updated = await getPrisma().$transaction(async (tx) => {
            await tx.trainingClassExercise.deleteMany({
                where: { trainingClassId: data.id },
            })
            return tx.trainingClass.update({
                where: { id: data.id },
                data: {
                    title: data.title,
                    description: data.description ?? null,
                    difficulty: data.difficulty,
                    isPublic: data.isPublic,
                    sport: data.sportId
                        ? { connect: { id: data.sportId } }
                        : { disconnect: true },
                    items: {
                        create: data.items.map((item) => ({
                            exerciseId: item.exerciseId,
                            sortOrder: item.sortOrder,
                            durationMinutes: item.isOptional
                                ? null
                                : (item.durationMinutes ?? null),
                            isOptional: item.isOptional,
                        })),
                    },
                },
                include: trainingClassItemsInclude,
            })
        })
        return { ok: true, data: updated }
    } catch (e) {
        console.error("[trainingClassUpdate]", e)
        return { ok: false, error: "Error al actualizar la clase" }
    }
}

export async function trainingClassDelete(
    id: string,
): Promise<TrainingClassMutationResult> {
    try {
        const deleted = await getPrisma().trainingClass.delete({
            where: { id },
            include: trainingClassItemsInclude,
        })
        return { ok: true, data: deleted }
    } catch (e) {
        console.error("[trainingClassDelete]", e)
        return { ok: false, error: "Error al eliminar la clase" }
    }
}
