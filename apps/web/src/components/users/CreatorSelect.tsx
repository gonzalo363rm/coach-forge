"use client"

import { useCallback, useEffect, useId, useRef, useState } from "react"
import { IoChevronDownOutline, IoClose } from "react-icons/io5"

import { searchUsersForSelectAction } from "@/app/actions/users"
import {
    listFilterFieldClass,
    listFilterSelectClass,
} from "@/components/ui/table/list-filter-bar"
import { formatUserDisplayName, type UserSelectOption } from "@/lib/user-display"

type Props = {
    value: string
    initialLabel?: string | null
    onChange: (creatorId: string) => void
    placeholder?: string
}

const PAGE_SIZE = 10

function mergeUsers(
    current: UserSelectOption[],
    incoming: UserSelectOption[],
): UserSelectOption[] {
    const seen = new Set(current.map((user) => user.id))
    const merged = [...current]
    for (const user of incoming) {
        if (!seen.has(user.id)) {
            seen.add(user.id)
            merged.push(user)
        }
    }
    return merged
}

export function CreatorSelect({
    value,
    initialLabel = null,
    onChange,
    placeholder = "Todos los creadores",
}: Props) {
    const listboxId = useId()
    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [users, setUsers] = useState<UserSelectOption[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedLabel, setSelectedLabel] = useState(initialLabel ?? "")

    const displayLabel = value
        ? selectedLabel || initialLabel || placeholder
        : placeholder

    const fetchUsers = useCallback(
        async (search: string, nextPage: number, append: boolean) => {
            setLoading(true)
            const result = await searchUsersForSelectAction({
                search: search || null,
                page: nextPage,
                take: PAGE_SIZE,
            })
            setLoading(false)

            if (!result.ok) return

            setUsers((current) =>
                append ? mergeUsers(current, result.data.users) : result.data.users,
            )
            setHasMore(result.data.hasMore)
            setPage(nextPage)
        },
        [],
    )

    useEffect(() => {
        setSelectedLabel(initialLabel ?? "")
    }, [initialLabel, value])

    useEffect(() => {
        if (!open) return

        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            void fetchUsers(query, 1, false)
        }, 300)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [open, query, fetchUsers])

    useEffect(() => {
        function handlePointerDown(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false)
            }
        }

        if (open) {
            document.addEventListener("mousedown", handlePointerDown)
        }

        return () => document.removeEventListener("mousedown", handlePointerDown)
    }, [open])

    function handleScroll() {
        const list = listRef.current
        if (!list || loading || !hasMore) return

        const nearBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 24
        if (nearBottom) {
            void fetchUsers(query, page + 1, true)
        }
    }

    function selectUser(user: UserSelectOption | null) {
        if (!user) {
            onChange("")
            setSelectedLabel("")
        } else {
            onChange(user.id)
            setSelectedLabel(formatUserDisplayName(user))
        }
        setOpen(false)
        setQuery("")
    }

    return (
        <div ref={containerRef} className={`relative ${listFilterFieldClass} sm:min-w-48`}>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-controls={listboxId}
                className={`${listFilterSelectClass} flex min-h-8 w-full items-center justify-between gap-2 text-left`}
            >
                <span className="truncate">{displayLabel}</span>
                <span className="flex shrink-0 items-center gap-1">
                    {value ? (
                        <span
                            role="button"
                            tabIndex={0}
                            aria-label="Quitar creador"
                            onClick={(event) => {
                                event.stopPropagation()
                                selectUser(null)
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    selectUser(null)
                                }
                            }}
                            className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-600 dark:hover:text-zinc-200"
                        >
                            <IoClose className="size-3.5" aria-hidden />
                        </span>
                    ) : null}
                    <IoChevronDownOutline
                        className={`size-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
                        aria-hidden
                    />
                </span>
            </button>

            {open ? (
                <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-56 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="border-b border-zinc-200 p-2 dark:border-zinc-700">
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar por nombre…"
                            autoFocus
                            className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                    </div>

                    <div
                        id={listboxId}
                        ref={listRef}
                        role="listbox"
                        onScroll={handleScroll}
                        className="max-h-56 overflow-y-auto py-1"
                    >
                        <button
                            type="button"
                            role="option"
                            aria-selected={!value}
                            onClick={() => selectUser(null)}
                            className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                !value
                                    ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : "text-zinc-700 dark:text-zinc-200"
                            }`}
                        >
                            Todos los creadores
                        </button>

                        {users.map((user) => {
                            const label = formatUserDisplayName(user)
                            const isSelected = value === user.id

                            return (
                                <button
                                    key={user.id}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => selectUser(user)}
                                    className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                                        isSelected
                                            ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                            : "text-zinc-700 dark:text-zinc-200"
                                    }`}
                                >
                                    {label}
                                </button>
                            )
                        })}

                        {loading ? (
                            <p className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                                Cargando…
                            </p>
                        ) : null}

                        {!loading && users.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                                Sin resultados
                            </p>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    )
}
