export type UserSelectOption = {
    id: string
    firstName: string
    lastName: string
}

export type UserCreatorSummary = UserSelectOption

export function formatUserDisplayName(user: {
    firstName: string
    lastName: string
}): string {
    return `${user.firstName.trim()} ${user.lastName.trim()}`.trim()
}
