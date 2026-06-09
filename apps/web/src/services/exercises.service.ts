import { Prisma, type Exercise } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"
import { exercisePreviewPublicId } from "@/lib/cloudinary-url"
import { resolveExercisePreviewUrl } from "@/lib/exercise-preview-resolve"
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

export { resolveExercisePreviewUrl } from "@/lib/exercise-preview-resolve"

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

        const exercisesWithPreview: ExerciseListItem[] = await Promise.all(
            exercises.map(async (e) => ({
                ...e,
                previewUrl: await resolveExercisePreviewUrl(e.id),
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

  return { url }
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
