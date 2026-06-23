import {
    listFilterSkeletonButtonClass,
    listFilterSkeletonFormClass,
    listFilterSkeletonSearchClass,
    listFilterSkeletonSelectClass,
} from "@/components/ui/table/list-filter-bar"

import { Skeleton } from "./Skeleton"

type Props = {
    filterCount?: number
    rowCount?: number
    columnCount?: number
}

export function ListTableSkeleton({
    filterCount = 4,
    rowCount = 8,
    columnCount = 5,
}: Props) {
    return (
        <div className="flex min-w-0 flex-col gap-4">
            <div className={listFilterSkeletonFormClass} aria-hidden>
                <Skeleton className={listFilterSkeletonSearchClass} />
                {Array.from({ length: filterCount }, (_, i) => (
                    <Skeleton key={i} className={listFilterSkeletonSelectClass} />
                ))}
                <Skeleton className={listFilterSkeletonButtonClass} />
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
                            <tr>
                                {Array.from({ length: columnCount }, (_, i) => (
                                    <th key={i} className="px-4 py-3">
                                        <Skeleton className="h-4 w-20" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {Array.from({ length: rowCount }, (_, row) => (
                                <tr key={row}>
                                    {Array.from({ length: columnCount }, (_, col) => (
                                        <td key={col} className="px-4 py-3">
                                            <Skeleton
                                                className={`h-4 ${col === 0 ? "w-40" : "w-24"}`}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-center gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </div>
        </div>
    )
}
