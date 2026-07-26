"use client"

import Link from "next/link"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Role } from "@prisma/client"
import { IoMenu } from "react-icons/io5"

import { canManageOwnedResource } from "@/lib/user-permissions"

import type { ClassDraftExerciseItem } from "./class-draft-storage"

const btnBase =
    "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors"

type Viewer = {
    id: string
    role: Role
}

type Props = {
    items: ClassDraftExerciseItem[]
    returnTo: string
    viewer?: Viewer | null
    onChange: (items: ClassDraftExerciseItem[]) => void
    onEdit: (item: ClassDraftExerciseItem) => void
    onView: (item: ClassDraftExerciseItem) => void
}

function formatDuration(item: ClassDraftExerciseItem): string {
    if (item.isOptional) return "opcional"
    const min = item.durationMinutes ?? 5
    return `${min} min`
}

export function ClassExerciseList({
    items,
    returnTo,
    viewer = null,
    onChange,
    onEdit,
    onView,
}: Props) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = items.findIndex((i) => i.exerciseId === active.id)
        const newIndex = items.findIndex((i) => i.exerciseId === over.id)
        if (oldIndex < 0 || newIndex < 0) return
        const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            sortOrder: idx,
        }))
        onChange(reordered)
    }

    if (items.length === 0) {
        return (
            <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                Aún no hay ejercicios en esta clase. Usa «Añadir ejercicio» o crea uno nuevo.
            </p>
        )
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
                items={items.map((i) => i.exerciseId)}
                strategy={verticalListSortingStrategy}
            >
                <ul className="flex flex-col gap-2">
                    {items.map((item) => (
                        <SortableExerciseRow
                            key={item.exerciseId}
                            item={item}
                            returnTo={returnTo}
                            canEditExercise={
                                viewer
                                    ? canManageOwnedResource(viewer, item.creatorId)
                                    : false
                            }
                            onEdit={() => onEdit(item)}
                            onView={() => onView(item)}
                        />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    )
}

function SortableExerciseRow({
    item,
    returnTo,
    canEditExercise,
    onEdit,
    onView,
}: {
    item: ClassDraftExerciseItem
    returnTo: string
    canEditExercise: boolean
    onEdit: () => void
    onView: () => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: item.exerciseId })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.85 : 1,
    }

    const editExerciseHref = `/exercises/${item.exerciseId}/edit?returnTo=${encodeURIComponent(returnTo)}`

    return (
        <li
            ref={setNodeRef}
            style={style}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900"
        >
            <button
                type="button"
                className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                aria-label="Reordenar"
                {...attributes}
                {...listeners}
            >
                <IoMenu className="h-5 w-5" />
            </button>
            <span className="min-w-0 flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {item.title}
            </span>
            <span className="shrink-0 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                {formatDuration(item)}
            </span>
            <RowActions
                onEdit={onEdit}
                onView={onView}
                editExerciseHref={canEditExercise ? editExerciseHref : null}
            />
        </li>
    )
}

function RowActions({
    onEdit,
    onView,
    editExerciseHref,
}: {
    onEdit: () => void
    onView: () => void
    editExerciseHref: string | null
}) {
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={onEdit}
                className={`${btnBase} border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800`}
            >
                Editar
            </button>
            <button
                type="button"
                onClick={onView}
                className={`${btnBase} border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/70`}
            >
                Ver
            </button>
            {editExerciseHref ? (
                <Link
                    href={editExerciseHref}
                    className={`${btnBase} border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800`}
                >
                    Ir al ejercicio
                </Link>
            ) : null}
        </div>
    )
}
