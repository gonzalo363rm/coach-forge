"use client"

import { deleteSportAction } from "@/app/actions/sports"
import { SportRowActions } from "@/components/sports/SportRowActions"
import { Pagination } from "@/components/ui/pagination/Pagination"
import type { Sport } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useCallback, useOptimistic, useTransition } from "react"

type Props = {
    sports: Sport[]
    totalPages: number
}

export function SportsPaginatedTable({ sports, totalPages }: Props) {
    const router = useRouter()
    const [, startTransition] = useTransition()
    const [optimisticSports, removeSportOptimistic] = useOptimistic(
        sports,
        (current, deletedId: string) => current.filter((s) => s.id !== deletedId),
    )

    const deleteSport = useCallback(
        (id: string) =>
            new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
                startTransition(async () => {
                    removeSportOptimistic(id)
                    const result = await deleteSportAction(id)
                    if (result.ok) {
                        router.refresh()
                        resolve({ ok: true })
                    } else {
                        resolve({ ok: false, error: result.error })
                    }
                })
            }),
        [removeSportOptimistic, router],
    )

    return (
        <>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-100 dark:bg-zinc-900">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                                >
                                    ID
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                                >
                                    Nombre
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                                >
                                    Slug
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                            {optimisticSports.map((sport) => (
                                <tr
                                    key={sport.id}
                                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                                >
                                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-zinc-600 dark:text-zinc-400">
                                        {sport.id}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                        {sport.name}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                                        {sport.slug}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <SportRowActions
                                            id={sport.id}
                                            name={sport.name}
                                            deleteSport={deleteSport}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination totalPages={totalPages} />
        </>
    )
}
