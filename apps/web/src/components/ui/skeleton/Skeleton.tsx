import { clsx } from "clsx"

type Props = {
    className?: string
}

export function Skeleton({ className }: Props) {
    return (
        <div
            className={clsx(
                "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800",
                className,
            )}
            aria-hidden
        />
    )
}
