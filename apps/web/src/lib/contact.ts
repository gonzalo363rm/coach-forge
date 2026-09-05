export function getContactEmail(): string {
    const fromEnv = process.env.CONTACT_EMAIL?.trim()
    if (fromEnv) return fromEnv
    return "coachforge@gmail.com"
}
