"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useOptimistic, useTransition } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import type { Sport } from "@prisma/client"

import { deleteElementAction } from "@/app/actions/elements"
import { ElementRowActions } from "@/components/elements/ElementRowActions"
import { Pagination } from "@/components/ui/pagination/Pagination"
import { SortableTh } from "@/components/ui/table/SortableTh"
import type { ElementListSortBy } from "@/schemas/element.schema"
import type { ElementListItem } from "@/services/elements.service"

type Props = {
    elements: ElementListItem[]
    totalPages: number
    sports: Sport[]
    listState: {
        search: string
        sport: string
        sortBy: ElementListSortBy
        sortDir: "asc" | "desc"
    }
}

interface FormData {
    search: string
    sport: Sport["slug"]
}

function defaultSortDir(column: ElementListSortBy): "asc" | "desc" {
    switch (column) {
        case "name":
        case "sport":
        case "width":
        case "height":
            return "asc"
        case "updatedAt":
        default:
            return "desc"
    }
}

export function ElementsPaginatedTable({ elements, totalPages, sports, listState }: Props) {
    const router = useRouter()
    const { register, handleSubmit } = useForm<FormData>({
        defaultValues: {
            search: listState.search,
            sport: listState.sport,
        },
    })
    const [, startTransition] = useTransition()
    const [optimisticElements, removeElementOptimistic] = useOptimistic(
        elements,
        (current, deletedId: string) => current.filter((e) => e.id !== deletedId),
    )

    const deleteElement = useCallback(
        (id: string) =>
            new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
                startTransition(async () => {
                    const result = await deleteElementAction(id)
                    if (result.ok) {
                        removeElementOptimistic(id)
                        router.refresh()
                        resolve({ ok: true })
                    } else {
                        resolve({ ok: false, error: result.error })
                    }
                })
            }),
        [removeElementOptimistic, router],
    )

    const onSubmit = (data: FormData) => {
        const p = new URLSearchParams()
        const q = data.search?.trim()
        if (q) p.set("search", q)
        if (data.sport) p.set("sport", data.sport)
        p.set("sortBy", listState.sortBy)
        p.set("sortDir", listState.sortDir)
        router.push(`/elements/list?${p.toString()}`)
        router.refresh()
    }

    return (
        <div className="flex flex-col gap-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex w-full flex-wrap items-center justify-start gap-3"
            >
                <input
                    id="search"
                    {...register("search")}
                    type="text"
                    placeholder="Buscar"
                    className="min-w-32 flex-1 rounded border border-zinc-300 bg-white p-0.5 dark:border-zinc-600 dark:bg-zinc-700 sm:max-w-xs"
                />

                <select
                    id="sport"
                    {...register("sport")}
                    className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                >
                    <option value="">Todos los deportes</option>
                    {sports.map((sport) => (
                        <option key={sport.id} value={sport.slug}>
                            {sport.name}
                        </option>
                    ))}
                </select>

                <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                    Buscar
                </button>
            </form>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                        <thead className="bg-zinc-100 dark:bg-zinc-900">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                                >
                                    Imagen
                                </th>
                                <SortableTh
                                    column="name"
                                    label="Nombre"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("name")}
                                />
                                <SortableTh
                                    column="width"
                                    label="Ancho (cm)"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("width")}
                                />
                                <SortableTh
                                    column="height"
                                    label="Alto (cm)"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("height")}
                                />
                                <SortableTh
                                    column="sport"
                                    label="Deporte"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("sport")}
                                />
                                <SortableTh
                                    column="updatedAt"
                                    label="Actualizado"
                                    currentSortBy={listState.sortBy}
                                    currentSortDir={listState.sortDir}
                                    defaultDir={defaultSortDir("updatedAt")}
                                />
                                <th
                                    scope="col"
                                    className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                            {optimisticElements.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
                                    >
                                        No hay elementos con estos filtros.{" "}
                                        <Link
                                            href="/elements/new"
                                            className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                        >
                                            Crear el primero
                                        </Link>
                                        .
                                    </td>
                                </tr>
                            ) : (
                                optimisticElements.map((element) => {
                                    const elementSport = sports.find((s) => s.id === element.sportId)
                                    const sportName = elementSport?.name ?? "—"

                                    return (
                                        <tr
                                            key={element.id}
                                            className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                                        >
                                            <td className="whitespace-nowrap px-4 py-3 align-middle">
                                                <Image
                                                    src={element.image}
                                                    alt={element.name}
                                                    width={40}
                                                    height={40}
                                                    className="h-10 w-10 object-contain"
                                                />
                                            </td>
                                            <td className="max-w-xs px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                <span className="line-clamp-2">{element.name}</span>
                                                <span className="mt-0.5 block text-xs font-normal text-zinc-500">
                                                    {element.id}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                                {element.width}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                                {element.height}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
                                                {sportName}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                                                {new Intl.DateTimeFormat("es", {
                                                    dateStyle: "short",
                                                    timeStyle: "short",
                                                }).format(new Date(element.updatedAt))}
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <ElementRowActions
                                                    id={element.id}
                                                    name={element.name}
                                                    deleteElement={deleteElement}
                                                />
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination totalPages={totalPages} />
        </div>
    )
}
