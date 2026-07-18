'use client'

import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import clsx from "clsx"

import type { ElementDefinition, SportListOption, ToolType } from "@/interfaces"

interface ToolsPanelProps {
    elements: ElementDefinition[]
    elementsLoading?: boolean
    sports: SportListOption[]
    currentTool: ToolType
    setCurrentTool: (tool: ToolType) => void
    selectedPaletteElement: ElementDefinition | null
    setSelectedPaletteElement: (element: ElementDefinition | null) => void
}

export const ToolsPanel = ({
    elements,
    elementsLoading = false,
    sports,
    currentTool,
    setCurrentTool,
    selectedPaletteElement,
    setSelectedPaletteElement,
}: ToolsPanelProps) => {
    const [search, setSearch] = useState("")
    const [sportFilter, setSportFilter] = useState("")

    const sportSlugById = useMemo(() => {
        const map = new Map<string, string>()
        for (const s of sports) {
            map.set(s.id, s.slug)
        }
        return map
    }, [sports])

    const filteredElements = useMemo(() => {
        const q = search.trim().toLowerCase()
        return elements.filter((element) => {
            if (element.type !== "image") return false
            if (sportFilter) {
                const slug = element.sportSlug ?? (element.sportId ? sportSlugById.get(element.sportId) : null)
                if (slug !== sportFilter) return false
            }
            if (!q) return true
            return element.name.toLowerCase().includes(q) || element.id.toLowerCase().includes(q)
        })
    }, [elements, search, sportFilter, sportSlugById])

    const handleMenuDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, element: ElementDefinition) => {
        const data = JSON.stringify(element);
        e.dataTransfer.setData("application/json", data);
        e.dataTransfer.setData("text/plain", data);
        e.dataTransfer.effectAllowed = "copy";
    }, [])

    return (
        <div className="flex w-full flex-col gap-2 rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800">
            {/* Tools */}
            <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Herramientas
            </h3>
            <div className="mb-1 h-px bg-zinc-300 dark:bg-zinc-600" />

            <button
                type="button"
                onClick={() => {
                    setCurrentTool("select")
                    setSelectedPaletteElement(null)
                }}
                className={clsx(
                    "flex items-center justify-center gap-2 rounded-lg p-2.5 text-sm font-medium transition-all",
                    {
                        "bg-violet-600 text-white":
                            currentTool === "select" && selectedPaletteElement === null,
                        "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600":
                            !(currentTool === "select" && selectedPaletteElement === null),
                    },
                )}
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4l6.5 15.5L13 13l6.5-2.5L4 4z"
                    />
                </svg>
                Seleccionar
            </button>

            <button
                type="button"
                onClick={() => {
                    setCurrentTool("arrow")
                    setSelectedPaletteElement(null)
                }}
                className={clsx(
                    "flex items-center justify-center gap-2 rounded-lg p-2.5 text-sm font-medium transition-all",
                    {
                        "bg-violet-600 text-white": currentTool === "arrow",
                        "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600": currentTool !== "arrow",
                    }
                )}
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                Flecha
            </button>

            <div className="mt-1 h-px bg-zinc-300 dark:bg-zinc-600" />
            <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Figuras
            </h3>
            <div className="mb-1 h-px bg-zinc-300 dark:bg-zinc-600" />

            <div className="grid grid-cols-5 gap-1">
                <button
                    onClick={() => {
                        setCurrentTool("circle")
                        setSelectedPaletteElement(null)
                    }}
                    className={clsx(
                        "rounded-md p-2.5 text-lg leading-none font-medium transition-all",
                        {
                            "bg-violet-600 text-white": currentTool === "circle",
                            "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600": currentTool !== "circle",
                        }
                    )}
                    title="Círculo"
                >
                    ○
                </button>
                <button
                    onClick={() => {
                        setCurrentTool("rect")
                        setSelectedPaletteElement(null)
                    }}
                    className={clsx(
                        "rounded-md p-2.5 text-lg leading-none font-medium transition-all",
                        {
                            "bg-violet-600 text-white": currentTool === "rect",
                            "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600": currentTool !== "rect",
                        }
                    )}
                    title="Rectángulo"
                >
                    ▭
                </button>
                <button
                    onClick={() => {
                        setCurrentTool("square")
                        setSelectedPaletteElement(null)
                    }}
                    className={clsx(
                        "rounded-md p-2.5 text-lg leading-none font-medium transition-all",
                        {
                            "bg-violet-600 text-white": currentTool === "square",
                            "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600": currentTool !== "square",
                        }
                    )}
                    title="Cuadrado"
                >
                    □
                </button>
                <button
                    onClick={() => {
                        setCurrentTool("line")
                        setSelectedPaletteElement(null)
                    }}
                    className={clsx(
                        "rounded-md p-2.5 text-lg leading-none font-medium transition-all",
                        {
                            "bg-violet-600 text-white": currentTool === "line",
                            "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600": currentTool !== "line",
                        }
                    )}
                    title="Recta"
                >
                    ／
                </button>
                <button
                    onClick={() => {
                        setCurrentTool("dashed-line")
                        setSelectedPaletteElement(null)
                    }}
                    className={clsx(
                        "rounded-md p-2.5 text-lg leading-none font-medium transition-all",
                        {
                            "bg-violet-600 text-white": currentTool === "dashed-line",
                            "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600": currentTool !== "dashed-line",
                        }
                    )}
                    title="Línea punteada"
                >
                    ┈
                </button>
            </div>

            {/* Elements */}
            <div className="mt-1 h-px bg-zinc-300 dark:bg-zinc-600" />
            <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Elementos
            </h3>
            <div className="mb-2 h-px bg-zinc-300 dark:bg-zinc-600" />

            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar elemento"
                className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />

            <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
                <option value="">Todos los deportes</option>
                {sports.map((sport) => (
                    <option key={sport.id} value={sport.slug}>
                        {sport.name}
                    </option>
                ))}
            </select>

            <div className="grid max-h-64 gap-2 overflow-y-auto md:grid-cols-4 xs:grid-cols-3">
                {elementsLoading ? (
                    <p className="col-span-full py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                        Cargando elementos…
                    </p>
                ) : filteredElements.length === 0 ? (
                    <p className="col-span-full py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                        Sin elementos
                    </p>
                ) : (
                    filteredElements.map((element) => {
                        const MAX_THUMB_SIZE = 38;
                        const scale = Math.min(
                            MAX_THUMB_SIZE / element.width,
                            MAX_THUMB_SIZE / element.height
                        );

                        const thumbWidth = Math.max(1, Math.round(element.width * scale));
                        const thumbHeight = Math.max(1, Math.round(element.height * scale));

                        return (
                            <div
                                draggable
                                onDragStart={(e) => handleMenuDragStart(e, element)}
                                onClick={() => {
                                    setCurrentTool("select")
                                    setSelectedPaletteElement(
                                        selectedPaletteElement?.id === element.id ? null : element
                                    )
                                }}
                                key={element.id}
                                className={clsx(
                                    "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg py-2.5 font-medium transition-all hover:shadow-sm",
                                    selectedPaletteElement?.id === element.id
                                        ? "bg-violet-600 text-white dark:bg-violet-600 dark:text-white"
                                        : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                                )}
                                title={element.name}
                            >
                                <Image
                                    src={element.image}
                                    alt={element.name}
                                    width={thumbWidth}
                                    height={thumbHeight}
                                    className="object-scale-down"
                                    draggable={false}
                                    unoptimized={element.image.startsWith("http")}
                                />
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
