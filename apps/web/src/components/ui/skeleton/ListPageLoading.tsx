import { ListTableSkeleton } from "./ListTableSkeleton"
import { Skeleton } from "./Skeleton"

type Props = {
    title: string
    filterCount?: number
    rowCount?: number
    columnCount?: number
}

export function ListPageLoading({
    title,
    filterCount,
    rowCount,
    columnCount,
}: Props) {
    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-8">
                <header className="flex items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-zinc-800 dark:text-white">
                        {title}
                    </h1>
                    <Skeleton className="size-9 shrink-0 rounded-lg" aria-hidden />
                </header>

                <ListTableSkeleton
                    filterCount={filterCount}
                    rowCount={rowCount}
                    columnCount={columnCount}
                />
            </main>
        </div>
    )
}
