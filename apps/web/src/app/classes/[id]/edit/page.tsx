import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ClassCreateForm } from "@/components/classes/ClassCreateForm"
import { trainingClassGetById } from "@/services/classes.service"
import { sportsListAll } from "@/services/sports.service"
import { trainingClassToDraft } from "@/utils/training-class-to-draft"

interface Props {
    params: Promise<{ id: string }>
}

export default async function EditClassPage({ params }: Props) {
    const { id } = await params
    const [trainingClass, sports] = await Promise.all([
        trainingClassGetById(id),
        sportsListAll(),
    ])

    if (!trainingClass) {
        notFound()
    }

    const initialDraft = trainingClassToDraft(trainingClass)

    return (
        <PageRoot>
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Link
                        href="/classes/list"
                        className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                        ← Clases
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-zinc-800 dark:text-white">
                        Editar clase
                    </h1>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {trainingClass.title}
                    </p>
                </div>
                {trainingClass.items.length > 0 ? (
                    <Link
                        href={`/classes/${id}/start`}
                        className="shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        Comenzar clase
                    </Link>
                ) : null}
            </header>
            <Suspense
                fallback={
                    <p className="text-sm text-zinc-500">Cargando formulario…</p>
                }
            >
                <ClassCreateForm
                    sports={sports}
                    mode="edit"
                    classId={id}
                    initialDraft={initialDraft}
                />
            </Suspense>
        </PageRoot>
    )
}

function PageRoot({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-8">
                {children}
            </main>
        </div>
    )
}
