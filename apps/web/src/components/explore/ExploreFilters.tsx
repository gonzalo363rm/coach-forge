"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import clsx from "clsx"

import {
    listFilterButtonClass,
    listFilterFormClass,
    listFilterSearchClass,
    listFilterSelectClass,
} from "@/components/ui/table/list-filter-bar"

type SportOption = { slug: string; name: string }

type Props = {
    basePath: "/explore/exercises" | "/explore/classes"
    search: string
    sport: string
    difficulty: string
    sortDir: "asc" | "desc"
    scope: "community" | "club"
    showClubScope: boolean
    clubName?: string | null
    sports: SportOption[]
}

function buildHref(
    basePath: string,
    opts: {
        search?: string
        sport?: string
        difficulty?: string
        sortDir?: string
        scope?: string
    },
): string {
    const params = new URLSearchParams()
    if (opts.search) params.set("search", opts.search)
    if (opts.sport) params.set("sport", opts.sport)
    if (opts.difficulty) params.set("difficulty", opts.difficulty)
    if (opts.sortDir === "asc") params.set("sortDir", "asc")
    if (opts.scope === "club") params.set("scope", "club")
    params.set("page", "1")
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
}

const scopeTabClass =
    "cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors"

export function ExploreFilters({
    basePath,
    search,
    sport,
    difficulty,
    sortDir,
    scope,
    showClubScope,
    clubName,
    sports,
}: Props) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const clubLabel = clubName?.trim() || "Club"

    function submit(formData: FormData) {
        const nextSearch = String(formData.get("search") ?? "").trim()
        const nextSport = String(formData.get("sport") ?? "").trim()
        const nextDifficulty = String(formData.get("difficulty") ?? "").trim()
        const nextSortDir = String(formData.get("sortDir") ?? "desc")

        startTransition(() => {
            router.push(
                buildHref(basePath, {
                    search: nextSearch,
                    sport: nextSport,
                    difficulty: nextDifficulty,
                    sortDir: nextSortDir,
                    scope,
                }),
            )
        })
    }

    return (
        <div className="flex flex-col gap-4">
            {showClubScope ? (
                <div className="flex justify-center sm:justify-start">
                    <div
                        role="tablist"
                        aria-label="Ámbito"
                        className="inline-flex max-w-full gap-1 rounded-xl border border-zinc-700 bg-zinc-950 p-1"
                    >
                        <Link
                            href={buildHref(basePath, {
                                search,
                                sport,
                                difficulty,
                                sortDir,
                                scope: "club",
                            })}
                            role="tab"
                            aria-selected={scope === "club"}
                            title={clubLabel}
                            className={clsx(
                                scopeTabClass,
                                "max-w-[14rem] truncate sm:max-w-xs",
                                scope === "club"
                                    ? "bg-emerald-600 text-white"
                                    : "text-zinc-400 hover:text-zinc-200",
                            )}
                        >
                            {clubLabel}
                        </Link>
                        <Link
                            href={buildHref(basePath, {
                                search,
                                sport,
                                difficulty,
                                sortDir,
                                scope: "community",
                            })}
                            role="tab"
                            aria-selected={scope === "community"}
                            className={clsx(
                                scopeTabClass,
                                scope === "community"
                                    ? "bg-emerald-600 text-white"
                                    : "text-zinc-400 hover:text-zinc-200",
                            )}
                        >
                            Comunidad
                        </Link>
                    </div>
                </div>
            ) : null}

            <form action={submit} className={listFilterFormClass}>
                <input
                    name="search"
                    type="search"
                    defaultValue={search}
                    placeholder="Buscar por título…"
                    aria-label="Buscar por título"
                    className={listFilterSearchClass}
                />
                <select
                    name="sport"
                    defaultValue={sport}
                    aria-label="Deporte"
                    className={listFilterSelectClass}
                >
                    <option value="">Todos los deportes</option>
                    {sports.map((s) => (
                        <option key={s.slug} value={s.slug}>
                            {s.name}
                        </option>
                    ))}
                </select>
                <select
                    name="difficulty"
                    defaultValue={difficulty}
                    aria-label="Dificultad"
                    className={listFilterSelectClass}
                >
                    <option value="">Todas las dificultades</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={String(n)}>
                            {n} / 5
                        </option>
                    ))}
                </select>
                <select
                    name="sortDir"
                    defaultValue={sortDir}
                    aria-label="Orden por fecha"
                    className={listFilterSelectClass}
                >
                    <option value="desc">Más recientes</option>
                    <option value="asc">Más antiguos</option>
                </select>
                <button type="submit" disabled={pending} className={listFilterButtonClass}>
                    {pending ? "…" : "Buscar"}
                </button>
            </form>
        </div>
    )
}
