import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { Prisma, type Exercise } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"
import { exercisePreviewPublicId } from "@/lib/cloudinary-url"
import {
  EXERCISE_PREVIEW_PLACEHOLDER,
  removeLocalExercisePreview,
  resolveExercisePreviewUrl,
} from "@/lib/exercise-preview-resolve"
import type {
  ExerciseCreateInput,
  ExerciseListFilters,
  ExerciseListSortBy,
  ExerciseUpdateInput,
} from "@/schemas/exercise.schema"
import {
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "@/services/cloudinary.service"
import { exercisePreviewFilename } from "@/utils/exercise-preview-url"

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
    if (filters.visibility != null) {
        and.push({ visibility: filters.visibility })
    }
    if (filters.creatorId) {
        and.push({ creatorId: filters.creatorId })
    }

    if (and.length === 0) return {}
    if (and.length === 1) return and[0]!
    return { AND: and }
}

export { resolveExercisePreviewUrl } from "@/lib/exercise-preview-resolve"

export async function exercisesList(): Promise<Exercise[]> {
    return getPrisma().exercise.findMany({
        orderBy: { updatedAt: "desc" },
    })
}

export type ExerciseListItem = Exercise & {
    previewUrl: string
    creator: { id: string; firstName: string; lastName: string } | null
}

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
        case "visibility":
            return { visibility: sortDir }
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
                include: {
                    creator: { select: { id: true, firstName: true, lastName: true } },
                },
            }),
            getPrisma().exercise.count({ where }),
        ])

        const totalPages = Math.max(1, Math.ceil(total / safeTake))

        const exercisesWithPreview: ExerciseListItem[] = await Promise.all(
            exercises.map(async ({ creator, ...e }) => ({
                ...e,
                creator,
                previewUrl: await resolveExercisePreviewUrl(e.id, e.updatedAt),
            })),
        )

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

const MAX_LISTED_CLASSES = 8

async function exerciseClassTitlesUsingIt(exerciseId: string): Promise<string[]> {
  const rows = await getPrisma().trainingClassExercise.findMany({
    where: { exerciseId },
    select: { trainingClass: { select: { title: true } } },
  })

  return rows
    .map((row) => row.trainingClass.title)
    .sort((a, b) => a.localeCompare(b, "es"))
}

function formatExerciseInUseMessage(classTitles: string[]): string {
  if (classTitles.length === 0) {
    return "No se puede eliminar: está asignado a una o más clases"
  }

  if (classTitles.length <= MAX_LISTED_CLASSES) {
    return `No se puede eliminar: está asignado a las clases: ${classTitles.join(", ")}`
  }

  const shown = classTitles.slice(0, MAX_LISTED_CLASSES).join(", ")
  const rest = classTitles.length - MAX_LISTED_CLASSES

  return `No se puede eliminar: está asignado a las clases: ${shown} y ${rest} más`
}

export async function exerciseDelete(id: string): Promise<ExerciseMutationResult> {
  try {
    const classTitles = await exerciseClassTitlesUsingIt(id)
    if (classTitles.length > 0) {
      return { ok: false, error: formatExerciseInUseMessage(classTitles) }
    }

    const deleted = await getPrisma().exercise.delete({ where: { id } })
    await deleteCloudinaryImage("exercises", exercisePreviewPublicId(id))
    return { ok: true, data: deleted }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return { ok: false, error: "Ejercicio no encontrado" }
      }
      if (e.code === "P2003") {
        return {
          ok: false,
          error: formatExerciseInUseMessage(await exerciseClassTitlesUsingIt(id)),
        }
      }
    }
    console.error("[exerciseDelete]", e)
    return { ok: false, error: "Error al eliminar el ejercicio" }
  }
}

export async function exerciseGetById(id: string): Promise<Exercise | null> {
    return getPrisma().exercise.findUnique({ where: { id } })
}

export async function exerciseGetListItemById(id: string): Promise<ExerciseListItem | null> {
    const row = await getPrisma().exercise.findUnique({
        where: { id },
        include: {
            creator: { select: { id: true, firstName: true, lastName: true } },
        },
    })
    if (!row) return null

    const { creator, ...exercise } = row
    return {
        ...exercise,
        creator,
        previewUrl: await resolveExercisePreviewUrl(exercise.id, exercise.updatedAt),
    }
}

const MAX_PREVIEW_BYTES = 12 * 1024 * 1024

function isWebpBuffer(buf: Buffer): boolean {
    return (
        buf.length >= 12 &&
        buf[0] === 0x52 &&
        buf[1] === 0x49 &&
        buf[2] === 0x46 &&
        buf[3] === 0x46 &&
        buf[8] === 0x57 &&
        buf[9] === 0x45 &&
        buf[10] === 0x42 &&
        buf[11] === 0x50
    )
}

/** Sube la vista previa WebP del ejercicio a Cloudinary. */
export async function exerciseSavePreview(
  exerciseId: string,
  webpBytes: Buffer,
): Promise<{ url: string }> {
  if (webpBytes.length === 0) {
    throw new Error("WebP vacío")
  }
  if (webpBytes.length > MAX_PREVIEW_BYTES) {
    throw new Error("La imagen supera el tamaño máximo permitido")
  }
  if (!isWebpBuffer(webpBytes)) {
    throw new Error("Se esperaba un WebP")
  }

  const exercise = await exerciseGetById(exerciseId)
  if (!exercise) {
    throw new Error("Ejercicio no encontrado")
  }

  const url = await uploadImageBuffer(
    webpBytes,
    "image/webp",
    "exercises",
    exercisePreviewPublicId(exerciseId),
  )

  // Evitar que un .webp local legacy opaque la nueva URL de Cloudinary.
  removeLocalExercisePreview(exerciseId)

  // Invalidar caches de listados (?v=updatedAt) al regenerar la preview.
  await getPrisma().exercise.update({
    where: { id: exerciseId },
    data: { updatedAt: new Date() },
  })

  return { url }
}

export async function exerciseCreate(
    data: ExerciseCreateInput,
    creatorId?: string | null,
): Promise<Exercise> {
    return getPrisma().exercise.create({
        data: {
            ...(data.sportId
                ? { sport: { connect: { id: data.sportId } } }
                : {}),
            ...(creatorId ? { creator: { connect: { id: creatorId } } } : {}),
            title: data.title,
            minPlayers: data.minPlayers,
            maxPlayers: data.maxPlayers,
            difficulty: data.difficulty,
            visibility: data.visibility,
            videoLink: data.videoLink,
            canvas: data.canvas as unknown as Prisma.InputJsonValue,
        },
    })
}

/** Copia la preview del ejercicio origen al destino (Cloudinary). Fallos no propagan. */
async function copyExercisePreview(sourceId: string, targetId: string): Promise<void> {
    const url = await resolveExercisePreviewUrl(sourceId)
    if (url === EXERCISE_PREVIEW_PLACEHOLDER) return

    let buf: Buffer
    try {
        if (url.startsWith("/exercises/")) {
            const abs = join(process.cwd(), "public", "exercises", exercisePreviewFilename(sourceId))
            if (!existsSync(abs)) return
            buf = await readFile(abs)
        } else {
            const res = await fetch(url)
            if (!res.ok) return
            buf = Buffer.from(await res.arrayBuffer())
        }
        await exerciseSavePreview(targetId, buf)
    } catch (e) {
        console.error("[copyExercisePreview]", sourceId, "→", targetId, e)
    }
}

/**
 * Clona un ejercicio para un usuario: mismo canvas/metadatos, siempre privado,
 * con preview re-subida bajo el nuevo id cuando exista.
 */
export async function exerciseCloneForUser(
    sourceId: string,
    creatorId: string,
): Promise<Exercise> {
    const source = await exerciseGetById(sourceId)
    if (!source) {
        throw new Error("Ejercicio no encontrado")
    }

    const created = await getPrisma().exercise.create({
        data: {
            ...(source.sportId
                ? { sport: { connect: { id: source.sportId } } }
                : {}),
            creator: { connect: { id: creatorId } },
            title: source.title,
            minPlayers: source.minPlayers,
            maxPlayers: source.maxPlayers,
            difficulty: source.difficulty,
            visibility: "private",
            videoLink: source.videoLink,
            canvas: source.canvas as Prisma.InputJsonValue,
        },
    })

    await copyExercisePreview(sourceId, created.id)
    return created
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
    if (patch.visibility !== undefined) data.visibility = patch.visibility
    if (patch.videoLink !== undefined) data.videoLink = patch.videoLink
    if (patch.canvas !== undefined) {
        data.canvas = patch.canvas as unknown as Prisma.InputJsonValue
    }

    return getPrisma().exercise.update({
        where: { id },
        data,
    })
}
