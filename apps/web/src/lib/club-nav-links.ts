export const CLUB_NAV_LINKS = [
    { href: "/club", label: "Datos del club", match: "exact" as const },
    { href: "/club/members", label: "Coaches", match: "prefix" as const },
] as const

export function isClubNavLinkActive(pathname: string, href: string, match: "exact" | "prefix") {
    if (match === "exact") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
}
