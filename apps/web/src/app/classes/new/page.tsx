import { Suspense } from "react"
import Link from "next/link"

import { ClassCreateForm } from "@/components/classes/ClassCreateForm"
import { sportsListAll } from "@/services/sports.service"

export default async function NewClassPage() {
    const sports = await sportsListAll()

    return (
        <PageRoot>
            <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Link
                        href="/classes/mine"
                        className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                        ← Clases
                    </Link>
                    <h1 className="mt-2 text-2xl font-bold text-zinc-800 dark:text-white">
                        Nueva clase
                    </h1>
                </div>
            </header>
            <Suspense
                fallback={
                    <p className="text-sm text-zinc-500">Cargando formulario…</p>
                }
            >
                <ClassCreateForm sports={sports} />
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
