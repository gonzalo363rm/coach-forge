export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugifySportName(name: string): string {
    return name
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}
