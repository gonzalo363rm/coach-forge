import { mkdir, writeFile } from "fs/promises"
import path from "path"

import type { Exercise, Prisma } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"
import type { ExerciseCreateInput, ExerciseUpdateInput } from "@/schemas/exercise.schema"

export async function exercisesList(): Promise<Exercise[]> {
    return getPrisma().exercise.findMany({
        orderBy: { updatedAt: "desc" },
    })
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

    const dir = path.join(process.cwd(), "public", "exercises")
    const filename = `exercise-${exerciseId}.png`
    const filePath = path.join(dir, filename)

    await mkdir(dir, { recursive: true })
    await writeFile(filePath, pngBytes)

    return { url: `/exercises/${filename}` }
}

export async function exerciseCreate(data: ExerciseCreateInput): Promise<Exercise> {
    return getPrisma().exercise.create({
        data: {
            sportId: data.sportId,
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
    if (patch.sportId !== undefined) data.sportId = patch.sportId
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
