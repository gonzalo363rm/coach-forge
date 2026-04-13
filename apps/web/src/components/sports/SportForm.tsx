"use client"

import { createSportAction, updateSportAction } from "@/app/actions/sports"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

type Props =
    | { mode: "create" }
    | { mode: "edit"; sport: { id: string; name: string; slug: string } }

export function SportForm(props: Props) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [name, setName] = useState(props.mode === "edit" ? props.sport.name : "")
    const [slug, setSlug] = useState(props.mode === "edit" ? props.sport.slug : "")

    function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        startTransition(async () => {
            if (props.mode === "create") {
                const result = await createSportAction({
                    name,
                    slug: slug.trim() ? slug.trim() : undefined,
                })
                if (!result.ok) {
                    setError(result.error)
                    return
                }
                router.push("/sports/list")
                router.refresh()
                return
            }
            const result = await updateSportAction({
                id: props.sport.id,
                name,
                slug: slug.trim() ? slug.trim() : undefined,
            })
            if (!result.ok) {
                setError(result.error)
                return
            }
            router.push("/sports/list")
            router.refresh()
        })
    }

    const title = props.mode === "create" ? "Nuevo deporte" : "Editar deporte"

    return (
        <div className="mx-auto w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h1 className="mb-6 text-2xl font-bold text-zinc-800 dark:text-white">{title}</h1>
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
                {error ? (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
                        {error}
                    </p>
                ) : null}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="sport-name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Nombre
                    </label>
                    <input
                        id="sport-name"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={120}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="sport-slug" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Slug <span className="font-normal text-zinc-500">(opcional)</span>
                    </label>
                    <input
                        id="sport-slug"
                        name="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        maxLength={80}
                        placeholder={props.mode === "create" ? "Se genera desde el nombre si lo dejas vacío" : ""}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                    <button
                        type="submit"
                        disabled={pending}
                        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {pending ? "Guardando…" : "Guardar"}
                    </button>
                    <Link
                        href="/sports/list"
                        className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        Cancelar
                    </Link>
                </div>
            </form>
        </div>
    )
}
