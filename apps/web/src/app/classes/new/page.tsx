import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { auth } from "@/auth"
import { ClassCreateForm } from "@/components/classes/ClassCreateForm"
import type { ClassDraft } from "@/components/classes/class-draft-storage"
import { createPageMetadata } from "@/lib/seo"
import { canManageOwnedResource } from "@/lib/user-permissions"
import { trainingClassGetById } from "@/services/classes.service"
import { sportsListAll } from "@/services/sports.service"
import { trainingClassToDraft } from "@/utils/training-class-to-draft"

export const metadata: Metadata = createPageMetadata({
    title: "Nueva clase",
    description: "Creá una clase de entrenamiento y armá su secuencia de ejercicios.",
    path: "/classes/new",
    noIndex: true,
})

interface Props {
    searchParams: Promise<{ from?: string; returnTo?: string }>
}

export default async function NewClassPage({ searchParams }: Props) {
    const params = await searchParams
    const fromId = params.from?.trim() ? params.from.trim() : null
    const returnTo = params.returnTo?.trim() ? params.returnTo.trim() : null

    const [sports, session] = await Promise.all([sportsListAll(), auth()])

    let initialDraft: ClassDraft | undefined
    if (fromId) {
        if (!session?.user) notFound()

        const sourceClass = await trainingClassGetById(fromId)
        if (
            !sourceClass ||
            (!sourceClass.isPublic &&
                !canManageOwnedResource(session.user, sourceClass.creatorId))
        ) {
            notFound()
        }

        const draft = await trainingClassToDraft(sourceClass)
        initialDraft = {
            ...draft,
            title: "",
            isPublic: false,
        }
    }

    return (
        <PageRoot>
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    {returnTo ? (
                        <Link
                            href={returnTo}
                            className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                            ← Volver
                        </Link>
                    ) : (
                        <Link
                            href="/classes/mine"
                            className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                            ← Clases
                        </Link>
                    )}
                    <h1 className="mt-2 text-2xl font-bold text-zinc-800 dark:text-white">
                        {initialDraft ? "Nueva clase desde plantilla" : "Nueva clase"}
                    </h1>
                </div>
            </header>
            <Suspense
                fallback={
                    <p className="text-sm text-zinc-500">Cargando formulario…</p>
                }
            >
                <ClassCreateForm sports={sports} initialDraft={initialDraft} />
            </Suspense>
        </PageRoot>
    )
}

function PageRoot({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-8">
                {children}
            </main>
        </div>
    )
}
