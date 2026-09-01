import type { Role } from "@prisma/client"

import { isSuperadminRole } from "@/lib/user-permissions"

export type AdminNavLink = {
    href: string
    label: string
    minRole?: "superadmin"
}

export const ADMIN_NAV_LINKS: AdminNavLink[] = [
    { href: "/admin/classes", label: "Clases" },
    { href: "/admin/exercises", label: "Ejercicios" },
    { href: "/admin/elements", label: "Elementos" },
    { href: "/admin/sports", label: "Deportes" },
    { href: "/admin/clubs", label: "Clubes" },
    { href: "/admin/users", label: "Usuarios" },
    { href: "/admin/payments", label: "Pagos" },
    { href: "/admin/plans", label: "Planes", minRole: "superadmin" },
    { href: "/admin/discounts", label: "Descuentos", minRole: "superadmin" },
]

export function adminNavLinksForRole(role: Role): AdminNavLink[] {
    return ADMIN_NAV_LINKS.filter((link) => {
        if (link.minRole === "superadmin") return isSuperadminRole(role)
        return true
    })
}
