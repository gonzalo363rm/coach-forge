import type { TrainingClass } from "@prisma/client"

import { getPrisma } from "@/lib/prisma"
import type { TrainingClassCreateInput } from "@/schemas/training-class.schema"

export type TrainingClassWithItems = TrainingClass & {
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

export async function trainingClassCreate(
    data: TrainingClassCreateInput,
): Promise<TrainingClassWithItems> {
    return getPrisma().trainingClass.create({
        data: {
            title: data.title,
            difficulty: data.difficulty,
            isPublic: data.isPublic,
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
        include: {
            items: {
                orderBy: { sortOrder: "asc" },
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
        },
    })
}

export async function trainingClassGetById(
    id: string,
): Promise<TrainingClassWithItems | null> {
    return getPrisma().trainingClass.findUnique({
        where: { id },
        include: {
            items: {
                orderBy: { sortOrder: "asc" },
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
        },
    })
}
