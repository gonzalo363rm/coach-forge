"use client"

import clsx from "clsx"

import type { ToolType } from "@/interfaces"

export type MobileSheetId = "elements" | "order" | "options" | null

type Props = {
    orientation: "portrait" | "landscape"
    currentTool: ToolType
    setCurrentTool: (tool: ToolType) => void
    onOpenSheet: (sheet: Exclude<MobileSheetId, null>) => void
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
    onFitView: () => void
    hasPaletteStamp: boolean
}

const SHAPE_TOOLS: ToolType[] = ["circle", "rect", "square", "line", "dashed-line"]

function ToolButton({
    active,
    onClick,
    label,
    children,
    disabled,
}: {
    active?: boolean
    onClick: () => void
    label: string
    children: React.ReactNode
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className={clsx(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-medium transition-colors disabled:opacity-40",
                active
                    ? "bg-violet-600 text-white"
                    : "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600",
            )}
        >
            {children}
        </button>
    )
}

export function MobileEditorToolbar({
    orientation,
    currentTool,
    setCurrentTool,
    onOpenSheet,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onFitView,
    hasPaletteStamp,
}: Props) {
    const isLandscape = orientation === "landscape"
    const isShapeTool = SHAPE_TOOLS.includes(currentTool)

    return (
        <div
            className={clsx(
                "relative z-40 flex shrink-0 gap-1.5 bg-zinc-100 dark:bg-zinc-900",
                isLandscape
                    ? "h-full w-14 flex-col items-center overflow-y-auto border-r border-zinc-300 px-1.5 py-2 dark:border-zinc-700"
                    : "w-full flex-row items-center overflow-x-auto border-t border-zinc-300 px-2 py-1.5 dark:border-zinc-700",
            )}
            style={
                isLandscape
                    ? { paddingLeft: "max(0.375rem, env(safe-area-inset-left))" }
                    : { paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }
            }
        >
            <ToolButton
                active={currentTool === "select" && !hasPaletteStamp}
                label="Seleccionar"
                onClick={() => setCurrentTool("select")}
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4l6.5 15.5L13 13l6.5-2.5L4 4z"
                    />
                </svg>
            </ToolButton>

            <ToolButton
                active={currentTool === "arrow"}
                label="Flecha"
                onClick={() => setCurrentTool("arrow")}
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                </svg>
            </ToolButton>

            <ToolButton
                active={isShapeTool || hasPaletteStamp}
                label="Figuras y elementos"
                onClick={() => onOpenSheet("elements")}
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                </svg>
            </ToolButton>

            <ToolButton label="Lista" onClick={() => onOpenSheet("order")}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h10"
                    />
                </svg>
            </ToolButton>

            <div
                className={clsx(
                    "bg-zinc-300 dark:bg-zinc-600",
                    isLandscape ? "my-1 h-px w-8" : "mx-1 h-8 w-px",
                )}
            />

            <ToolButton label="Deshacer" disabled={!canUndo} onClick={onUndo}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h10a5 5 0 015 5v1M3 10l4-4M3 10l4 4"
                    />
                </svg>
            </ToolButton>

            <ToolButton label="Rehacer" disabled={!canRedo} onClick={onRedo}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 10H11a5 5 0 00-5 5v1M21 10l-4-4M21 10l-4 4"
                    />
                </svg>
            </ToolButton>

            <ToolButton label="Encajar vista" onClick={onFitView}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"
                    />
                </svg>
            </ToolButton>

            <ToolButton label="Opciones" onClick={() => onOpenSheet("options")}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9.75A2.25 2.25 0 1 0 12 14.25 2.25 2.25 0 1 0 12 9.75z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.5 12a7.5 7.5 0 0 0-.1-1.22l2-1.56-2-3.46-2.44.74a7.56 7.56 0 0 0-2.12-1.22L14.5 2h-5l-.34 3.28a7.56 7.56 0 0 0-2.12 1.22l-2.44-.74-2 3.46 2 1.56a7.5 7.5 0 0 0 0 2.44l-2 1.56 2 3.46 2.44-.74a7.56 7.56 0 0 0 2.12 1.22L9.5 22h5l.34-3.28a7.56 7.56 0 0 0 2.12-1.22l2.44.74 2-3.46-2-1.56c.07-.4.1-.81.1-1.22z"
                    />
                </svg>
            </ToolButton>
        </div>
    )
}
