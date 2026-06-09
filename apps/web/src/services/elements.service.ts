import type { Element, Prisma } from "@prisma/client"

import type { ElementDefinition } from "@/interfaces"
import { getPrisma } from "@/lib/prisma"
import {
  elementCloudinaryUrl,
  elementImagePublicId,
  isCloudinaryUrl,
} from "@/lib/cloudinary-url"
import type {
  ElementCreateInput,
  ElementListSortBy,
  ElementUpdateInput,
} from "@/schemas/element.schema"
import {
  deleteCloudinaryImage,
  uploadImageBuffer,
} from "@/services/cloudinary.service"

import { MAX_IMAGE_FILE_BYTES } from "@/utils/element-image-file"

const MAX_IMAGE_BYTES = MAX_IMAGE_FILE_BYTES

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

export type ElementMutationResult =
  | { ok: true; data: Element }
  | { ok: false; error: string }

export type ElementListItem = Element & {
  sportSlug: string | null
}

export type ElementsPaginatedData = {
  currentPage: number
  totalPages: number
  elements: ElementListItem[]
}

export type ElementsPaginatedResult =
  | { ok: true; data: ElementsPaginatedData }
  | { ok: false; error: string }

export function elementImagePublicUrl(elementId: string, ext?: string): string {
  return (
    elementCloudinaryUrl(elementId, ext) ??
    `/elements/element-${elementId}${ext ? `.${ext}` : ""}`
  )
}

export function elementToDefinition(row: Element & { sport?: { slug: string } | null }): ElementDefinition {
  return {
    id: row.id,
    type: "image",
    name: row.name,
    image: row.image,
    width: row.width,
    height: row.height,
    sportId: row.sportId,
    sportSlug: row.sport?.slug ?? null,
  }
}

async function saveElementImageFile(
  elementId: string,
  mime: string,
  bytes: Buffer,
): Promise<string> {
  const ext = MIME_EXT[mime]
  if (!ext) {
    throw new Error("Tipo de imagen no soportado")
  }
  if (bytes.length === 0) {
    throw new Error("Imagen vacía")
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new Error("La imagen supera el tamaño máximo permitido")
  }

  return uploadImageBuffer(bytes, mime, "elements", elementImagePublicId(elementId))
}

async function removeElementImageFiles(elementId: string): Promise<void> {
  await deleteCloudinaryImage("elements", elementImagePublicId(elementId))
}

export async function elementIsUsedInExercises(elementId: string): Promise<boolean> {
  const rows = await getPrisma().$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
            SELECT 1
            FROM "Exercise" e
            WHERE EXISTS (
                SELECT 1
                FROM jsonb_array_elements(e.canvas->'images') AS img
                WHERE img->>'definitionId' = ${elementId}
            )
        ) AS "exists"
    `
  return Boolean(rows[0]?.exists)
}

function elementListOrderBy(
  sortBy: ElementListSortBy,
  sortDir: "asc" | "desc",
): Prisma.ElementOrderByWithRelationInput {
  switch (sortBy) {
    case "sport":
      return { sport: { name: sortDir } }
    case "width":
      return { width: sortDir }
    case "height":
      return { height: sortDir }
    case "name":
      return { name: sortDir }
    case "updatedAt":
    default:
      return { updatedAt: sortDir }
  }
}

export async function elementsListAll(): Promise<ElementDefinition[]> {
  const rows = await getPrisma().element.findMany({
    where: { type: "image" },
    include: { sport: { select: { slug: true } } },
    orderBy: { name: "asc" },
  })
  return rows.map(elementToDefinition)
}

export async function elementsListPaginated(
  page: number,
  take: number,
  filters: { search?: string; sport?: string },
  sort: { sortBy: ElementListSortBy; sortDir: "asc" | "desc" },
): Promise<ElementsPaginatedResult> {
  const safePage = Math.max(1, Math.min(10_000, Math.floor(page)))
  const safeTake = Math.min(100, Math.max(1, Math.floor(take)))

  const where: Prisma.ElementWhereInput = {
    type: "image",
    ...(filters.search
      ? { name: { contains: filters.search, mode: "insensitive" } }
      : {}),
    ...(filters.sport ? { sport: { slug: filters.sport } } : {}),
  }

  try {
    const [elements, total] = await Promise.all([
      getPrisma().element.findMany({
        take: safeTake,
        skip: (safePage - 1) * safeTake,
        orderBy: elementListOrderBy(sort.sortBy, sort.sortDir),
        where,
        include: { sport: { select: { slug: true } } },
      }),
      getPrisma().element.count({ where }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / safeTake))

    return {
      ok: true,
      data: {
        currentPage: safePage,
        totalPages,
        elements: elements.map((e) => ({
          ...e,
          sportSlug: e.sport?.slug ?? null,
        })),
      },
    }
  } catch (e) {
    console.error("[elementsListPaginated]", e)
    return { ok: false, error: "Error al obtener la lista de elementos" }
  }
}

export async function elementGetById(id: string): Promise<Element | null> {
  return getPrisma().element.findUnique({ where: { id } })
}

export async function elementCreate(input: ElementCreateInput): Promise<ElementMutationResult> {
  try {
    const existing = await getPrisma().element.findUnique({ where: { id: input.id } })
    if (existing) {
      return { ok: false, error: "Ya existe un elemento con ese identificador" }
    }

    let imageUrl: string
    try {
      const buf = Buffer.from(input.imageBase64, "base64")
      imageUrl = await saveElementImageFile(input.id, input.imageMime, buf)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar la imagen"
      return { ok: false, error: msg }
    }

    const element = await getPrisma().element.create({
      data: {
        id: input.id,
        type: "image",
        name: input.name,
        image: imageUrl,
        width: input.width,
        height: input.height,
        ...(input.sportId ? { sport: { connect: { id: input.sportId } } } : {}),
      },
    })

    return { ok: true, data: element }
  } catch (e) {
    console.error("[elementCreate]", e)
    await removeElementImageFiles(input.id)
    return { ok: false, error: "Error al crear el elemento" }
  }
}

export async function elementUpdate(input: ElementUpdateInput): Promise<ElementMutationResult> {
  const { id, sportId, name, width, height, imageBase64, imageMime } = input

  try {
    const current = await getPrisma().element.findUnique({ where: { id } })
    if (!current) {
      return { ok: false, error: "Elemento no encontrado" }
    }

    const data: Prisma.ElementUpdateInput = {}
    if (sportId !== undefined) {
      data.sport = sportId ? { connect: { id: sportId } } : { disconnect: true }
    }
    if (name !== undefined) data.name = name
    if (width !== undefined) data.width = width
    if (height !== undefined) data.height = height

    if (imageBase64 !== undefined && imageMime !== undefined) {
      try {
        const buf = Buffer.from(imageBase64, "base64")
        data.image = await saveElementImageFile(id, imageMime, buf)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al guardar la imagen"
        return { ok: false, error: msg }
      }
    }

    const element = await getPrisma().element.update({ where: { id }, data })
    return { ok: true, data: element }
  } catch (e) {
    console.error("[elementUpdate]", e)
    return { ok: false, error: "Error al actualizar el elemento" }
  }
}

export async function elementDelete(id: string): Promise<ElementMutationResult> {
  try {
    const inUse = await elementIsUsedInExercises(id)
    if (inUse) {
      return {
        ok: false,
        error: "No se puede eliminar: el elemento se usa en uno o más ejercicios",
      }
    }

    const deleted = await getPrisma().element.delete({ where: { id } })
    if (isCloudinaryUrl(deleted.image) || deleted.image.startsWith("/elements/")) {
      await removeElementImageFiles(id)
    }
    return { ok: true, data: deleted }
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e ? (e as { code?: string }).code : undefined
    if (code === "P2025") {
      return { ok: false, error: "Elemento no encontrado" }
    }
    console.error("[elementDelete]", e)
    return { ok: false, error: "Error al eliminar el elemento" }
  }
}
