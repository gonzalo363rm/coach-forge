import { mkdir, unlink, writeFile } from "fs/promises"
import path from "path"

import type { Exercise, Prisma } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"
import type {
    ExerciseCreateInput,
    ExerciseListFilters,
    ExerciseListSortBy,
    ExerciseUpdateInput,
} from "@/schemas/exercise.schema"

function buildExerciseWhereFilters(
    filters: ExerciseListFilters,
): Prisma.ExerciseWhereInput {
    const and: Prisma.ExerciseWhereInput[] = []

    if (filters.search) {
        and.push({ title: { contains: filters.search, mode: "insensitive" } })
    }
    if (filters.sport) {
        and.push({ sport: { slug: filters.sport } })
    }
    if (filters.difficulty !== undefined) {
        and.push({ difficulty: filters.difficulty })
    }
    if (filters.difficultyMin !== undefined || filters.difficultyMax !== undefined) {
        and.push({
            difficulty: {
                ...(filters.difficultyMin !== undefined ? { gte: filters.difficultyMin } : {}),
                ...(filters.difficultyMax !== undefined ? { lte: filters.difficultyMax } : {}),
            },
        })
    }
    if (filters.filterMinPlayers !== undefined) {
        and.push({
            OR: [{ maxPlayers: null }, { maxPlayers: { gte: filters.filterMinPlayers } }],
        })
    }
    if (filters.filterMaxPlayers !== undefined) {
        and.push({
            OR: [{ minPlayers: null }, { minPlayers: { lte: filters.filterMaxPlayers } }],
        })
    }

    if (and.length === 0) return {}
    if (and.length === 1) return and[0]!
    return { AND: and }
}

function exercisePreviewFilename(exerciseId: string): string {
    return `exercise-${exerciseId}.png`
}

export function exercisePreviewPublicUrl(exerciseId: string): string {
    return `/exercises/${exercisePreviewFilename(exerciseId)}`
}

function exercisePreviewDiskPath(exerciseId: string): string {
    return path.join(process.cwd(), "public", "exercises", exercisePreviewFilename(exerciseId))
}

export async function exercisesList(): Promise<Exercise[]> {
    return getPrisma().exercise.findMany({
        orderBy: { updatedAt: "desc" },
    })
}

export type ExerciseListItem = Exercise & { previewUrl: string }

export type ExercisesPaginatedData = {
    currentPage: number
    totalPages: number
    exercises: ExerciseListItem[]
}

export type ExercisesPaginatedResult =
    | { ok: true; data: ExercisesPaginatedData }
    | { ok: false; error: string }

function exerciseListOrderBy(
    sortBy: ExerciseListSortBy,
    sortDir: "asc" | "desc",
): Prisma.ExerciseOrderByWithRelationInput {
    switch (sortBy) {
        case "sport":
            return { sport: { name: sortDir } }
        case "title":
            return { title: sortDir }
        case "difficulty":
            return { difficulty: sortDir }
        case "updatedAt":
        default:
            return { updatedAt: sortDir }
    }
}

export async function exercisesListPaginated(
    page: number,
    take: number,
    filters: ExerciseListFilters = {},
    sort: { sortBy: ExerciseListSortBy; sortDir: "asc" | "desc" },
): Promise<ExercisesPaginatedResult> {
    const safePage = Math.max(1, Math.min(10_000, Math.floor(page)))
    const safeTake = Math.min(100, Math.max(1, Math.floor(take)))

    const where = buildExerciseWhereFilters(filters)

    try {
        const [exercises, total] = await Promise.all([
            getPrisma().exercise.findMany({
                take: safeTake,
                skip: (safePage - 1) * safeTake,
                orderBy: exerciseListOrderBy(sort.sortBy, sort.sortDir),
                where,
            }),
            getPrisma().exercise.count({ where }),
        ])

        const totalPages = Math.max(1, Math.ceil(total / safeTake))

        const exercisesWithPreview: ExerciseListItem[] = exercises.map((e) => ({
            ...e,
            previewUrl: exercisePreviewPublicUrl(e.id),
        }))

        return {
            ok: true,
            data: {
                currentPage: safePage,
                totalPages,
                exercises: exercisesWithPreview,
            },
        }
    } catch (e) {
        console.error("[exercisesListPaginated]", e)
        return { ok: false, error: "Error al obtener la lista de ejercicios" }
    }
}

export type ExerciseMutationResult =
    | { ok: true; data: Exercise }
    | { ok: false; error: string }

export async function exerciseDelete(id: string): Promise<ExerciseMutationResult> {
    try {
        const deleted = await getPrisma().exercise.delete({ where: { id } })
        await unlink(exercisePreviewDiskPath(id)).catch(() => {
            /* archivo opcional */
        })
        return { ok: true, data: deleted }
    } catch (e) {
        const code =
            e && typeof e === "object" && "code" in e ? (e as { code?: string }).code : undefined
        if (code === "P2025") {
            return { ok: false, error: "Ejercicio no encontrado" }
        }
        console.error("[exerciseDelete]", e)
        return { ok: false, error: "Error al eliminar el ejercicio" }
    }
}

export async function exerciseGetById(id: string): Promise<Exercise | null> {
    return getPrisma().exercise.findUnique({ where: { id } })
}

const MAX_PREVIEW_BYTES = 12 * 1024 * 1024

function isPngBuffer(buf: Buffer): boolean {
    return (
        buf.length >= 8 &&
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a
    )
}

/** Escribe `public/exercises/exercise-{id}.png` tras comprobar que el ejercicio existe. */
export async function exerciseSavePreviewPng(
    exerciseId: string,
    pngBytes: Buffer,
): Promise<{ url: string }> {
    if (pngBytes.length === 0) {
        throw new Error("PNG vacío")
    }
    if (pngBytes.length > MAX_PREVIEW_BYTES) {
        throw new Error("La imagen supera el tamaño máximo permitido")
    }
    if (!isPngBuffer(pngBytes)) {
        throw new Error("Se esperaba un PNG")
    }

    const exercise = await exerciseGetById(exerciseId)
    if (!exercise) {
        throw new Error("Ejercicio no encontrado")
    }

    const filePath = exercisePreviewDiskPath(exerciseId)
    const dir = path.dirname(filePath)

    await mkdir(dir, { recursive: true })
    await writeFile(filePath, pngBytes)

    return { url: exercisePreviewPublicUrl(exerciseId) }
}

export async function exerciseCreate(data: ExerciseCreateInput): Promise<Exercise> {
    return getPrisma().exercise.create({
        data: {
            ...(data.sportId
                ? { sport: { connect: { id: data.sportId } } }
                : {}),
            title: data.title,
            minPlayers: data.minPlayers,
            maxPlayers: data.maxPlayers,
            difficulty: data.difficulty,
            videoLink: data.videoLink,
            canvas: data.canvas as unknown as Prisma.InputJsonValue,
        },
    })
}

export async function exerciseUpdate(
    id: string,
    patch: ExerciseUpdateInput,
): Promise<Exercise> {
    const data: Prisma.ExerciseUpdateInput = {}
    if (patch.sportId !== undefined) {
        data.sport = patch.sportId
            ? { connect: { id: patch.sportId } }
            : { disconnect: true }
    }
    if (patch.title !== undefined) data.title = patch.title
    if (patch.minPlayers !== undefined) data.minPlayers = patch.minPlayers
    if (patch.maxPlayers !== undefined) data.maxPlayers = patch.maxPlayers
    if (patch.difficulty !== undefined) data.difficulty = patch.difficulty
    if (patch.videoLink !== undefined) data.videoLink = patch.videoLink
    if (patch.canvas !== undefined) {
        data.canvas = patch.canvas as unknown as Prisma.InputJsonValue
    }

    return getPrisma().exercise.update({
        where: { id },
        data,
    })
}
