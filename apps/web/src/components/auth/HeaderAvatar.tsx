import Image from "next/image"

type Props = {
    avatarUrl: string | null
    firstName: string
    lastName: string
}

function buildInitials(firstName: string, lastName: string): string {
    const a = firstName.trim().charAt(0)
    const b = lastName.trim().charAt(0)
    const initials = `${a}${b}`.toUpperCase()
    return initials || "?"
}

export function HeaderAvatar({ avatarUrl, firstName, lastName }: Props) {
    const initials = buildInitials(firstName, lastName)

    return (
        <div className="relative size-8 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
            {avatarUrl ? (
                <Image
                    src={avatarUrl}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                    unoptimized
                />
            ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {initials}
                </span>
            )}
        </div>
    )
}
