import type { ContentVisibility } from "@prisma/client"

export const contentVisibilitySchemaValues = ["private", "club", "public"] as const

export type ContentVisibilityValue = (typeof contentVisibilitySchemaValues)[number]

export function formatContentVisibility(visibility: ContentVisibility): string {
    switch (visibility) {
        case "private":
            return "Privado"
        case "club":
            return "Público para mi club"
        case "public":
            return "Público (comunidad)"
    }
}

export function canSetClubVisibility(user: {
    role: string
    clubId?: string | null
}): boolean {
    return user.role === "club_manager" || Boolean(user.clubId)
}

export function availableVisibilitiesForUser(user: {
    role: string
    clubId?: string | null
}): ContentVisibility[] {
    const options: ContentVisibility[] = ["private"]
    if (canSetClubVisibility(user)) {
        options.push("club")
    }
    options.push("public")
    return options
}
