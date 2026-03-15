'use client'

export interface OrderedItemSummary {
    key: string
    order: number
    label: string
    description?: string
    assignedPlayers?: string[]
    badgeColor: string
    badgeTextColor: string
    targetType: "image" | "arrow"
    targetIndex: number
}

interface ExerciseOrderPanelProps {
    orderedItems: OrderedItemSummary[]
    playerOptions: string[]
    playerFilter: string
    setPlayerFilter: (value: string) => void
    onEditItem: (item: OrderedItemSummary) => void
}

export const ExerciseOrderPanel = ({
    orderedItems,
    playerOptions,
    playerFilter,
    setPlayerFilter,
    onEditItem,
}: ExerciseOrderPanelProps) => {
    return (
        <aside className="w-80 rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800">
            <div className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Lista del ejercicio
            </div>
            <div className="mb-2 mt-1 h-px bg-zinc-300 dark:bg-zinc-600" />

            <label className="mb-3 flex flex-col gap-1 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Filtrar por jugador</span>
                <select
                    value={playerFilter}
                    onChange={(e) => setPlayerFilter(e.target.value)}
                    className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
                >
                    <option value="all">Todos</option>
                    {playerOptions.map((player) => (
                        <option key={player} value={player}>
                            {player}
                        </option>
                    ))}
                </select>
            </label>

            <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                {orderedItems.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No hay elementos con orden para este filtro.
                    </p>
                ) : (
                    orderedItems.map((item) => (
                        <div
                            key={item.key}
                            className="rounded-lg bg-white p-2 shadow-sm dark:bg-zinc-700"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                    <span
                                        className="mt-0.5 inline-flex min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-semibold"
                                        style={{ backgroundColor: item.badgeColor, color: item.badgeTextColor }}
                                    >
                                        {item.order}
                                    </span>
                                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-100">
                                        {item.label}
                                    </p>
                                </div>
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onEditItem(item)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault()
                                            onEditItem(item)
                                        }
                                    }}
                                    className="rounded bg-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-500"
                                >
                                    Editar
                                </span>
                            </div>
                            {item.description && (
                                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                                    {item.description}
                                </p>
                            )}
                            {item.assignedPlayers && item.assignedPlayers.length > 0 && (
                                <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                                    Jugadores: {item.assignedPlayers.join(", ")}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </aside>
    )
}


