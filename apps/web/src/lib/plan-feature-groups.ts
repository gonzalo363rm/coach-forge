import { formatPlanFeature } from "@/lib/billing-labels"

export type PlanPermissionForDisplay = {
    code: string
    name: string
    valueKind: "flag" | "limit"
    value: number | null
}

export type PlanFeatureBullet = {
    id: string
    label: string
}

const EXERCISE_CRUD = new Set([
    "create_exercise",
    "edit_exercise",
    "delete_exercise",
])

const CLASS_CRUD = new Set(["create_class", "edit_class", "delete_class"])

const EXERCISE_LIMIT = "max_exercises_per_month"
const CLASS_LIMIT = "max_classes_per_month"
const CLUB_MEMBERS_LIMIT = "max_club_members"
const START_CLASS = "start_class"
const ACCESS_PUBLIC_EXERCISE = "access_public_exercise"
const ACCESS_PUBLIC_CLASS = "access_public_class"
const ACCESS_CLUB_EXERCISE = "access_club_exercise"
const ACCESS_CLUB_CLASS = "access_club_class"

function formatQuotaLabel(
    nounSingular: string,
    nounPlural: string,
    adjectiveUnlimited: string,
    value: number | null,
): string {
    if (value == null) {
        return `${capitalize(nounPlural)} ${adjectiveUnlimited}`
    }
    if (value === 1) return `Hasta 1 ${nounSingular} por mes`
    return `Hasta ${value} ${nounPlural} por mes`
}

function capitalize(value: string): string {
    if (!value) return value
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatMembersLabel(value: number | null): string {
    if (value == null) return "Coaches del club ilimitados"
    if (value === 1) return "Hasta 1 coach en el club"
    return `Hasta ${value} coaches en el club`
}

/**
 * Agrupa permisos granulares en bullets de marketing para cards de planes.
 * Separa gestión, cupos, dictado y accesos para que la card tenga más ítems claros.
 */
export function groupPlanFeaturesForDisplay(
    permissions: PlanPermissionForDisplay[],
): PlanFeatureBullet[] {
    const byCode = new Map(permissions.map((p) => [p.code, p]))
    const consumed = new Set<string>()
    const bullets: PlanFeatureBullet[] = []

    const hasAny = (codes: Set<string> | string[]) =>
        [...codes].some((code) => byCode.has(code))

    const mark = (...codes: string[]) => {
        for (const code of codes) {
            if (byCode.has(code)) consumed.add(code)
        }
    }

    // Ejercicios: gestión + cupo aparte
    if (hasAny(EXERCISE_CRUD)) {
        bullets.push({ id: "exercises-manage", label: "Gestión de ejercicios" })
        mark(...EXERCISE_CRUD)
    }
    const exerciseLimit = byCode.get(EXERCISE_LIMIT)
    if (exerciseLimit) {
        bullets.push({
            id: "exercises-quota",
            label: formatQuotaLabel("ejercicio", "ejercicios", "ilimitados", exerciseLimit.value),
        })
        mark(EXERCISE_LIMIT)
    }

    // Clases: gestión + dictar + cupo
    if (hasAny(CLASS_CRUD)) {
        bullets.push({ id: "classes-manage", label: "Gestión de clases" })
        mark(...CLASS_CRUD)
    }
    if (byCode.has(START_CLASS)) {
        bullets.push({ id: "classes-start", label: "Dictar clases en vivo" })
        mark(START_CLASS)
    }
    const classLimit = byCode.get(CLASS_LIMIT)
    if (classLimit) {
        bullets.push({
            id: "classes-quota",
            label: formatQuotaLabel("clase", "clases", "ilimitadas", classLimit.value),
        })
        mark(CLASS_LIMIT)
    }

    // Acceso público (separado por tipo si hay ambos)
    const hasPublicExercise = byCode.has(ACCESS_PUBLIC_EXERCISE)
    const hasPublicClass = byCode.has(ACCESS_PUBLIC_CLASS)
    if (hasPublicExercise && hasPublicClass) {
        bullets.push({
            id: "public-access",
            label: "Acceso a contenido público",
        })
        mark(ACCESS_PUBLIC_EXERCISE, ACCESS_PUBLIC_CLASS)
    } else if (hasPublicExercise) {
        bullets.push({
            id: "public-exercises",
            label: "Acceso a ejercicios públicos",
        })
        mark(ACCESS_PUBLIC_EXERCISE)
    } else if (hasPublicClass) {
        bullets.push({
            id: "public-classes",
            label: "Acceso a clases públicas",
        })
        mark(ACCESS_PUBLIC_CLASS)
    }

    // Acceso club
    const hasClubExercise = byCode.has(ACCESS_CLUB_EXERCISE)
    const hasClubClass = byCode.has(ACCESS_CLUB_CLASS)
    if (hasClubExercise && hasClubClass) {
        bullets.push({
            id: "club-access",
            label: "Acceso a contenido del club",
        })
        mark(ACCESS_CLUB_EXERCISE, ACCESS_CLUB_CLASS)
    } else if (hasClubExercise) {
        bullets.push({
            id: "club-exercises",
            label: "Acceso a ejercicios del club",
        })
        mark(ACCESS_CLUB_EXERCISE)
    } else if (hasClubClass) {
        bullets.push({
            id: "club-classes",
            label: "Acceso a clases del club",
        })
        mark(ACCESS_CLUB_CLASS)
    }

    const members = byCode.get(CLUB_MEMBERS_LIMIT)
    if (members) {
        bullets.push({
            id: "club-members",
            label: formatMembersLabel(members.value),
        })
        mark(CLUB_MEMBERS_LIMIT)
    }

    for (const permission of permissions) {
        if (consumed.has(permission.code)) continue
        bullets.push({
            id: permission.code,
            label: formatPlanFeature(permission),
        })
    }

    return bullets
}
