export type NavSection = "classes-mine" | "exercises-mine" | "explore"

export function isNavActive(
    pathname: string,
    href: string,
    section?: NavSection,
): boolean {
    if (pathname === href) return true

    if (section === "classes-mine") {
        return pathname.startsWith("/classes/") && pathname !== "/classes/new"
    }

    if (section === "exercises-mine") {
        return pathname.startsWith("/exercises/") && pathname !== "/exercises/new"
    }

    if (section === "explore") {
        return pathname === "/explore" || pathname.startsWith("/explore/")
    }

    return pathname.startsWith(`${href}/`)
}

export function normalizeNavHref(href: string): string {
    try {
        const url = new URL(href, "http://local")
        return url.pathname
    } catch {
        return href.split("?")[0] ?? href
    }
}
