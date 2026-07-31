import { unstable_cache } from "next/cache"

import { getPrisma } from "@/lib/prisma"
import { resolveExercisePreviewUrl } from "@/lib/exercise-preview-resolve"

export const HOME_CATALOG_CACHE_TAG = "home-public-catalog"
export const HOME_CLUB_CATALOG_CACHE_TAG = "home-club-catalog"

const HOME_EXERCISES_LIMIT = 80
const HOME_CLASSES_LIMIT = 24

export type PublicHomeExercise = {
    id: string
    title: string
    difficulty: number
    previewUrl: string
    updatedAt: string
}

export type PublicExerciseSportSection = {
    sportId: string | null
    sportName: string
    sportSlug: string | null
    exercises: PublicHomeExercise[]
}

export type PublicHomeClassExercise = {
    id: string
    title: string
    previewUrl: string
    sortOrder: number
}

export type PublicHomeClass = {
    id: string
    title: string
    description: string | null
    difficulty: number
    sportName: string | null
    sportSlug: string | null
    createdAt: string
    creator: {
        id: string
        firstName: string
        lastName: string
        avatarUrl: string | null
    } | null
    exercises: PublicHomeClassExercise[]
}

export type PublicHomeCatalog = {
    exerciseSections: PublicExerciseSportSection[]
    classes: PublicHomeClass[]
    unavailable?: boolean
}

const NO_SPORT = "Sin deporte"

const EMPTY_CATALOG: PublicHomeCatalog = {
    exerciseSections: [],
    classes: [],
}

async function buildExerciseSections(
    exerciseRows: Awaited<ReturnType<typeof loadPublicExerciseRows>>,
): Promise<PublicExerciseSportSection[]> {
    const sectionMap = new Map<string, PublicExerciseSportSection>()

    for (const row of exerciseRows) {
        const sportId = row.sport?.id ?? null
        const key = sportId ?? "__none__"
        let section = sectionMap.get(key)
        if (!section) {
            section = {
                sportId,
                sportName: row.sport?.name ?? NO_SPORT,
                sportSlug: row.sport?.slug ?? null,
                exercises: [],
            }
            sectionMap.set(key, section)
        }

        section.exercises.push({
            id: row.id,
            title: row.title,
            difficulty: row.difficulty,
            previewUrl: await resolveExercisePreviewUrl(row.id),
            updatedAt: row.updatedAt.toISOString(),
        })
    }

    return [...sectionMap.values()].sort((a, b) => {
        if (a.sportId === null) return 1
        if (b.sportId === null) return -1
        return a.sportName.localeCompare(b.sportName, "es")
    })
}

async function buildClassRows(
    classRows: Awaited<ReturnType<typeof loadPublicClassRows>>,
): Promise<PublicHomeClass[]> {
    return Promise.all(
        classRows.map(async (row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            difficulty: row.difficulty,
            sportName: row.sport?.name ?? null,
            sportSlug: row.sport?.slug ?? null,
            createdAt: row.createdAt.toISOString(),
            creator: row.creator,
            exercises: await Promise.all(
                row.items.map(async (item) => ({
                    id: item.exercise.id,
                    title: item.exercise.title,
                    previewUrl: await resolveExercisePreviewUrl(item.exercise.id),
                    sortOrder: item.sortOrder,
                })),
            ),
        })),
    )
}

async function loadPublicExerciseRows() {
    return getPrisma().exercise.findMany({
        where: { visibility: "public" },
        orderBy: { updatedAt: "desc" },
        take: HOME_EXERCISES_LIMIT,
        include: {
            sport: { select: { id: true, name: true, slug: true } },
        },
    })
}

async function loadPublicClassRows() {
    return getPrisma().trainingClass.findMany({
        where: { visibility: "public" },
        orderBy: { createdAt: "desc" },
        take: HOME_CLASSES_LIMIT,
        include: {
            sport: { select: { name: true, slug: true } },
            creator: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                },
            },
            items: {
                orderBy: { sortOrder: "asc" },
                include: {
                    exercise: { select: { id: true, title: true } },
                },
            },
        },
    })
}

async function loadPublicHomeCatalog(): Promise<PublicHomeCatalog> {
    const [exerciseRows, classRows] = await Promise.all([
        loadPublicExerciseRows(),
        loadPublicClassRows(),
    ])

    const exerciseSections = await buildExerciseSections(exerciseRows)
    const classes = await buildClassRows(classRows)

    return { exerciseSections, classes }
}

async function loadClubHomeCatalog(clubId: string): Promise<PublicHomeCatalog> {
    // Managers keep User.clubId null and link via managedClub; coaches use clubId.
    const clubFilter = {
        visibility: "club" as const,
        creator: {
            OR: [{ clubId }, { managedClub: { id: clubId } }],
        },
    }

    const [exerciseRows, classRows] = await Promise.all([
        getPrisma().exercise.findMany({
            where: clubFilter,
            orderBy: { updatedAt: "desc" },
            take: HOME_EXERCISES_LIMIT,
            include: {
                sport: { select: { id: true, name: true, slug: true } },
            },
        }),
        getPrisma().trainingClass.findMany({
            where: clubFilter,
            orderBy: { createdAt: "desc" },
            take: HOME_CLASSES_LIMIT,
            include: {
                sport: { select: { name: true, slug: true } },
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
                items: {
                    orderBy: { sortOrder: "asc" },
                    include: {
                        exercise: { select: { id: true, title: true } },
                    },
                },
            },
        }),
    ])

    const exerciseSections = await buildExerciseSections(exerciseRows)
    const classes = await buildClassRows(classRows)

    return { exerciseSections, classes }
}

export const getPublicHomeCatalog = unstable_cache(
    loadPublicHomeCatalog,
    ["home-public-catalog"],
    { revalidate: 300, tags: [HOME_CATALOG_CACHE_TAG] },
)

export function getClubHomeCatalog(clubId: string) {
    return unstable_cache(
        () => loadClubHomeCatalog(clubId),
        [`home-club-catalog-${clubId}`],
        { revalidate: 300, tags: [HOME_CATALOG_CACHE_TAG, HOME_CLUB_CATALOG_CACHE_TAG] },
    )()
}

export async function getPublicHomeCatalogSafe(): Promise<PublicHomeCatalog> {
    try {
        return await getPublicHomeCatalog()
    } catch (error) {
        console.error("[getPublicHomeCatalog]", error)
        return { ...EMPTY_CATALOG, unavailable: true }
    }
}

export async function getClubHomeCatalogSafe(clubId: string): Promise<PublicHomeCatalog> {
    try {
        return await getClubHomeCatalog(clubId)
    } catch (error) {
        console.error("[getClubHomeCatalog]", error)
        return { ...EMPTY_CATALOG, unavailable: true }
    }
}
