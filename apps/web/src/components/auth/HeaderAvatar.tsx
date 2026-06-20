import Image from "next/image"

type Props = {
    avatarUrl: string | null
    firstName: string
    lastName: string
    size?: "sm" | "md"
    className?: string
}

function buildInitials(firstName: string, lastName: string): string {
    const a = firstName.trim().charAt(0)
    const b = lastName.trim().charAt(0)
    const initials = `${a}${b}`.toUpperCase()
    return initials || "?"
}

export function HeaderAvatar({ avatarUrl, firstName, lastName, size = "sm", className }: Props) {
    const initials = buildInitials(firstName, lastName)
    const dimension = size === "md" ? "size-10" : "size-8"
    const imageSizes = size === "md" ? "40px" : "32px"
    const initialsClass = size === "md" ? "text-sm" : "text-xs"

    return (
        <div
            className={`relative ${dimension} shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 ${className ?? ""}`}
        >
            {avatarUrl ? (
                <Image
                    src={avatarUrl}
                    alt=""
                    fill
                    sizes={imageSizes}
                    className="object-cover"
                    unoptimized
                />
            ) : (
                <span className={`flex h-full w-full items-center justify-center font-semibold text-zinc-500 dark:text-zinc-400 ${initialsClass}`}>
                    {initials}
                </span>
            )}
        </div>
    )
}
