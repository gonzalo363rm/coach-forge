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
