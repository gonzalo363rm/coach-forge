import type { Prisma, Sport } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"
import type {
    SportCreateInput,
    SportListSortBy,
    SportUpdateInput,
} from "@/schemas/sport.schema"

export type SportMutationResult =
    | { ok: true; data: Sport }
    | { ok: false; error: string }

export async function sportsListAll(): Promise<Sport[]> {
    return getPrisma().sport.findMany({
        orderBy: { name: "asc" },
    })
}

export async function sportsGetById(id: string): Promise<Sport | null> {
    return getPrisma().sport.findUnique({ where: { id } })
}

export type SportsPaginatedData = {
    currentPage: number
    totalPages: number
    sports: Sport[]
}

export type SportsPaginatedResult =
    | { ok: true; data: SportsPaginatedData }
    | { ok: false; error: string }

function sportListOrderBy(
    sortBy: SportListSortBy,
    sortDir: "asc" | "desc",
): Prisma.SportOrderByWithRelationInput {
    switch (sortBy) {
        case "createdAt":
            return { createdAt: sortDir }
        case "name":
        default:
            return { name: sortDir }
    }
}

export async function sportsListPaginated(
    page: number,
    take: number,
    filters: { search?: string },
    sort: { sortBy: SportListSortBy; sortDir: "asc" | "desc" },
): Promise<SportsPaginatedResult> {
    const safePage = Math.max(1, Math.min(10_000, Math.floor(page)))
    const safeTake = Math.min(100, Math.max(1, Math.floor(take)))

    const where: Prisma.SportWhereInput = filters.search
        ? {
              OR: [
                  { name: { contains: filters.search, mode: "insensitive" } },
                  { slug: { contains: filters.search, mode: "insensitive" } },
              ],
          }
        : {}

    try {
        const [sports, totalSports] = await Promise.all([
            getPrisma().sport.findMany({
                take: safeTake,
                skip: (safePage - 1) * safeTake,
                orderBy: sportListOrderBy(sort.sortBy, sort.sortDir),
                where,
            }),
            getPrisma().sport.count({ where }),
        ])

        const totalPages = Math.max(1, Math.ceil(totalSports / safeTake))

        return {
            ok: true,
            data: {
                currentPage: safePage,
                totalPages,
                sports,
            },
        }
    } catch (e) {
        console.error("[sportsListPaginated]", e)
        return { ok: false, error: "Error al obtener la lista paginada de deportes" }
    }
}

export async function sportsCreate(input: SportCreateInput): Promise<SportMutationResult> {
    try {
        const existing = await getPrisma().sport.findFirst({
            where: { slug: input.slug },
        })
        if (existing) {
            return { ok: false, error: "Ya existe un deporte con ese slug" }
        }

        const sport = await getPrisma().sport.create({
            data: { name: input.name, slug: input.slug },
        })
        return { ok: true, data: sport }
    } catch (e) {
        console.error("[sportsCreate]", e)
        return { ok: false, error: "Error al crear el deporte" }
    }
}

export async function sportsUpdate(input: SportUpdateInput): Promise<SportMutationResult> {
    const { id, name, slug: slugInput } = input

    try {
        const current = await getPrisma().sport.findUnique({ where: { id } })
        if (!current) {
            return { ok: false, error: "Deporte no encontrado" }
        }

        const nextSlug =
            slugInput !== undefined && slugInput.length > 0 ? slugInput : current.slug

        if (nextSlug !== current.slug) {
            const clash = await getPrisma().sport.findFirst({
                where: { slug: nextSlug, NOT: { id } },
            })
            if (clash) {
                return { ok: false, error: "Ya existe un deporte con ese slug" }
            }
        }

        const sport = await getPrisma().sport.update({
            where: { id },
            data: { name, slug: nextSlug },
        })
        return { ok: true, data: sport }
    } catch (e) {
        console.error("[sportsUpdate]", e)
        return { ok: false, error: "Error al actualizar el deporte" }
    }
}

export async function sportsDelete(id: string): Promise<SportMutationResult> {
    try {
        const sport = await getPrisma().sport.delete({ where: { id } })
        return { ok: true, data: sport }
    } catch (e) {
        const code =
            e && typeof e === "object" && "code" in e ? (e as { code?: string }).code : undefined
        if (code === "P2025") {
            return { ok: false, error: "Deporte no encontrado" }
        }
        if (code === "P2003") {
            return {
                ok: false,
                error: "No se puede eliminar: hay ejercicios u otros registros asociados",
            }
        }
        console.error("[sportsDelete]", e)
        return { ok: false, error: "Error al eliminar el deporte" }
    }
}
