import Link from "next/link"
import { notFound } from "next/navigation"

import { ClassSessionRunner } from "@/components/classes/ClassSessionRunner"
import { buildClassSessionData } from "@/utils/build-class-session-data"
import { trainingClassGetById } from "@/services/classes.service"

interface Props {
    params: Promise<{ id: string }>
}

export default async function StartClassPage({ params }: Props) {
    const { id } = await params
    const trainingClass = await trainingClassGetById(id)

    if (!trainingClass) {
        notFound()
    }

    if (trainingClass.items.length === 0) {
        return (
            <PageRoot>
                <Link
                    href="/classes/mine"
                    className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
                >
                    ← Clases
                </Link>
                <p className="mt-6 text-zinc-600 dark:text-zinc-400">
                    Esta clase no tiene ejercicios.{" "}
                    <Link
                        href={`/classes/${id}/edit`}
                        className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                        Añade ejercicios
                    </Link>{" "}
                    antes de comenzar.
                </p>
            </PageRoot>
        )
    }

    const session = await buildClassSessionData(trainingClass)

    return (
        <PageRoot>
            <ClassSessionRunner session={session} />
        </PageRoot>
    )
}

function PageRoot({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
            <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-6 sm:p-8">
                {children}
            </main>
        </div>
    )
}
